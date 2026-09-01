import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Streamdown } from "streamdown";

function renderMarkdown(markdown: string) {
  return renderToStaticMarkup(createElement(Streamdown, null, markdown));
}

describe("AI Tutor markdown rendering", () => {
  it("does not render executable HTML or javascript links", () => {
    const html = renderMarkdown(`<img src=x onerror="alert(1)">

[unsafe](javascript:alert(1))

<script>alert(1)</script>`);

    expect(html).not.toMatch(/onerror\s*=/i);
    expect(html).not.toMatch(/href=["']javascript:/i);
    expect(html).not.toMatch(/<script[\s>]/i);
  });

  it("keeps unconfigured diagram input inert as a code block", () => {
    const html = renderMarkdown(`\`\`\`mermaid
xychart
  x-axis 1 --> 1
  line [1, 2]
\`\`\``);

    expect(html).toContain("xychart");
    expect(html).toMatch(/<code[\s>]/i);
    expect(html).toContain('data-streamdown="code-block"');
    expect(html).not.toContain('data-streamdown="mermaid"');
  });
});
