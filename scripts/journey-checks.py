#!/usr/bin/env python3
"""
Echelon AI Tutor — User Journey Checks
Runs headless Playwright tests against the live production site.
Exit code 0 = all passed, 1 = one or more failed.

Usage:
  python3 scripts/journey-checks.py
  python3 scripts/journey-checks.py --base-url https://echeloninstitute.ca
"""
import sys
import time
import argparse
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# ── Config ────────────────────────────────────────────────────────────────────
DEFAULT_BASE = "https://echeloninstitute.ca"
TIMEOUT = 20_000  # ms per action

results = []

def ok(name, detail=""):
    results.append(("PASS", name, detail))
    print(f"  ✅ {name}" + (f" — {detail}" if detail else ""))

def fail(name, detail=""):
    results.append(("FAIL", name, detail))
    print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))

# ── Helpers ───────────────────────────────────────────────────────────────────
def clear_echelon_storage(page):
    """Remove all echelon_* localStorage keys to simulate a fresh/stale-cache user."""
    page.evaluate("""() => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('echelon_'));
        keys.forEach(k => localStorage.removeItem(k));
    }""")

# ── Journey 1: Homepage loads ─────────────────────────────────────────────────
def check_homepage(page, base):
    name = "Homepage loads"
    try:
        page.goto(base, timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        title = page.title()
        if not title:
            raise AssertionError("Page title is empty")
        page.wait_for_selector("nav", timeout=TIMEOUT)
        ok(name, f'title="{title[:60]}"')
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 2: Pricing page loads with cards ──────────────────────────────────
def check_pricing(page, base):
    name = "Pricing page — cards render"
    try:
        page.goto(f"{base}/pricing", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        # First verify subscriptions section loads
        page.wait_for_selector("text=Annual All-Access", timeout=TIMEOUT)
        # Click the toggle to expand individual practice passes (they are collapsed by default)
        toggle = page.locator("text=View individual practice passes").first
        if toggle.is_visible():
            toggle.click()
            page.wait_for_timeout(1500)  # wait for expand animation
        # Now check for One-time badge
        count = page.get_by_text("One-time · no subscription", exact=True).count()
        if count == 0:
            count = page.locator(":text('One-time')").count()
        if count == 0:
            raise AssertionError("'One-time · no subscription' badge not found after expanding individual passes")
        # Also verify at least one price is shown
        price_text = page.evaluate("() => document.body.innerText")
        if "CA$" not in price_text and "49" not in price_text:
            raise AssertionError("No prices found on pricing page")
        ok(name, f"{count} cards with one-time badge")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 3: OIT quiz loads with multi-module questions (fresh user) ────────
def check_oit_trial_modules(page, base):
    name = "OIT trial — questions from multiple modules"
    try:
        page.goto(f"{base}/quiz", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        # Clear any stale cache to simulate fresh user
        clear_echelon_storage(page)
        page.reload(timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        # Wait for questions to load
        page.wait_for_selector("button", timeout=TIMEOUT)
        # Give the background fetch time to complete and merge live data
        time.sleep(4)
        # Check that multiple modules are visible in the page
        page_text = page.inner_text("body")
        modules_found = []
        for mod in ["Disinfection", "Hydraulics", "Regulations", "Math", "Health & Safety", "Wastewater", "Water Quality"]:
            if mod in page_text:
                modules_found.append(mod)
        if len(modules_found) < 2:
            raise AssertionError(f"Only found modules: {modules_found} — expected 2+")
        ok(name, f"modules visible: {', '.join(modules_found[:4])}")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 4: Answer highlighting works ─────────────────────────────────────
def check_answer_highlighting(page, base):
    name = "Answer highlighting — explanation shown after answer"
    try:
        page.goto(f"{base}/quiz", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        clear_echelon_storage(page)
        page.reload(timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        # Wait for quiz to fully load — wait for the question text to appear
        # The quiz renders a question stem before answer options
        time.sleep(5)
        # Answer buttons are rendered as 'A.\nText', 'B.\nText' etc.
        # Find them by looking for buttons starting with A., B., C., D.
        clicked = page.evaluate("""
            () => {
                const buttons = Array.from(document.querySelectorAll('button'));
                // Answer options start with A., B., C., or D.
                const answerBtn = buttons.find(b => {
                    const t = b.innerText.trim();
                    const rect = b.getBoundingClientRect();
                    return rect.width > 50 && /^[A-D][.\\n]/.test(t);
                });
                if (answerBtn) { answerBtn.click(); return answerBtn.innerText.trim().slice(0, 60); }
                return null;
            }
        """)
        if not clicked:
            raise AssertionError("Could not click any answer option (A/B/C/D buttons not found)")
        time.sleep(1)
        # Click confidence meter: 'Sure' or 'Not Sure' button
        page.evaluate("""
            () => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const sureBtn = buttons.find(b => b.innerText.includes('Sure') && !b.innerText.includes('Not'));
                if (sureBtn) { sureBtn.click(); return; }
                const notSureBtn = buttons.find(b => b.innerText.includes('Not Sure'));
                if (notSureBtn) notSureBtn.click();
            }
        """)
        time.sleep(0.5)
        # Click 'Confirm Answer' button (it's 'Confirm Answer', not just 'Confirm')
        page.evaluate("""
            () => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.innerText.trim().startsWith('Confirm'));
                if (btn && !btn.disabled) btn.click();
            }
        """)
        time.sleep(2)
        # After confirming, QuizShell shows '✗ INCORRECT' or '✓ CORRECT' (uppercase)
        page_text = page.evaluate("() => document.body.innerText")
        has_result = any(word in page_text for word in [
            "INCORRECT", "CORRECT", "Correct!", "Incorrect", "correct answer"
        ])
        if not has_result:
            raise AssertionError("No result shown after confirming — correctIndex may be broken")
        ok(name, f"clicked '{clicked[:40]}', result shown after confirm")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 5: Restore Access page loads and accepts email input ──────────────
def check_restore_access(page, base):
    name = "Restore Access — email input works"
    try:
        page.goto(f"{base}/account", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        # Look for email input
        page.wait_for_selector("input[type='email'], input[placeholder*='email'], input[placeholder*='Email'], input[placeholder*='mail']", timeout=TIMEOUT)
        email_input = page.locator("input[type='email']").first
        if not email_input.is_visible():
            email_input = page.locator("input").filter(has_placeholder="email").first
        email_input.fill("test@example.com")
        # Find and click the restore/find button
        for btn_text in ["Find My Passes", "Find", "Restore", "Look up", "Submit"]:
            btn = page.locator(f"button:has-text('{btn_text}')").first
            if btn.is_visible():
                btn.click()
                break
        else:
            raise AssertionError("Could not find Restore/Find button on account page")
        time.sleep(2)
        page_text = page.inner_text("body")
        has_response = any(word in page_text.lower() for word in [
            "no purchases", "found", "pass", "access", "purchase"
        ])
        if not has_response:
            raise AssertionError("No response shown after submitting email for restore access")
        ok(name, "restore access form responds to email input")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 6: Flashcard page loads ──────────────────────────────────────────
def check_flashcards(page, base):
    name = "Flashcards — OIT Water flashcard page loads"
    try:
        page.goto(f"{base}/oit-water-flashcards", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        time.sleep(3)
        page_text = page.inner_text("body").lower()
        has_content = any(word in page_text for word in [
            "flashcard", "flip", "card", "oit", "disinfection", "try free", "get oit", "practice"
        ])
        if not has_content:
            raise AssertionError("Flashcard page appears empty or broken")
        ok(name, "flashcard page rendered with content")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 7: Mock exam page loads ──────────────────────────────────────────
def check_mock_exam(page, base):
    name = "Mock exam — OIT mock exam page loads"
    try:
        page.goto(f"{base}/oit-mock", timeout=TIMEOUT)
        page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT)
        time.sleep(3)
        page_text = page.inner_text("body").lower()
        has_content = any(word in page_text for word in [
            "mock", "exam", "start", "oit", "question", "try free", "get oit", "practice", "timed"
        ])
        if not has_content:
            raise AssertionError("Mock exam page appears empty or broken")
        ok(name, "mock exam page rendered with content")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 8: API health check ───────────────────────────────────────────────
def check_api_health(page, base):
    name = "API — tRPC endpoint responds"
    try:
        response = page.request.get(
            f"{base}/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D",
            timeout=TIMEOUT
        )
        if response.status >= 500:
            raise AssertionError(f"tRPC returned HTTP {response.status}")
        ok(name, f"HTTP {response.status}")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Journey 9: No critical console errors on homepage ────────────────────────
def check_no_console_errors(page, base):
    name = "Homepage — no critical console errors"
    try:
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.goto(base, timeout=TIMEOUT)
        page.wait_for_load_state("networkidle", timeout=TIMEOUT)
        # Filter out known benign errors (ad blockers, analytics, etc.)
        critical = [e for e in errors if not any(skip in e for skip in [
            "favicon", "analytics", "gtag", "clarity", "hotjar",
            "ResizeObserver", "Non-Error promise rejection",
            "Failed to load resource", "net::ERR_BLOCKED_BY_CLIENT",
            "ERR_ABORTED", "ERR_NETWORK_CHANGED"
        ])]
        if critical:
            raise AssertionError(f"Console errors: {'; '.join(critical[:3])}")
        ok(name, f"{len(errors)} total console messages, 0 critical errors")
    except Exception as e:
        fail(name, str(e)[:200])

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE)
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    print(f"\n🧪 User Journey Checks — {base}\n")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        check_api_health(page, base)
        check_homepage(page, base)
        check_no_console_errors(page, base)
        check_pricing(page, base)
        check_oit_trial_modules(page, base)
        check_answer_highlighting(page, base)
        check_restore_access(page, base)
        check_flashcards(page, base)
        check_mock_exam(page, base)

        context.close()
        browser.close()

    # Summary
    passed = [r for r in results if r[0] == "PASS"]
    failed = [r for r in results if r[0] == "FAIL"]
    print(f"\n{'='*50}")
    print(f"Journey Checks: {len(passed)} passed, {len(failed)} failed")
    if failed:
        print("Failed checks:")
        for _, name, detail in failed:
            print(f"  ❌ {name}: {detail}")
    print('='*50)
    print(f"\nJOURNEY_RESULT: {len(passed)} passed, {len(failed)} failed")
    sys.exit(0 if not failed else 1)

if __name__ == "__main__":
    main()
