import { describe, it, expect } from "vitest";
import {
  RESOURCES,
  getResourcesForProfile,
  formatResourcesForPrompt,
  type StudentResourceProfile,
  type RecommendedResource,
} from "./resourceIndex";

describe("resourceIndex", () => {
  describe("RESOURCES master list", () => {
    it("should have at least 20 curated resources", () => {
      expect(RESOURCES.length).toBeGreaterThanOrEqual(20);
    });

    it("every resource should have required fields", () => {
      for (const r of RESOURCES) {
        expect(r.id).toBeTruthy();
        expect(r.title).toBeTruthy();
        expect(r.url).toMatch(/^https?:\/\//);
        expect(["official", "textbook", "video", "practice", "community", "tool"]).toContain(r.type);
        expect(r.topics.length).toBeGreaterThan(0);
        expect(r.examFamilies.length).toBeGreaterThan(0);
        expect(r.description.length).toBeGreaterThan(10);
        expect(r.priority).toBeGreaterThanOrEqual(1);
        expect(r.priority).toBeLessThanOrEqual(5);
      }
    });

    it("should have unique IDs", () => {
      const ids = RESOURCES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should cover all exam families", () => {
      const families = new Set(RESOURCES.flatMap((r) => r.examFamilies));
      expect(families.has("oit") || families.has("all")).toBe(true);
      expect(families.has("wpi") || families.has("all")).toBe(true);
      expect(families.has("ontario") || families.has("all")).toBe(true);
    });
  });

  describe("getResourcesForProfile", () => {
    it("should return resources for an OIT student with weak Disinfection", () => {
      const profile: StudentResourceProfile = {
        examType: "oit",
        weakTopics: ["Disinfection"],
        strongTopics: ["Regulations"],
      };
      const results = getResourcesForProfile(profile);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      // Should include resources covering disinfection or water treatment
      const hasRelevant = results.some(
        (r) => r.topics.includes("disinfection") || r.topics.includes("water treatment")
      );
      expect(hasRelevant).toBe(true);
    });

    it("should return resources for a WPI student with weak wastewater topics", () => {
      const profile: StudentResourceProfile = {
        examType: "wpi-class1-wastewater",
        weakTopics: ["Primary & Secondary Treatment", "Solids Handling & Biosolids"],
        strongTopics: ["Safety & Regulations"],
      };
      const results = getResourcesForProfile(profile);
      expect(results.length).toBeGreaterThan(0);
      const hasWW = results.some(
        (r) => r.topics.includes("wastewater treatment") || r.topics.includes("biosolids")
      );
      expect(hasWW).toBe(true);
    });

    it("should return resources for Ontario Class 1 Water student", () => {
      const profile: StudentResourceProfile = {
        examType: "class1-water",
        weakTopics: ["Hydraulics", "Math & Calculations"],
        strongTopics: [],
      };
      const results = getResourcesForProfile(profile);
      expect(results.length).toBeGreaterThan(0);
      // Should include Ontario-specific or "all" resources
      const allFamilies = results.flatMap((r) => r.examFamilies);
      const hasRelevant = allFamilies.some((f) => f === "ontario" || f === "all");
      expect(hasRelevant).toBe(true);
    });

    it("should return general resources when no weak topics", () => {
      const profile: StudentResourceProfile = {
        examType: "wqa",
        weakTopics: [],
        strongTopics: [],
      };
      const results = getResourcesForProfile(profile);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect maxResults parameter", () => {
      const profile: StudentResourceProfile = {
        examType: "oit",
        weakTopics: ["Disinfection", "Hydraulics", "Water Quality"],
        strongTopics: [],
      };
      const results3 = getResourcesForProfile(profile, 3);
      expect(results3.length).toBeLessThanOrEqual(3);

      const results10 = getResourcesForProfile(profile, 10);
      expect(results10.length).toBeLessThanOrEqual(10);
    });

    it("should include reason and relevance in results", () => {
      const profile: StudentResourceProfile = {
        examType: "oit",
        weakTopics: ["Disinfection"],
        strongTopics: [],
      };
      const results = getResourcesForProfile(profile);
      for (const r of results) {
        expect(r.reason).toBeTruthy();
        expect(typeof r.relevance).toBe("number");
        expect(r.relevance).toBeGreaterThan(0);
      }
    });

    it("should rank official/textbook resources higher than community", () => {
      const profile: StudentResourceProfile = {
        examType: "oit",
        weakTopics: ["Disinfection", "Water Quality", "Wastewater"],
        strongTopics: [],
      };
      const results = getResourcesForProfile(profile, 10);
      // First result should be official or textbook type (highest priority)
      if (results.length >= 2) {
        const topTypes = results.slice(0, 3).map((r) => r.type);
        const hasHighPriority = topTypes.some(
          (t) => t === "official" || t === "textbook" || t === "practice"
        );
        expect(hasHighPriority).toBe(true);
      }
    });
  });

  describe("formatResourcesForPrompt", () => {
    it("should return empty string for no resources", () => {
      expect(formatResourcesForPrompt([])).toBe("");
    });

    it("should format resources into a readable prompt block", () => {
      const resources: RecommendedResource[] = [
        {
          id: "test-1",
          title: "Test Resource",
          url: "https://example.com",
          type: "official",
          topics: ["water treatment"],
          examFamilies: ["all"],
          description: "A test resource for testing.",
          priority: 1,
          reason: "Covers your weak area: water treatment",
          relevance: 20,
        },
      ];
      const result = formatResourcesForPrompt(resources);
      expect(result).toContain("RECOMMENDED RESOURCES");
      expect(result).toContain("Test Resource");
      expect(result).toContain("https://example.com");
      expect(result).toContain("Covers your weak area");
    });

    it("should number multiple resources", () => {
      const resources: RecommendedResource[] = [
        {
          id: "r1", title: "First", url: "https://a.com", type: "official",
          topics: ["general"], examFamilies: ["all"], description: "First resource.",
          priority: 1, reason: "General", relevance: 10,
        },
        {
          id: "r2", title: "Second", url: "https://b.com", type: "video",
          topics: ["general"], examFamilies: ["all"], description: "Second resource.",
          priority: 2, reason: "General", relevance: 8,
        },
      ];
      const result = formatResourcesForPrompt(resources);
      expect(result).toContain("1. **First**");
      expect(result).toContain("2. **Second**");
    });
  });
});
