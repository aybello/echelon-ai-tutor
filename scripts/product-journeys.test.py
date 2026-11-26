#!/usr/bin/env python3
"""Offline detector regression tests. No browser or production request is made."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock

spec = importlib.util.spec_from_file_location("product_journeys", Path(__file__).with_name("product-journeys.py"))
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class DetectorTests(unittest.TestCase):
    def test_free_and_preview_routes_require_content(self):
        self.assertEqual(module.expected_surface_state({"isFreeBeta": True}, "quiz"), "content")
        self.assertEqual(module.expected_surface_state({"isFreeBeta": True}, "mock"), "content")
        self.assertEqual(module.expected_surface_state({"track": "oit"}, "flashcards"), "content")
        self.assertEqual(module.expected_surface_state({}, "quiz"), "content")

    def test_advanced_study_surfaces_require_existing_access_gate(self):
        self.assertEqual(module.expected_surface_state({"track": "water-treatment"}, "mock"), "gate")
        self.assertEqual(module.expected_surface_state({"track": "water-distribution"}, "flashcards"), "gate")

    def test_demonstrated_failure_is_not_hidden_by_safety_block(self):
        self.assertEqual(module.safety_status("fail", True), "fail")
        self.assertEqual(module.safety_status("pass", True), "blocked")
        self.assertEqual(module.safety_status("warn", False), "warn")

    def test_source_verified_tracking_endpoints_are_denied(self):
        self.assertTrue(module.telemetry_destination("https://www.googletagmanager.com/gtag/js?id=test"))
        self.assertTrue(module.telemetry_destination("https://analytics.example.test/umami"))
        self.assertTrue(module.telemetry_destination("https://region1.google-analytics.com/g/collect"))
        self.assertFalse(module.telemetry_destination("https://fonts.googleapis.com/css2?family=Inter"))
        self.assertFalse(module.telemetry_destination("https://echeloninstitute.ca/api/trpc/quiz.getQuestions"))

    def test_unknown_external_write_is_not_expected_background(self):
        self.assertFalse(module.expected_background_write(False, []))
        self.assertFalse(module.expected_background_write(False, [next(iter(module.EXPECTED_BACKGROUND_WRITES))]))
        self.assertTrue(module.expected_background_write(True, [next(iter(module.EXPECTED_BACKGROUND_WRITES))]))
        self.assertEqual(module.safety_status("pass", True), "blocked")
        self.assertEqual(module.safety_status("fail", True), "fail")

    def test_evidence_removes_query_tokens_and_email(self):
        value = module.clean("https://example.test/path?token=private audit@echelon.test")
        self.assertNotIn("private", value)
        self.assertNotIn("audit@", value)


class CoverageTests(unittest.IsolatedAsyncioTestCase):
    def make_audit(self, output):
        args = SimpleNamespace(base_url="http://offline.test", output_dir=output,
                               timeout_ms=1000, route_timeout_seconds=10, journey_timeout_seconds=10)
        audit = module.Audit(args)
        page = Mock(url="http://offline.test/route")
        context = SimpleNamespace(route=AsyncMock(), new_page=AsyncMock(return_value=page), close=AsyncMock())
        audit.browser = SimpleNamespace(new_context=AsyncMock(return_value=context))
        audit.fatal_ui = AsyncMock()
        audit.screenshot = AsyncMock(return_value=None)
        audit.coverage = {"plannedChecks": 1, "plannedCheckNames": ["route/test"]}
        return audit, page

    async def test_cancelled_route_with_runtime_error_is_not_completed(self):
        with tempfile.TemporaryDirectory() as output:
            audit, page = self.make_audit(output)
            entered = asyncio.Event()

            async def check(_page):
                entered.set()
                await asyncio.Event().wait()

            def register(event, callback):
                if event == "pageerror":
                    callback(RuntimeError("offline simulated page error"))

            page.on.side_effect = register
            task = module.Task("route/test", "/route", check, kind="route-smoke")
            job = asyncio.create_task(audit.run_task(task, asyncio.Semaphore(1)))
            await entered.wait()
            job.cancel()
            await job
            report = json.loads((Path(output) / "product-journeys.json").read_text())
            self.assertFalse(report["results"][0]["completed"])
            self.assertIn("page exception", report["results"][0]["detail"])
            self.assertFalse(report["coverage"]["completedAllPlannedChecks"])
            self.assertEqual(report["coverage"]["routeSmokesCompleted"], 0)
            self.assertEqual(report["coverage"]["completedChecks"], 0)

    async def test_observed_blocked_route_is_complete_but_missing_plan_is_not(self):
        with tempfile.TemporaryDirectory() as output:
            audit, _ = self.make_audit(output)

            async def blocked(_page):
                raise module.Blocked("Signed-out access gate")

            await audit.run_task(module.Task("route/test", "/route", blocked, kind="route-smoke"), asyncio.Semaphore(1))
            report = json.loads((Path(output) / "product-journeys.json").read_text())
            self.assertTrue(report["results"][0]["completed"])
            self.assertTrue(report["coverage"]["completedAllPlannedChecks"])
            self.assertEqual(report["summary"]["blocked"], 1)
            self.assertEqual(report["coverage"]["routeSmokesCompleted"], 1)
            audit.coverage["plannedChecks"] = 2
            audit.coverage["plannedCheckNames"].append("not-started")
            audit.write_report()
            report = json.loads((Path(output) / "product-journeys.json").read_text())
            self.assertFalse(report["coverage"]["completedAllPlannedChecks"])


if __name__ == "__main__":
    unittest.main()
