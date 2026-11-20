import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LearnerReviews from "./LearnerReviews";
vi.stubGlobal("React", React);
describe("genuine learner proof", () => {
  it("publishes two attributed experiences without inventing ratings or exam results", () => {
    const html = renderToStaticMarkup(React.createElement(LearnerReviews));
    expect(html.match(/<figure/g)).toHaveLength(2);
    expect(html).toContain("Codie Bachner"); expect(html).toContain("Canadian Veggie");
    expect(html).toContain("These mok questions are great");
    expect(html).toContain("I am having great success with it. I do enjoy it.");
    expect(html).toContain("Lightly edited for clarity"); expect(html).toContain("Google reviewer · 5 stars");
    expect(html).toContain("ChIJ_eBKhGWFK4gRayMFuRSVLys"); expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/Philip Emon|Carl Dooher|verified buyer|guaranteed|passed my exam|aggregateRating|<img/i);
  });
});
