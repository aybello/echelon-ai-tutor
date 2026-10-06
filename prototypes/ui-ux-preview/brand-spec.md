# Echelon restored-brand preview

## Existing identity

- Mode: restore the old visual identity while preserving newer study-flow improvements.
- Original Echelon icon: `https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp`.
- Local collected source: `/home/ubuntu/outputs/echelon-restoration-draft/assets/echelon-original-icon.webp`.
- Offline embedded review asset: `restoration-brand.ts`. This does not replace the production CDN asset.
- Typography: Sora, original Echelon display and body typeface. Preview weights 400, 500, 600, 700 and 800 are embedded in `restoration-fonts.css`. Production keeps its existing Sora request and removes the retired DM Serif Display request.
- Colours: existing tokens in `client/src/index.css`, navy `#0b1f3a`, blue `#1d4ed8`, teal `#0f766e`, white surfaces and slate `#f4f7fb` canvas.
- Surfaces: rounded white cards, familiar blue actions, existing answer-feedback colours, navy course navigation.

## Product evidence

The review file imports actual React components, rather than recreating them as screenshots. It includes Homepage, Pricing, Practice, Flashcards, Formulas, Account, Course finder, Learner dashboard, Manager dashboard, Admin, Mock exam and CEU course tabs.

All learner identities, admin metrics, study results and availability counts in the preview are explicitly fictional fixtures. The preview uses a local tRPC fixture link and blocks direct fetch calls and non-fixture mutations. It has no database, customer records, email delivery or working Stripe checkout.

## Draft boundary

The restored-brand direction was approved on October 2, 2026. This review now covers the completed shared visual alignment, including the previously approved founder-admin dashboard. It is still a fictional-data review, not proof of production publishing. Do not roll back later checkout, access, data-recovery or CEU-layout repairs.
