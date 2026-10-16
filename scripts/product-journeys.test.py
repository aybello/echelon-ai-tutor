#!/usr/bin/env python3
"""Offline detector regression tests. No browser or production request is made."""
import importlib.util
from pathlib import Path
import sys
import unittest

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

    def test_evidence_removes_query_tokens_and_email(self):
        value = module.clean("https://example.test/path?token=private audit@echelon.test")
        self.assertNotIn("private", value)
        self.assertNotIn("audit@", value)


if __name__ == "__main__":
    unittest.main()
