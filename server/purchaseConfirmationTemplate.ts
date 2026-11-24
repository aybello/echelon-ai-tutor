import { getAllCourses, resolveCourseKey } from "../shared/courseRegistry";
import { isInteractiveCourseEligible } from "../shared/interactiveEligibility";
import { PRODUCT_STUDY_PATHS } from "./stripe/products";
import type { PurchaseConfirmationPayload } from "./email";

export interface PurchaseConfirmationFormatting {
  /** Pass through the existing payment and exact recorded-expiry helpers. */
  amountFormatted: string;
  accessLabel: string;
}

export interface RenderedPurchaseConfirmation {
  subject: string;
  text: string;
  html: string;
}

const SITE_URL = "https://echeloninstitute.ca";
const ACCOUNT_URL = `${SITE_URL}/account`;
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp";
const headingFont = "Manrope,Arial,sans-serif";
const bodyFont = "'Source Sans 3',Arial,sans-serif";
const paragraphStyle = "margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;";
const linkStyle = "color:#1757B8;text-decoration:underline;";

type StudyLink = { label: string; url: string };

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, character => entities[character]);
}

/** Deliberately reject queries, fragments, escapes, traversal and URL authorities. */
function internalUrl(path: string): string | undefined {
  if (!/^\/[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(path)) return undefined;
  return `${SITE_URL}${path}`;
}

/** Rendering has no transport, environment, database, clock or network dependency. */
export function renderPurchaseConfirmationEmail(
  payload: PurchaseConfirmationPayload,
  formatting: PurchaseConfirmationFormatting,
): RenderedPurchaseConfirmation {
  const resolved = resolveCourseKey(payload.productKey)
    ?? getAllCourses().find(course => course.productKey === payload.productKey);
  const course = resolved?.isActive ? resolved : undefined;
  const links: StudyLink[] = [];
  const features: string[] = [];
  let games: StudyLink | undefined;
  const addLink = (label: string, path: string | null) => {
    const url = path ? internalUrl(path) : undefined;
    if (url) links.push({ label, url });
  };

  if (course) {
    // Known products always use canonical paths, never stale queued routes.
    addLink("Question practice", course.quizPath);
    addLink("Timed mock exam", course.mockExamPath);
    addLink("Course flashcards", course.flashcardPath);
    // Same notes deep link as client/src/lib/courseNavigation.ts course tools.
    const quizUrl = internalUrl(course.quizPath);
    if (quizUrl) links.push({ label: "Course study notes", url: `${quizUrl}?panel=notes` });
    addLink("Formula sheet", course.formulaPath);
    features.push(
      "Question practice with AI Tutor explanations.",
      "Timed mock exams with course-specific settings.",
      "Study notes and progress tracking for your course.",
    );
    if (course.flashcardPath) features.push("Course flashcards for review.");
    if (course.formulaPath) features.push("A course formula sheet.");
    if (isInteractiveCourseEligible(course.courseKey)) {
      const url = internalUrl(`/courses/${course.courseKey}/interactive`);
      if (url) games = { label: "Also available: free interactive practice games", url };
    }
  } else {
    // Historic products get no inferred course or optional tools. Retain supplied
    // study links only when BOTH routes form one verified, currently known pair.
    const pairs = [
      ...getAllCourses().filter(entry => entry.isActive).map(entry => ({
        quizPath: entry.quizPath, mockPath: entry.mockExamPath,
      })),
      ...Object.values(PRODUCT_STUDY_PATHS),
    ];
    if (pairs.some(pair => pair.quizPath === payload.quizPath && pair.mockPath === payload.mockPath)) {
      addLink("Question practice", payload.quizPath);
      addLink("Timed mock exam", payload.mockPath);
    }
  }

  const productName = escapeHtml(payload.productName);
  const email = escapeHtml(payload.email);
  const amount = escapeHtml(formatting.amountFormatted);
  const access = escapeHtml(formatting.accessLabel);
  const signIn = "Sign in with the email you used at checkout, then enter the 6-digit code sent to your inbox.";
  const payment = "One-time payment. No automatic renewal.";
  const support = "Questions? Reply to this email or contact abello@echeloninstitute.ca.";
  const footer = "Echelon Institute | Independent exam preparation";
  const fallback = "Open your account to view your purchased access and available study tools.";
  const linkRows = links.map(link => `<tr><td style="padding:0 0 12px;font-size:16px;line-height:1.5;"><a href="${escapeHtml(link.url)}" style="${linkStyle}">${escapeHtml(link.label)}</a></td></tr>`).join("\n");
  const featureHtml = features.length
    ? `<h2 style="margin:24px 0 12px;font-family:${headingFont};font-size:20px;line-height:1.3;color:#000000;">Your study tools</h2>
      <ul style="margin:0 0 20px;padding-left:22px;color:#000000;font-size:16px;line-height:1.6;">${features.map(feature => `<li style="margin:0 0 6px;">${escapeHtml(feature)}</li>`).join("")}</ul>`
    : `<p style="${paragraphStyle}">${fallback}</p>`;

  return {
    // Header value is plain text, with controls removed to prevent line injection.
    subject: `Your ${payload.productName.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")} is ready | Echelon Institute`,
    text: [
      "Purchase confirmed", "", `Your ${payload.productName} is ready.`,
      `Amount paid: ${formatting.amountFormatted}`, payment, `${formatting.accessLabel}.`, "",
      "Open your account: " + ACCOUNT_URL, signIn, `Checkout email: ${payload.email}`, "",
      ...(features.length ? ["Your study tools", ...features.map(feature => `- ${feature}`), ""] : [fallback, ""]),
      ...links.map(link => `${link.label}: ${link.url}`),
      ...(games ? ["", `${games.label}: ${games.url}`] : []),
      "", support, footer,
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Purchase confirmed</title></head>
<body style="margin:0;padding:0;background:#EDF4FF;font-family:${bodyFont};color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EDF4FF" style="width:100%;background:#EDF4FF;">
    <tr><td align="center" style="padding:24px 12px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:600px;background:#FFFFFF;">
        <tr><td style="padding:28px 24px 20px;border-bottom:1px solid #EDF4FF;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="56" style="width:56px;vertical-align:middle;"><img src="${LOGO_URL}" width="44" height="44" alt="" style="display:block;border:0;width:44px;height:44px;"></td>
            <td style="font-family:${headingFont};font-size:20px;line-height:1.3;font-weight:700;color:#000000;">Echelon Institute</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 24px 0;">
          <p style="margin:0 0 12px;color:#1757B8;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Purchase confirmed</p>
          <h1 style="margin:0 0 16px;font-family:${headingFont};font-size:28px;line-height:1.25;font-weight:700;color:#000000;">Your study pass is ready.</h1>
          <p style="${paragraphStyle}">Thank you for choosing Echelon Institute.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EDF4FF" style="width:100%;background:#EDF4FF;">
            <tr><td style="padding:20px;overflow-wrap:anywhere;word-break:break-word;">
              <p style="margin:0 0 12px;font-family:${headingFont};font-size:20px;line-height:1.4;font-weight:700;color:#000000;">${productName}</p>
              <p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#000000;">Amount paid: <strong>${amount}</strong></p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#000000;">${payment}</p>
              <p style="margin:0;font-size:15px;line-height:1.5;color:#000000;">${access}.</p>
            </td></tr>
          </table>
          <h2 style="margin:28px 0 12px;font-family:${headingFont};font-size:20px;line-height:1.3;color:#000000;">Start in your account</h2>
          <p style="${paragraphStyle}">${signIn}</p>
          <p style="${paragraphStyle}overflow-wrap:anywhere;word-break:break-word;">Checkout email: <strong>${email}</strong></p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#1757B8" style="background:#1757B8;border-radius:4px;mso-padding-alt:14px 24px;">
            <a href="${ACCOUNT_URL}" style="display:inline-block;padding:14px 24px;font-family:${bodyFont};font-size:16px;line-height:1.4;font-weight:700;color:#FFFFFF;text-decoration:none;border:1px solid #1757B8;border-radius:4px;">Open your account</a>
          </td></tr></table>
          ${featureHtml}
          ${links.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${linkRows}</table>` : ""}
          ${games ? `<p style="margin:16px 0 24px;font-size:15px;line-height:1.6;"><a href="${escapeHtml(games.url)}" style="${linkStyle}">${games.label}</a></p>` : ""}
        </td></tr>
        <tr><td style="padding:24px;border-top:1px solid #EDF4FF;">
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#000000;">${support}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#000000;">${footer}</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`,
  };
}
