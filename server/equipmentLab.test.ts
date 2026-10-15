import { describe, expect, it } from "vitest";
import {
  EQUIPMENT_REGISTRY,
  equipmentRoutes,
  findEquipment,
} from "../shared/equipmentRegistry";
import { STATIC_PAGE_META } from "./pageSsr";

/**
 * The Equipment Lab exists to rank for operator searches and to teach exam
 * content correctly. These tests lock both halves of that:
 *
 *  1. Every modelled unit must be genuinely indexable, in the sitemap, and
 *     carry real prose. A page that is built but invisible earns nothing.
 *  2. The process claims that were found reversed on first draft must stay
 *     corrected. Pin floc and straggler floc have opposite causes and opposite
 *     fixes, and getting them backwards teaches an operator to fail the exam.
 */

describe("Equipment Lab pages are reachable and indexable", () => {
  it("registers every equipment route in the server page meta", () => {
    const metaPaths = new Set(STATIC_PAGE_META.map(m => m.path));
    for (const route of equipmentRoutes()) {
      expect(
        metaPaths.has(route),
        `${route} is missing from STATIC_PAGE_META, so it will not be server rendered or appear in the sitemap`
      ).toBe(true);
    }
  });

  it("gives every unit substantial crawlable prose, not a stub", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      const meta = STATIC_PAGE_META.find(
        m => m.path === `/equipment-lab/${unit.slug}`
      );
      expect(meta, `no meta for ${unit.slug}`).toBeDefined();
      expect(meta!.bodyHtml, `${unit.slug} has no body copy`).toBeTruthy();
      // Thin pages do not rank. Require real depth.
      expect(
        meta!.bodyHtml!.length,
        `${unit.slug} body copy is too thin to rank`
      ).toBeGreaterThan(4000);
      expect(meta!.title.length).toBeGreaterThan(20);
      expect(meta!.description.length).toBeGreaterThan(60);
    }
  });

  it("resolves each slug back to its definition", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      expect(findEquipment(unit.slug)?.id).toBe(unit.id);
    }
    expect(findEquipment("not-a-real-unit")).toBeUndefined();
  });

  it("keeps slugs unique", () => {
    const slugs = EQUIPMENT_REGISTRY.map(u => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives the hub page its own meta and links to every unit", () => {
    // The hub is the internal link source that passes authority to each unit
    // page. Without its own meta it falls back to a generic study-resources
    // title and drops out of the sitemap entirely.
    const hub = STATIC_PAGE_META.find(m => m.path === "/equipment-lab");
    expect(hub, "/equipment-lab has no page meta of its own").toBeDefined();
    expect(hub!.title.toLowerCase()).toContain("equipment");
    for (const unit of EQUIPMENT_REGISTRY) {
      expect(
        hub!.bodyHtml,
        `hub page does not link to /equipment-lab/${unit.slug}`
      ).toContain(`/equipment-lab/${unit.slug}`);
    }
  });
});

describe("Equipment Lab teaching content is correct", () => {
  it("presents calculations in metric first, because Canadian exams are metric", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const formula of unit.formulas) {
        const metricMarkers = /m3|kg|mg\/L|mL\/g|hours|days/;
        expect(
          metricMarkers.test(formula.expression) ||
            formula.terms.some(t => metricMarkers.test(t.units)),
          `${unit.slug}/${formula.id} does not express itself in metric terms`
        ).toBe(true);
        // The US customary 8.34 factor must never be the primary presentation.
        expect(
          formula.expression.includes("8.34"),
          `${unit.slug}/${formula.id} uses the US 8.34 factor as the primary formula`
        ).toBe(false);
      }
    }
  });

  it("every formula shows its working and what the answer means", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const formula of unit.formulas) {
        expect(formula.worked.substitution.length).toBeGreaterThan(20);
        expect(formula.worked.result.length).toBeGreaterThan(5);
        expect(formula.interpretation.length).toBeGreaterThan(60);
        expect(formula.terms.length).toBeGreaterThan(1);
      }
    }
  });

  it("keeps pin floc attributed to OLD sludge, not young sludge", () => {
    const basin = findEquipment("aeration-basin");
    expect(basin).toBeDefined();
    const pinFloc = basin!.symptoms.find(s => s.id === "pin-floc");
    expect(pinFloc, "pin floc entry is missing").toBeDefined();

    const causes = pinFloc!.likelyCauses.join(" ").toLowerCase();
    // Verified against Maine DEP and NY DEC operator guidance: pin floc is the
    // classic old-sludge indicator, driven by a very low F/M and under-wasting.
    expect(causes).toMatch(/too long|under-wasting|low food/);
    expect(
      causes,
      "pin floc must not be attributed to a short sludge age or over-wasting"
    ).not.toMatch(/too short|over-wasting/);
  });

  it("keeps straggler floc attributed to YOUNG sludge, the opposite case", () => {
    const basin = findEquipment("aeration-basin");
    const straggler = basin!.symptoms.find(s => s.id === "straggler-floc");
    expect(
      straggler,
      "straggler floc entry is missing, so the pin floc contrast is lost"
    ).toBeDefined();

    const causes = straggler!.likelyCauses.join(" ").toLowerCase();
    expect(causes).toMatch(/too short|over-wasting/);
    expect(causes).not.toMatch(/too long|under-wasting/);
  });

  it("does not claim white foam comes from under-wasting", () => {
    const basin = findEquipment("aeration-basin");
    const allText = JSON.stringify(basin).toLowerCase();
    // White billowy foam accompanies young sludge from start-up or OVER-wasting.
    const whiteFoamClaim =
      /white foam[^.]*under-wasting|under-wasting[^.]*white foam/;
    expect(allText).not.toMatch(whiteFoamClaim);
  });

  it("does not describe MLVSS as purely living biomass", () => {
    const basin = findEquipment("aeration-basin");
    const allText = JSON.stringify(basin).toLowerCase();
    expect(
      allText,
      "MLVSS is a biomass proxy that also includes dead cells and other volatile organics"
    ).not.toMatch(/mlvss[^.]*therefore biologically active/);
  });

  it("uses no em dashes in learner-facing prose", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      expect(
        JSON.stringify(unit).includes("\u2014"),
        `${unit.slug} contains an em dash in learner-facing copy`
      ).toBe(false);
    }
  });
});
