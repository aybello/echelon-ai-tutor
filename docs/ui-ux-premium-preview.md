# Echelon visual direction 02

Father's feedback: the first workspace preview was smoother and simpler, but did not feel premium.

This is a separate design-review revision, based on PR #120 at `8c26048`. It is not imported by the production app and does not change the PR's production components, behaviour or release status.

The proposed visual direction uses warm ivory, deep navy, muted sage and a restrained brass accent. Fraunces headings and Inter body text create a clearer hierarchy; a dark next-step panel anchors the learner dashboard. Quiet borders, consistent control shapes and more deliberate spacing reduce the template-like appearance. The course-finder hero includes an illustrative process drawing; this is decorative, not an instructional plant diagram.

The original Echelon icon is embedded in `review-brand.ts` instead of the previous preview-only E placeholder. Inter and Fraunces Latin variable fonts from Google Fonts are embedded in `review-fonts.css` for offline review. Both font families are distributed under the SIL Open Font License: https://github.com/google/fonts/tree/main/ofl/inter and https://github.com/google/fonts/tree/main/ofl/fraunces.

The six existing preview routes still use local fictional fixtures. The new visual skin is in `prototypes/ui-ux-preview/premium-review.css`; typography and hero changes are review-only. Existing mobile adaptation, keyboard focus and reduced-motion settings remain. Disabled practice submission is visibly muted, and answer-correctness colours remain distinct.

Build the downloadable file with `node prototypes/ui-ux-preview/build-single-file.mjs /absolute/path/echelon-premium-preview.html`. The downloaded HTML works offline; production APIs, payments, messages and records are not used. The review toolbar is for the prototype, not part of the proposed customer UI.

Validation: preview TypeScript and standalone build passed. Ten existing preview browser journeys passed, including all six areas, mobile manager/practice/mock layouts, keyboard focus and offline operation. Additional offline screenshots verified embedded original-logo loading and no overflow on the learner's phone layout. Production deployment requires Father's visual review and the separate full release checks for PR #120.
