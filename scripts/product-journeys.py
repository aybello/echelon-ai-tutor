#!/usr/bin/env python3
"""Production-safe anonymous product checks with evidence and explicit coverage.

Usage:
  python3 scripts/product-journeys.py --base-url https://echeloninstitute.ca \
      --courses /path/to/active-courses.json --output-dir /path/to/evidence

The manifest must come from getAllCourses().filter(course => course.isActive).
A route smoke is not an answer journey. Only representative answer/flip journeys
are interactive. No account identity or entitlement is injected. No mock exam is
started, no form submitted, and no tutor prompt or Send action is invoked.

Selectors reuse journey-checks.py's real study-card markers, plus current
QuizShell, AITutor, CourseFinder, Teams, Careers and EquipmentLab DOM contracts.
Do not import journey-checks.py: it installs a browser at import time and its
legacy restore check submits an email. Install Chromium explicitly if absent.
"""
from __future__ import annotations

import argparse
import asyncio
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import time
from typing import Any, Awaitable, Callable
from urllib.parse import unquote, urljoin, urlsplit

from playwright.async_api import async_playwright, expect

VIEWPORTS = {"desktop": {"width": 1440, "height": 900},
             "mobile": {"width": 390, "height": 844}}
SURFACES = {"quiz": "quizPath", "mock": "mockExamPath", "flashcards": "flashcardPath"}
QUICK_PROMPTS = [
    "Show the full calculation: Given, Formula and why, Substitute, Answer and Check",
    "Why exactly was I wrong?", "Give me a similar question",
    "How does this apply on the job?",
]
REGIONS = ["Ontario (MOECP / OWWCO)", "Western Canada (WPI)", "Nova Scotia (NSECC)"]
# These background writes are intentionally denied, not treated as broken UI.
EXPECTED_BACKGROUND_WRITES = {"funnelAnalytics.track", "marketingAnalytics.track",
                              "training.start", "training.heartbeat", "training.complete"}
EXPECTED_ANONYMOUS_READS = {"auth.me", "dashboardAuth.me", "teamFlex.checkoutIdentity"}
FATAL_HEADINGS = re.compile(
    r"^(?:404(?:\s*[:|-].*)?|Page not found|Not found|Something went wrong|"
    r"This page could not finish loading)$", re.I)
EMAIL = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
URL_IN_TEXT = re.compile(r"https?://[^\s\"'<>]+")


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_url(value: str) -> str:
    """No query parameters, fragments, credentials or potential tokens in evidence."""
    try:
        u = urlsplit(value)
        path = re.sub(r"(?<=/)[A-Za-z0-9_-]{48,}(?=/|$)", "[redacted]", u.path)
        return f"{u.scheme}://{u.hostname or ''}{':' + str(u.port) if u.port else ''}{path}"
    except (ValueError, TypeError):
        return "[invalid URL]"


def clean(value: Any, length: int = 1800) -> str:
    text = str(value).replace("\u2014", "-")
    text = URL_IN_TEXT.sub(lambda match: safe_url(match.group(0)), text)
    text = EMAIL.sub("[redacted-email]", text)
    text = re.sub(r"(?i)(token|cookie|authorization|password|secret)([=:]\s*)\S+",
                  r"\1\2[redacted]", text)
    return text[:length]


def procedures(url: str) -> list[str]:
    path = unquote(urlsplit(url).path)
    return path.split("/api/trpc/", 1)[1].split(",") if "/api/trpc/" in path else []


def expected_surface_state(course: dict, surface: str) -> str:
    # Existing pages expose practice to everyone, OIT previews and the free beta.
    # Other mock/flashcard pages use PurchaseGate in their current source.
    return "content" if surface == "quiz" or course.get("track") == "oit" or course.get("isFreeBeta") else "gate"


def safety_status(current: str, unexpected_write: bool) -> str:
    return "fail" if current == "fail" else "blocked" if unexpected_write else current


def expected_background_write(is_first: bool, procs: list[str]) -> bool:
    return is_first and bool(procs) and all(p in EXPECTED_BACKGROUND_WRITES for p in procs)


def telemetry_destination(url: str) -> bool:
    target = urlsplit(url)
    host = (target.hostname or "").lower()
    return target.path.rstrip("/").endswith("/umami") or any(
        host == suffix or host.endswith("." + suffix)
        for suffix in ["googletagmanager.com", "google-analytics.com", "googleadservices.com", "doubleclick.net"])


class Blocked(Exception):
    """Cannot verify this behavior without authentication, unsafe actions or data."""


@dataclass
class Task:
    name: str
    path: str
    check: Callable[[Any], Awaitable[dict[str, Any]]]
    viewport: str = "desktop"
    kind: str = "journey"
    courses: list[str] = field(default_factory=list)
    surface: str | None = None


