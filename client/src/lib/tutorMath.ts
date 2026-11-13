/**
 * Convert LaTeX delimiters commonly returned by the tutor into the
 * Markdown math delimiters understood by remark-math and Streamdown.
 *
 * The formula contents are left unchanged. Existing dollar-delimited math
 * is also left unchanged.
 */
const LATEX_DISPLAY_MATH = /\\\[([\s\S]*?)\\\]/g;
const LATEX_INLINE_MATH = /\\\(([\s\S]*?)\\\)/g;

export function normalizeTutorMath(content: string): string {
  return content
    .replace(
      LATEX_DISPLAY_MATH,
      (_, expression: string) => `$$\n${expression.trim()}\n$$`,
    )
    .replace(
      LATEX_INLINE_MATH,
      (_, expression: string) => `$${expression.trim()}$`,
    );
}
