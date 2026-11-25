import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LearnerReviews from "./LearnerReviews";
vi.stubGlobal("React", React);
describe("genuine learner proof", () => {
  it("publishes the remaining attributed experience without inventing ratings or exam results", () => {
    const html = renderToStaticMarkup(React.createElement(LearnerReviews));
    expect(html.match(/<figure/g)).toHaveLength(1);
    expect(html).not.toContain("Codie Bachner");
    expect(html).not.toContain("City of Peterborough");
    expect(html).toContain("Canadian Veggie");
    expect(html).toContain("These mok questions are great");
    expect(html).not.toMatch(/Feedback call|Lightly edited for clarity|Personal experience, not an organizational endorsement/i);
    expect(html).toContain("Google reviewer · 5 stars");
    expect(html).toContain("ChIJ_eBKhGWFK4gRayMFuRSVLys"); expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/Philip Emon|Carl Dooher|verified buyer|guaranteed|passed my exam|aggregateRating|<img/i);
  });
  it("shows five filled stars for each confirmed five-star review", () => {
    const html = renderToStaticMarkup(React.createElement(LearnerReviews));
    const cards = html.match(/<figure[\s\S]*?<\/figure>/g)!;
    expect(cards).toHaveLength(1);
    for (const card of cards) {
      expect(card).toContain('role="img" aria-label="5 out of 5 stars"');
      expect(card.match(/fill="currentColor"/g)).toHaveLength(5);
    }
  });
});