class Audit:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.base = args.base_url.rstrip("/")
        self.origin = urlsplit(self.base).netloc
        self.output = Path(args.output_dir).resolve()
        self.output.mkdir(parents=True, exist_ok=True)
        self.results: list[dict[str, Any]] = []
        self.started = now()
        self.started_clock = time.monotonic()
        self.coverage: dict[str, Any] = {}
        self.browser = None

    def destination(self, path: str) -> str:
        if not path.startswith("/") or path.startswith("//"):
            raise ValueError(f"Expected a same-origin route: {clean(path)}")
        url = urljoin(self.base + "/", path)
        if urlsplit(url).netloc != self.origin:
            raise ValueError("Cross-origin route is not allowed")
        return url

    async def goto(self, page: Any, path: str) -> None:
        response = await page.goto(self.destination(path), wait_until="domcontentloaded",
                                   timeout=self.args.timeout_ms)
        if response is None:
            raise AssertionError("Navigation produced no document response")
        if response.status >= 400:
            raise AssertionError(f"Document returned HTTP {response.status}")
        if urlsplit(page.url).netloc != self.origin:
            raise AssertionError("Unexpected cross-origin navigation")
        await page.locator("body").wait_for(state="visible")

    async def fatal_ui(self, page: Any) -> None:
        for text in await page.locator("h1,h2").all_inner_texts():
            if FATAL_HEADINGS.match(text.strip()):
                raise AssertionError(f"Unexpected error page: {clean(text, 150)}")
        if await page.get_by_role("button", name="Retry loading questions", exact=True).is_visible():
            raise AssertionError("Question delivery error panel is visible")

    async def gate(self, page: Any) -> str | None:
        heading = page.get_by_role("heading", name=re.compile(r"^Unlock .+|^Sign in to .+", re.I)).first
        if await heading.is_visible():
            # A gate must have a real access destination, not just marketing text.
            scope = page.locator(".pg-outer")
            if not await scope.count():
                scope = page.locator("main").last
            links = scope.locator('a[href*="/pricing"],a[href*="/account"],a[href*="/login"]')
            for link in await links.all():
                if await link.is_visible():
                    await link.click(trial=True)
                    return "signed-out access gate with a reachable access link"
        return None

    async def await_surface(self, page: Any, surface: str) -> str:
        selectors = {
            "quiz": '[data-testid="practice-question"],h2',
            "mock": '.mes-start-button,h2',
            "flashcards": '[data-testid="flashcard-study-card"],h2',
        }
        # Wait on concrete state, not networkidle or arbitrary delays. h2 is
        # included only as a candidate for a source-backed access/error gate.
        await page.wait_for_function("""surface => {
          const visible = e => !!e && e.getClientRects().length &&
            getComputedStyle(e).visibility !== 'hidden';
          const question = document.querySelector('[data-testid="practice-question"]');
          const card = document.querySelector('[data-testid="flashcard-prompt"]');
          const start = document.querySelector('.mes-start-button');
          const gate = [...document.querySelectorAll('h1,h2')].some(e => visible(e) &&
            /^(Unlock .+|Sign in to .+|Something went wrong|This page could not finish loading|Page not found|404)/i.test(e.innerText));
          const failed = [...document.querySelectorAll('button')].some(e =>
            visible(e) && e.innerText.trim() === 'Retry loading questions');
          return gate || failed || (surface === 'quiz' && visible(question) && question.innerText.trim().length > 5) ||
            (surface === 'mock' && visible(start)) ||
            (surface === 'flashcards' && visible(card) && card.textContent.trim().length > 3);
        }""", arg=surface, timeout=self.args.timeout_ms)
        await self.fatal_ui(page)
        access_gate = await self.gate(page)
        if access_gate:
            return "gate"
        if surface == "quiz":
            q = page.get_by_test_id("practice-question")
            await expect(q).to_be_visible()
            if len((await q.inner_text()).strip()) < 6:
                raise AssertionError("Question stem is empty")
            options = page.locator(".qs-question-card button[aria-pressed]")
            if await options.count() < 2:
                raise AssertionError("Question rendered without at least two answer options")
            for option in await options.all():
                if len((await option.inner_text()).strip()) < 4:
                    raise AssertionError("An answer option has no answer text")
            await expect(page.get_by_role("button", name="Confirm Answer", exact=True)).to_be_visible()
            await options.first.click(trial=True)
        elif surface == "mock":
            start = page.locator(".mes-start-button")
            await expect(start).to_be_enabled()
            await start.click(trial=True)  # Never create a mock session or result.
            await expect(page.locator("h1").first).to_be_visible()
            for label in ["Questions", "Time Limit", "Pass Mark"]:
                await expect(page.get_by_text(label, exact=True).first).to_be_visible()
        else:
            await expect(page.get_by_test_id("flashcard-prompt")).to_be_visible()
            await page.get_by_test_id("flashcard-study-card").click(trial=True)
        return "content"

    def smoke(self, path: str, surface: str, expected_state: str) -> Callable:
        async def check(page: Any) -> dict[str, Any]:
            await self.goto(page, path)
            state = await self.await_surface(page, surface)
            if state != expected_state:
                raise AssertionError(f"Expected signed-out {expected_state}, observed {state} for {path}")
            details = {"quiz": "Question stem, answer options and Confirm Answer rendered",
                       "mock": "Real enabled Start Exam control and exam metadata rendered; not started",
                       "flashcards": "Non-empty study-card prompt and actionable flip target rendered"}
            return {"detail": "Valid signed-out gate rendered" if state == "gate" else details[surface],
                    "observedState": state, "expectedState": expected_state, "depth": "route-render-only"}
        return check

    def quiz(self, path: str) -> Callable:
        async def check(page: Any) -> dict[str, Any]:
            await self.goto(page, path)
            if await self.await_surface(page, "quiz") == "gate":
                raise Blocked("Correct signed-out gate; anonymous answer flow cannot be exercised")
            q = page.get_by_test_id("practice-question")
            before = await q.inner_text()
            before_id = await q.get_attribute("data-question-id")
            choice = page.locator(".qs-question-card button[aria-pressed]").first
            await choice.click()
            await expect(choice).to_have_attribute("aria-pressed", "true")
            confirm = page.get_by_role("button", name="Confirm Answer", exact=True)
            await expect(confirm).to_be_enabled()
            async with page.expect_response(lambda response: "quiz.logAttempt" in procedures(response.url)) as scored:
                await confirm.click()
            scoring = await scored.value
            body = await scoring.json()
            entries = body if isinstance(body, list) else [body]
            if scoring.status >= 400 or not any(
                entry.get("result", {}).get("data", {}).get("json", {}).get("success") is True
                for entry in entries if isinstance(entry, dict)
            ):
                raise AssertionError("Anonymous practice scoring did not return success")
            explanation = page.locator(".practice-explanation")
            await expect(explanation).to_be_visible()
            await expect(explanation).to_contain_text(re.compile(r"Correct!|Incorrect"))
            content = page.locator(".practice-explanation-content")
            if not await content.count() or len((await content.inner_text()).strip()) < 15:
                raise AssertionError("Answer result lacks substantive explanation content")
            await page.get_by_role("button", name="Next Question", exact=False).click()
            await page.wait_for_function("""old => {
              const q = document.querySelector('[data-testid="practice-question"]');
              return q && q.innerText.trim() &&
                (q.innerText !== old.text || (old.id && q.dataset.questionId !== old.id));
            }""", arg={"text": before, "id": before_id}, timeout=self.args.timeout_ms)
            await expect(page.get_by_role("button", name="Confirm Answer", exact=True)).to_be_visible()
            await expect(page.locator(".practice-explanation")).to_have_count(0)
            return {"detail": "Guest selected an answer, confirmed, read a substantive explanation and advanced to a different question",
                    "steps": ["question", "choose", "confirm", "explanation", "next"],
                    "depth": "representative-anonymous-answer", "coursePath": path}
        return check

    async def in_view(self, page: Any, locator: Any, label: str) -> None:
        await expect(locator).to_be_visible()
        box = await locator.bounding_box()
        view = page.viewport_size
        if not box or box["x"] < -1 or box["y"] < -1 or \
                box["x"] + box["width"] > view["width"] + 1 or \
                box["y"] + box["height"] > view["height"] + 1:
            raise AssertionError(f"{label} is clipped or outside the viewport")

    async def centre_target(self, locator: Any, label: str) -> None:
        await locator.click(trial=True)
        hit = await locator.evaluate("""e => {
          const r=e.getBoundingClientRect();
          const x=r.x+r.width/2,y=r.y+r.height/2;
          const hit=document.elementFromPoint(x,y);
          return {reachable: !!hit && (hit === e || e.contains(hit)),
                  width:r.width,height:r.height};
        }""")
        if not hit["reachable"] or hit["width"] < 20 or hit["height"] < 20:
            raise AssertionError(f"{label} centre is obstructed or hit target is smaller than 20px")

    def tutor(self, path: str) -> Callable:
        async def check(page: Any) -> dict[str, Any]:
            await self.goto(page, path + ("&" if "?" in path else "?") + "panel=tutor")
            if await self.await_surface(page, "quiz") == "gate":
                raise Blocked("Signed-out gate prevents tutor UI inspection")
            panel = page.get_by_role("complementary", name="AI Tutor", exact=True)
            await self.in_view(page, panel, "Tutor panel")
            prompts = panel.locator(".ai-tutor-prompts button")
            await expect(prompts).to_have_count(4)
            sizes = []
            for text in QUICK_PROMPTS:
                prompt = panel.get_by_role("button", name=text, exact=True)
                await self.in_view(page, prompt, "Quick prompt")
                await self.centre_target(prompt, "Quick prompt")
                box = await prompt.bounding_box()
                sizes.append({"width": round(box["width"]), "height": round(box["height"])})
            composer = panel.get_by_role("textbox", name="Ask the AI Tutor", exact=True)
            await self.in_view(page, composer, "Tutor composer")
            await self.centre_target(composer, "Tutor composer")
            await composer.fill("Synthetic audit text, do not send")
            send = panel.get_by_role("button", name="Send", exact=True)
            await expect(send).to_be_enabled()
            await self.in_view(page, send, "Tutor Send button")
            await self.centre_target(send, "Tutor Send button")
            await composer.fill("")
            await composer.press("Escape")
            await expect(panel).to_have_count(0)
            if "panel=tutor" in page.url:
                raise AssertionError("Escape closed tutor but left its reopening URL parameter")
            return {"detail": "Four quick prompts have reachable centres; panel, composer and Send fit viewport; Escape closes and removes deep-link parameter. No prompt or Send invoked",
                    "promptHitTargets": sizes, "depth": "tutor-ui-only-no-llm"}
        return check

    def flashcards(self, path: str) -> Callable:
        async def check(page: Any) -> dict[str, Any]:
            await self.goto(page, path)
            if await self.await_surface(page, "flashcards") == "gate":
                raise Blocked("Signed-out gate prevents a representative card flip")
            card = page.get_by_test_id("flashcard-study-card")
            prompt = await page.get_by_test_id("flashcard-prompt").inner_text()
            await card.click()
            await expect(card).to_have_attribute("aria-pressed", "true")
            answer = card.locator(".fc-back")
            await expect(answer).to_be_visible()
            answer_parts = answer.locator(":scope > div")
            if await answer_parts.count() < 3 or len((await answer_parts.nth(1).inner_text()).strip()) < 2:
                raise AssertionError("Flipped card has no answer content")
            learning = page.get_by_role("button", name="Still Learning", exact=True)
            got_it = page.get_by_role("button", name="Got It!", exact=True)
            await expect(learning).to_be_visible()
            await expect(got_it).to_be_visible()
            await got_it.click(trial=True)
            await learning.click()  # Guest state only, isolated context, no account identity.
            await expect(card).to_have_attribute("aria-pressed", "false")
            await page.wait_for_function("""old => {
              const p=document.querySelector('[data-testid="flashcard-prompt"]');
              return p && p.innerText.trim() && p.innerText !== old;
            }""", arg=prompt, timeout=self.args.timeout_ms)
            return {"detail": "Card flip reveals answer and learning controls; guest Still Learning advances to a different prompt",
                    "depth": "representative-anonymous-flip"}
        return check

    async def navigation(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/")
        await expect(page.locator("h1").first).to_be_visible()
        finder = page.locator(".course-finder")
        await expect(finder).to_be_visible()
        nav = page.get_by_role("navigation", name="Global navigation", exact=True)
        await expect(nav).to_be_visible()
        if page.viewport_size["width"] < 720:
            await page.get_by_role("button", name="Open navigation menu", exact=True).click()
            jobs = page.locator(".echelon-mobile-menu a[href='/jobs']")
            # Menu CSS name is source-backed; fallback scopes to visible menu link.
            if not await jobs.count():
                jobs = page.locator("a[href='/jobs']:visible").last
            await expect(jobs).to_be_visible()
            await jobs.click()
        else:
            await nav.get_by_role("link", name="Jobs", exact=True).click()
        await expect(page).to_have_url(re.compile(r"/jobs(?:[?#]|$)"))
        await expect(page.get_by_role("heading", name="Water & Wastewater Operator Jobs in Canada", exact=True)).to_be_visible()
        await self.goto(page, "/")
        await finder.locator("select").nth(0).select_option("on")
        await finder.locator("select").nth(1).select_option("water-treatment")
        await finder.locator("select").nth(2).select_option("oit")
        await expect(finder.get_by_role("link", name="Try this course", exact=False)).to_be_visible()
        await page.reload(wait_until="domcontentloaded")
        await expect(finder.locator("select").nth(2)).to_have_value("oit")
        target = finder.get_by_role("link", name="Try this course", exact=False)
        if urlsplit(urljoin(page.url, await target.get_attribute("href"))).path != "/quiz":
            raise AssertionError("Course finder selected OIT but points at a different course")
        await target.click()
        state = await self.await_surface(page, "quiz")
        return {"detail": "Core Jobs navigation works; province, system and level selection survives reload and opens the selected OIT course",
                "selectedCourseState": state, "depth": "navigation-and-course-selection"}

    async def select_region(self, page: Any, label: str) -> None:
        await page.locator("main").last.get_by_role("combobox").first.click()
        await page.get_by_role("option", name=label, exact=True).click()
        await expect(page.locator("main").last.get_by_role("combobox").first).to_contain_text(label)

    async def employer_only(self, page: Any) -> None:
        main = page.locator("body")
        bad = []
        for link in await main.locator("a[href]").all():
            href = await link.get_attribute("href") or ""
            if await link.is_visible() and urlsplit(urljoin(page.url, href)).path.startswith("/pricing"):
                bad.append(safe_url(urljoin(page.url, href)))
        text = await main.inner_text()
        individual_ad = re.search(r"Individual Exam Pass|Buy (?:an? )?Individual|Individual (?:plans?|pricing)", text, re.I)
        if bad or individual_ad:
            raise AssertionError("Individual pricing advertisement/link on employer page: " + clean(bad or individual_ad.group()))

    async def teams(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/teams")
        await expect(page.get_by_role("heading", name="Configure an annual plan", exact=True)).to_be_visible()
        await self.employer_only(page)
        for region in REGIONS:
            await self.select_region(page, region)
            scope = page.locator("main").last.get_by_role("button", name=re.compile(r"^Water Treatment\b"))
            await scope.click()
            await expect(page.locator("main").last).to_contain_text("Total before tax")
            if region.startswith("Nova Scotia"):
                await expect(page.locator("main").last).to_contain_text("Water Distribution and Wastewater Collection Classes I to III")
        await page.get_by_role("button", name=re.compile(r"^Teams Flex\b")).click()
        await expect(page.get_by_text("Build a Teams Flex order", exact=True)).to_be_visible()
        observations = []
        for region in REGIONS:
            await self.select_region(page, region)
            course = page.locator("main").last.get_by_role("combobox").nth(1)
            await expect(course).to_contain_text("Select a released course")
            await expect(course).to_be_visible()
            await course.click()
            options = page.get_by_role("option")
            await expect(options.first).to_be_visible()
            labels = await options.all_inner_texts()
            if region.startswith("Nova Scotia"):
                forbidden = [s for s in labels if re.search(r"Class\s*(?:4|IV)\s*(?:Water Distribution|Wastewater Collection)", s, re.I)]
                if forbidden:
                    raise AssertionError("Nova Scotia Flex offers unsupported Class IV distribution/collection")
                if not any(re.search(r"Class\s*(?:3|III).*Distribution", s, re.I) for s in labels):
                    raise AssertionError("Nova Scotia Flex is missing Class III distribution scope")
            first_label = labels[0]
            await options.first.click()
            await expect(course).to_contain_text(first_label)
            await expect(page.locator("main").last).to_contain_text("Total before tax")
            observations.append({"region": region, "availableCourseCount": len(labels)})
        await self.employer_only(page)
        menu_button = page.get_by_role("button", name="Open navigation menu", exact=True)
        if await menu_button.is_visible():
            await page.evaluate("window.scrollTo(0, 0)")
            await menu_button.click()
            await expect(page.locator(".echelon-mobile-menu")).to_be_visible()
            await self.employer_only(page)
        return {"detail": "Employer page and open mobile navigation have no individual pricing ads/links; Annual and Flex region/course selectors work for Ontario, Western Canada and Nova Scotia. No checkout or inquiry submitted",
                "flexRegions": observations, "depth": "employer-configuration-only"}

    async def jobs(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/jobs")
        await expect(page.get_by_role("heading", name="Water & Wastewater Operator Jobs in Canada", exact=True)).to_be_visible()
        await page.wait_for_function("""() => {
          const card=document.querySelector('button h2');
          return !!card || /No jobs found|No positions|Unable to load|could not load/i.test(document.body.innerText);
        }""", timeout=self.args.timeout_ms)
        cards = page.locator("button").filter(has=page.locator("h2"))
        if not await cards.count():
            raise Blocked("No usable live job card; job detail and apply destination not verified")
        await cards.first.click()
        posting = page.get_by_role("link", name="View Full Posting", exact=False)
        await expect(posting).to_be_visible()
        href = await posting.get_attribute("href") or ""
        u = urlsplit(href)
        if u.scheme not in {"http", "https"} or not u.hostname or u.username or u.password or \
                u.hostname in {"localhost", "example.com", "example.test"} or u.path in {"", "/"}:
            raise AssertionError("Job detail has an invalid or non-specific apply/posting destination")
        await posting.click(trial=True)
        if await posting.get_attribute("target") == "_blank":
            rel = await posting.get_attribute("rel") or ""
            if "noopener" not in rel:
                raise AssertionError("External posting opens a new tab without noopener")
        await page.get_by_role("button", name="Close", exact=True).click()
        await expect(posting).to_have_count(0)
        return {"detail": "Live job card opens detail with a reachable, specific HTTP(S) employer posting URL. Destination inspected only, not fetched or applied",
                "postingDestination": safe_url(href), "depth": "list-detail-link-inspection"}

    async def account(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/account")
        email = page.locator('input[type="email"]').first
        await expect(email).to_be_visible()
        await email.fill("audit@echelon.test")
        await expect(email).to_have_value("audit@echelon.test")
        if not await email.evaluate("e => e.checkValidity()"):
            raise AssertionError("Restore form rejects a syntactically valid synthetic email")
        action = page.get_by_role("button", name="Sign In with Code", exact=False)
        await expect(action).to_be_visible()
        await expect(action).to_be_enabled()
        await action.click(trial=True)
        await email.fill("")
        return {"detail": "Restore form accepts a valid synthetic email and exposes a reachable sign-in control. Form was not submitted and no OTP/email requested",
                "depth": "form-input-only"}

    async def formulas(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/formulas")
        await expect(page.get_by_role("heading", name="Formula Sheet", exact=True)).to_be_visible()
        content = page.locator(".formulas-content")
        await expect(content).to_be_visible()
        await expect(content).to_contain_text("Q = A × V")
        await page.get_by_role("button", name="Expand All", exact=False).click()
        await expect(content).to_contain_text("WORKED EXAMPLE")
        # Scroll the actual last formula card into view. This exercises nested
        # overflow containers too, unlike checking document.scrollY alone.
        last_formula = content.get_by_text("WORKED EXAMPLE", exact=True).last
        await last_formula.scroll_into_view_if_needed()
        await self.in_view(page, last_formula, "Last formula worked example")
        overflow = await page.evaluate("document.documentElement.scrollWidth - innerWidth")
        if overflow > 2:
            raise AssertionError(f"Formula page has {overflow}px horizontal viewport overflow")
        return {"detail": "Real formula content and expanded worked examples render; final formula example is scroll-reachable without horizontal viewport overflow",
                "depth": "formula-render-expand-scroll"}

    async def equipment(self, page: Any) -> dict[str, Any]:
        await self.goto(page, "/equipment-lab")
        await expect(page.get_by_role("heading", name="Inside a circular clarifier", exact=True)).to_be_visible()
        await page.wait_for_function("""() => {
          const c=document.querySelector('canvas[data-scene-ready="true"]');
          const s=document.querySelector('svg[aria-label="Interactive circular clarifier illustration"]');
          return !!((c && c.width > 0 && c.height > 0) || (s && s.getClientRects().length));
        }""", timeout=self.args.timeout_ms)
        canvas = page.locator('canvas[data-scene-ready="true"]')
        if await canvas.is_visible():
            target, mode = canvas, "3d-scene-ready-canvas"
        else:
            target = page.get_by_role("img", name="Interactive circular clarifier illustration", exact=True)
            await expect(target).to_be_visible()
            mode = "accessible-svg-fallback"
        await target.scroll_into_view_if_needed()
        image = self.output / ("equipment-" + str(page.viewport_size["width"]) + ".png")
        await target.screenshot(path=str(image))
        return {"detail": "Equipment Lab renders a scene-ready canvas or source-backed accessible SVG fallback. Screenshot captured for human visual review; visual/model accuracy is not asserted",
                "renderMode": mode, "screenshot": str(image), "depth": "model-render-only"}

    async def screenshot(self, page: Any, name: str) -> str | None:
        path = self.output / (re.sub(r"[^a-zA-Z0-9_-]", "-", name)[:100] + "-" +
                              hashlib.sha256(name.encode()).hexdigest()[:8] + ".png")
        try:
            # Redact all inputs and arbitrary user-content surfaces even though
            # each context is anonymous. Never export HTML, cookies or storage.
            await page.screenshot(path=str(path), full_page=False, timeout=6000,
                                  mask=[page.locator("input,textarea,[contenteditable=true]")])
            return str(path)
        except Exception:
            return None

    async def run_task(self, task: Task, semaphore: asyncio.Semaphore) -> None:
        async with semaphore:
            start = time.monotonic()
            result: dict[str, Any] = {"name": task.name, "status": "blocked", "detail": "Not completed",
                                      "kind": task.kind, "viewport": task.viewport,
                                      "viewportSize": VIEWPORTS[task.viewport], "courseKeys": task.courses,
                                      "url": safe_url(self.destination(task.path))}
            if task.surface:
                result["surface"] = task.surface
            runtime: dict[str, list[Any]] = {"pageErrors": [], "failedFirstPartyChunks": [],
                "failedFirstPartyRequests": [], "firstPartyHttpErrors": [],
                "consoleErrors": [], "safetyBlockedRequests": []}
            context = None
            page = None
            guarded: set[str] = set()
            finishing = False

            async def safety(route: Any) -> None:
                request = route.request
                procs = procedures(request.url)
                is_first = urlsplit(request.url).netloc == self.origin
                if telemetry_destination(request.url):
                    guarded.add(request.url)
                    runtime["safetyBlockedRequests"].append({"url": safe_url(request.url),
                        "method": request.method, "expectedBackground": True})
                    await route.abort("blockedbyclient")
                    return
                # Source contract: quizRouter.logAttempt returns scored success
                # before inserting history when no verified identity is present.
                # These fresh contexts never authenticate or inject access data.
                guest_score = is_first and procs == ["quiz.logAttempt"] and request.method == "POST"
                if guest_score:
                    try:
                        payload = request.post_data_json
                        serialized = json.dumps(payload)
                        if re.search(r'"(?:email|accessToken|guestToken)"\s*:\s*"[^\"]+', serialized):
                            guest_score = False
                    except Exception:
                        guest_score = False
                dangerous = any(re.search(r"(?i)(tutor\.(?:chat|saveSession)|create.*checkout|createOrder|"
                    r"requestOtp|sendOtp|sendCode|contact\.|municipal\.request|"
                    r"mock(?:Exam)?\.(?:start|submit|finish)|exam\.(?:start|submit))", p) for p in procs)
                if not guest_score and (request.method not in {"GET", "HEAD", "OPTIONS"} or dangerous):
                    guarded.add(request.url)
                    expected = expected_background_write(is_first, procs)
                    runtime["safetyBlockedRequests"].append({"url": safe_url(request.url),
                        "method": request.method, "expectedBackground": expected})
                    # Fail closed without faking a successful API result. Never
                    # send these writes to production, including training records.
                    await route.fulfill(status=403, content_type="application/json",
                                        body='{"error":"Blocked by anonymous product audit safety policy"}')
                    return
                await route.continue_()

            def pageerror(error: Any) -> None:
                if not finishing:
                    runtime["pageErrors"].append(clean(error))

            def failed(request: Any) -> None:
                if finishing or urlsplit(request.url).netloc != self.origin or request.url in guarded:
                    return
                entry = {"url": safe_url(request.url), "resourceType": request.resource_type,
                         "failure": clean(request.failure or "Unknown failure", 500)}
                runtime["failedFirstPartyRequests"].append(entry)
                if request.resource_type in {"script", "stylesheet"}:
                    runtime["failedFirstPartyChunks"].append(entry)

            def response_error(response: Any) -> None:
                if finishing or response.status < 400 or urlsplit(response.url).netloc != self.origin or response.url in guarded:
                    return
                procs = procedures(response.url)
                expected = response.status in {401, 403} and bool(procs) and all(p in EXPECTED_ANONYMOUS_READS for p in procs)
                entry = {"url": safe_url(response.url), "status": response.status,
                         "resourceType": response.request.resource_type,
                         "expectedAnonymousGate": expected}
                runtime["firstPartyHttpErrors"].append(entry)
                if response.request.resource_type in {"script", "stylesheet"}:
                    runtime["failedFirstPartyChunks"].append(entry)

            try:
                context = await self.browser.new_context(viewport=VIEWPORTS[task.viewport],
                    is_mobile=task.viewport == "mobile", has_touch=task.viewport == "mobile",
                    service_workers="block", accept_downloads=False,
                    user_agent="EchelonProductAudit/1.0")
                await context.route("**/*", safety)
                page = await context.new_page()
                page.set_default_timeout(self.args.timeout_ms)
                page.set_default_navigation_timeout(self.args.timeout_ms)
                page.on("pageerror", pageerror)
                page.on("requestfailed", failed)
                page.on("response", response_error)
                page.on("console", lambda message: runtime["consoleErrors"].append(clean(message.text, 700))
                        if message.type == "error" and not finishing else None)
                payload = await asyncio.wait_for(task.check(page), timeout=self.args.route_timeout_seconds if task.kind == "route-smoke" else self.args.journey_timeout_seconds)
                await self.fatal_ui(page)
                result.update(payload)
                result["status"] = "pass"
            except Blocked as error:
                result.update(status="blocked", detail=clean(error))
            except asyncio.CancelledError:
                result.update(status="blocked", detail="Overall audit deadline reached; check not completed")
            except asyncio.TimeoutError:
                result.update(status="fail", detail="Concrete UI condition or bounded route/journey deadline timed out")
            except Exception as error:
                result.update(status="fail", detail=clean(error))
            finally:
                if runtime["pageErrors"] or runtime["failedFirstPartyChunks"]:
                    result.update(status="fail", detail=clean(result["detail"] + "; unexpected page exception or failed first-party code/style chunk"))
                unexpected_writes = [r for r in runtime["safetyBlockedRequests"] if not r["expectedBackground"]]
                if unexpected_writes:
                    result.update(status=safety_status(result["status"], True),
                        detail=clean(result["detail"] + "; unexpected write was stopped by safety policy; behavior not fully verified"))
                read_errors = [r for r in runtime["firstPartyHttpErrors"] if not r["expectedAnonymousGate"]]
                if result["status"] == "pass" and (read_errors or runtime["failedFirstPartyRequests"]):
                    result.update(status="warn", detail=clean(result["detail"] + "; non-chunk first-party resource/API failures require review"))
                if page:
                    result["url"] = safe_url(page.url)
                    if result["status"] in {"fail", "blocked", "warn"}:
                        image = await self.screenshot(page, task.name)
                        if image:
                            result["screenshot"] = image
                finishing = True  # Ignore intentional context-close aborts only.
                if context:
                    try:
                        await asyncio.wait_for(context.close(), timeout=8)
                    except Exception:
                        pass
                result["durationMs"] = round((time.monotonic() - start) * 1000)
                result["runtime"] = {k: v[:30] for k, v in runtime.items() if v}
                self.results.append(result)
                self.write_report()
                print(f"[{result['status'].upper()}] {task.name}: {clean(result['detail'], 210).splitlines()[0]}", flush=True)

    def write_report(self) -> None:
        counts = Counter(result["status"] for result in self.results)
        smoke = [r for r in self.results if r.get("kind") == "route-smoke"]
        report = {"schemaVersion": 1, "timestamp": now(), "startedAt": self.started,
            "baseUrl": self.base, "durationMs": round((time.monotonic() - self.started_clock) * 1000),
            "coverage": {**self.coverage, "routeSmokesCompleted": len(smoke),
                         "routeSmokeStates": dict(Counter(r.get("observedState", r["status"]) for r in smoke)),
                         "representativeJourneyResults": len(self.results) - len(smoke)},
            "safety": {"anonymousFreshContexts": True, "noInjectedIdentityOrEntitlements": True,
                       "firstPartyWritesDeniedExceptAnonymousPracticeScoring": True, "tutorLlmInvoked": False,
                       "mockExamsStarted": False, "formsSubmitted": False,
                       "note": "Only quiz.logAttempt is allowed: its source-verified guest branch scores without saving learner history. All other first-party writes, including background telemetry/training, are denied and enumerated. No success response is fabricated. Screenshots contain public anonymous UI with inputs masked."},
            "summary": {status: counts[status] for status in ["pass", "fail", "warn", "blocked", "skipped"]},
            "results": self.results}
        temporary = self.output / "product-journeys.json.tmp"
        temporary.write_text(json.dumps(report, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
        temporary.replace(self.output / "product-journeys.json")

    def plan(self, manifest: Any) -> list[Task]:
        if isinstance(manifest, dict):
            manifest = manifest.get("courses", manifest.get("activeCourses"))
        if not isinstance(manifest, list) or not manifest:
            raise ValueError("Course manifest must be a non-empty array, or an object with courses/activeCourses array")
        courses = [c for c in manifest if isinstance(c, dict) and c.get("isActive", True) is True]
        if not courses or any(not isinstance(c.get("courseKey"), str) for c in courses):
            raise ValueError("Active manifest courses require courseKey")
        if len({c["courseKey"] for c in courses}) != len(courses):
            raise ValueError("Manifest contains duplicate courseKey values")
        selected = courses[:self.args.limit_courses] if self.args.limit_courses else courses
        routes: dict[tuple[str, str], list[str]] = {}
        missing = []
        for course in selected:
            for surface, key in SURFACES.items():
                path = course.get(key)
                if path is None and surface == "flashcards":
                    missing.append({"courseKey": course["courseKey"], "surface": surface, "reason": "Not offered in manifest"})
                    continue
                if not isinstance(path, str) or not path:
                    raise ValueError(f"{course['courseKey']} is missing required {key}")
                self.destination(path)
                routes.setdefault((surface, path), []).append(course["courseKey"])
        by_key = {course["courseKey"]: course for course in selected}
        tasks = [Task(f"route/{surface}/{'+'.join(keys)}", path, self.smoke(path, surface, expected_surface_state(by_key[keys[0]], surface)),
                      kind="route-smoke", courses=keys, surface=surface)
                 for (surface, path), keys in routes.items()]
        # Choose at most three genuinely representative study families, not all
        # courses. All selected courses still receive their separate route smoke.
        reps = []
        for candidate in [next((c for c in selected if c["courseKey"] == "oit"), None),
                          next((c for c in selected if c.get("examFamily") == "western"), None),
                          selected[0]]:
            if candidate and candidate["courseKey"] not in {c["courseKey"] for c in reps}:
                reps.append(candidate)
        for view in VIEWPORTS:
            for course in reps:
                key, path = course["courseKey"], course["quizPath"]
                tasks.append(Task(f"journey/{view}/answer/{key}", path, self.quiz(path), view, courses=[key]))
                flash = course.get("flashcardPath")
                if flash:
                    tasks.append(Task(f"journey/{view}/flashcard/{key}", flash, self.flashcards(flash), view, courses=[key]))
            tutor_course = reps[0]
            tasks.append(Task(f"journey/{view}/tutor-ui/{tutor_course['courseKey']}", tutor_course["quizPath"], self.tutor(tutor_course["quizPath"]), view, courses=[tutor_course["courseKey"]]))
            for name, path, check in [("navigation", "/", self.navigation), ("teams", "/teams", self.teams),
                ("jobs", "/jobs", self.jobs), ("restore-form", "/account", self.account),
                ("formulas-scroll", "/formulas", self.formulas), ("equipment-render", "/equipment-lab", self.equipment)]:
                tasks.append(Task(f"journey/{view}/{name}", path, check, view))
        self.coverage = {"scope": "partial" if len(selected) < len(courses) else "full-active-route-matrix",
            "activeCoursesInManifest": len(courses), "selectedCourseCount": len(selected),
            "selectedCourseKeys": [c["courseKey"] for c in selected],
            "omittedCourseKeys": [c["courseKey"] for c in courses if c not in selected],
            "uniqueRoutesPlanned": len(routes), "deduplicatedBy": ["surface", "path"],
            "surfaceRouteCounts": dict(Counter(s for s, _ in routes)),
            "manifestUnavailableSurfaces": missing, "representativeAnswerCourseKeys": [c["courseKey"] for c in reps],
            "plannedChecks": len(tasks), "viewports": VIEWPORTS,
            "depthNote": "Full means every active route was scheduled for DOM smoke, not full course flow coverage. Only named representative courses have guest answer/flip journeys. Authenticated, paid, submission and LLM behavior are not tested."}
        # Run core desktop/mobile journeys first so route failures cannot starve them.
        return sorted(tasks, key=lambda t: t.kind == "route-smoke")

    async def run(self) -> int:
        tasks: list[Task] = []
        try:
            manifest = json.loads(Path(self.args.courses).read_text(encoding="utf-8"))
            tasks = self.plan(manifest)
            self.write_report()
            print(f"Product journeys: {self.coverage['scope']}; {self.coverage['selectedCourseCount']}/{self.coverage['activeCoursesInManifest']} active courses; {self.coverage['uniqueRoutesPlanned']} unique route smokes; concurrency {self.args.concurrency}", flush=True)
            expect.set_options(timeout=self.args.timeout_ms)
            async with async_playwright() as playwright:
                self.browser = await playwright.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
                semaphore = asyncio.Semaphore(self.args.concurrency)
                pending = [asyncio.create_task(self.run_task(t, semaphore)) for t in tasks]
                done, not_done = await asyncio.wait(pending, timeout=self.args.max_seconds)
                if not_done:
                    for job in not_done:
                        job.cancel()
                    await asyncio.gather(*not_done, return_exceptions=True)
                for job in done:
                    if not job.cancelled() and job.exception():
                        raise job.exception()
                await self.browser.close()
        except Exception as error:
            self.results.append({"name": "browser-or-manifest-setup", "status": "blocked",
                                 "detail": clean(error), "kind": "setup"})
            print("[BLOCKED] " + clean(error, 300).splitlines()[0], flush=True)
        finally:
            completed = {r["name"] for r in self.results}
            for task in tasks:
                if task.name not in completed:
                    self.results.append({"name": task.name, "status": "blocked", "kind": task.kind,
                        "detail": "Not executed before setup failure or overall deadline", "viewport": task.viewport,
                        "courseKeys": task.courses, "surface": task.surface, "url": safe_url(self.destination(task.path))})
            self.coverage["completedAllPlannedChecks"] = bool(tasks) and all(r.get("detail") != "Not executed before setup failure or overall deadline" for r in self.results)
            self.write_report()
        counts = Counter(r["status"] for r in self.results)
        print("Product journey summary: " + ", ".join(f"{counts[s]} {s}" for s in ["pass", "fail", "warn", "blocked", "skipped"]), flush=True)
        print(f"Evidence: {self.output / 'product-journeys.json'}", flush=True)
        return 1 if counts["fail"] or counts["blocked"] else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", default="https://echeloninstitute.ca")
    parser.add_argument("--courses", required=True, help="Actual active course registry JSON manifest")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--limit-courses", type=int, default=0, help="Targeted partial smoke; 0 checks all manifest courses")
    parser.add_argument("--concurrency", type=int, choices=[1, 2, 3], default=3)
    parser.add_argument("--timeout-ms", type=int, default=30000, help="Concrete UI wait timeout")
    parser.add_argument("--route-timeout-seconds", type=int, default=55)
    parser.add_argument("--journey-timeout-seconds", type=int, default=100)
    parser.add_argument("--max-seconds", type=int, default=840, help="Total execution deadline, capped at 15 minutes")
    args = parser.parse_args()
    u = urlsplit(args.base_url)
    if u.scheme not in {"http", "https"} or not u.hostname or u.username or u.password or u.query or u.fragment or u.path not in {"", "/"}:
        parser.error("--base-url must be an HTTP(S) origin without credentials, path or query")
    if args.limit_courses < 0 or not 1000 <= args.timeout_ms <= 60000 or not 1 <= args.max_seconds <= 900 or \
            not 1 <= args.route_timeout_seconds <= 120 or not 1 <= args.journey_timeout_seconds <= 180:
        parser.error("Invalid limit/deadline; use positive bounded timeouts and 0 or more limit-courses")
    return asyncio.run(Audit(args).run())


if __name__ == "__main__":
    sys.exit(main())
