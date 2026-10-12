/**
 * Convert LaTeX delimiters commonly returned by the tutor into the
 * Markdown math delimiters understood by remark-math and Streamdown.
 *
 * The formula contents are left unchanged. Existing dollar-delimited math
 * is also left unchanged.
 */
export function normalizeTutorMath(content: string): string {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression: string) => `$$\n${expression.trim()}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression: string) => `$${expression.trim()}$`);
}
