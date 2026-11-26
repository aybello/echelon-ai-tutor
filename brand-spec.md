# Homepage organization trust strip

## Design read and preservation contract

This is an **Extension** of the approved product-led homepage, not a redesign. The audience is water and wastewater operators and employer training teams. The strip acts as a quiet credibility bridge between the hero and study tools, readable at phone and laptop distance. Its visual temperature is institutional and restrained.

Design dials: visual variance 2, motion 3, density 4, asset dependence 10, brand fidelity 10. The owner's 2026-11-18 motion request adds only a quiet right-to-left customer marquee: two identical three-logo groups, each moving its own width over 24 seconds with linear CSS transforms. The clone is presentation-only and hidden from assistive technology; the original list exposes exactly three customers. No new assets, reveal delays, card treatments, or decorative imagery are added.

Preserve the existing Manrope headings, Source Sans 3 body text, blue `#1757b8` accents, white surfaces, black organization labels, and `--home-border` hairlines. Use the homepage's established 20/24/56px responsive gutters and 1240px content envelope. The strip itself spans the full width. It adds no radius or shadow. Official logo colors and aspect ratios remain intact through contained images. BEA stays static and separate: desktop support has a vertical rule; mobile support has its own row and horizontal rule. Equal customer groups are at least the marquee viewport width, with seam spacing included in each group's padding. An accessible native Pause/Resume logo animation button stores the pause choice; hover and keyboard focus also pause motion. Reduced-motion users receive an unclipped static original grid with all three customers visible, no clone, and no pause control; three columns become two only on the narrowest phones. Asset paths, source hashes, permissions, captions, and Winnipeg clear space are unchanged.

Keep routes, navigation, anchors, metadata, existing hero actions, preview behavior, forms, analytics, prices, checkout, authorization, databases, and the Teams page unchanged. Retain the existing compact text proof in the hero, adding the third requested organization. Place the new logo band immediately after the hero and before tools.

## Claim boundaries

The owner requested customer recognition for **Utilities Kingston**, **City of Winnipeg**, and **City of Quinte West**. Public wording is limited to “Trusted by” and “Used by operators and teams at.” The retained hero line says “Used by operators at.” This is not a quotation, testimonial, measured outcome, government approval, or official organizational endorsement. No billing, seat, learner, employee, or contact details belong in the app or public asset registry.

**Black Entrepreneurship Alliance (BEA)** is separate founder support at the owner's request. Its only relationship heading is **“Supported by.”** It is deliberately excluded from the customer list. Do not infer a grant, funding award, application, accelerator admission, official partnership, or customer relationship. No other support organizations were requested in this change.

## Asset provenance and delivery

The asset specialist owns official-source research, original collection, and managed storage upload. Do not duplicate those operations. Official source pages, source asset URLs, exact dimensions, SHA-256 checksums, and managed `/manus-storage/` runtime paths are recorded in `client/src/lib/trustedOrganizations.json`. That registry contains organization-level public provenance only; original files and private collection manifests remain outside the repository under `/home/ubuntu/outputs/trusted-organizations-20261118/`.

`client/src/components/TrustedOrganizations.tsx` references these real assets through `<img>` elements with explicit intrinsic dimensions, meaningful alt text, and eager/async decoding. Organization captions remain visible independently of successful image loading, and a fixed-height logo slot prevents collapse. Marks are not redrawn, generated, gray-filtered, faded, cropped, or linked away from the purchase journey.

The owner explicitly confirmed on **2026-11-18**: “Yes, we have written permission” for the City of Winnipeg logo. This records the owner's confirmation, not a claim that a permission document was supplied or independently reviewed. Its registry entry therefore has `logoDisplayAllowed: true`; image rendering requires strict `true` for every mark. Dedicated Winnipeg container padding reserves practical two-W clear space without altering the original SVG. The visible band contains no permission-process or legal messaging.

Utilities Kingston is a faithful rasterization of the unchanged vector mark from page 1 of its official 2024 annual report, with the original white background retained. Quinte West is the original PNG from its official CivicWeb portal. BEA is the original transparent logo served by York University YSpace's official BEA page; its public label is the organization's full name. The original files and source manifest retain fuller collection and verification notes outside the app. All four hosted assets passed HTTP GET/HEAD checks and byte-for-byte SHA-256 verification before integration.

## November 23, 2026: Winnipeg display-size correction

The earlier notes above describe the original strip, not the later approved removal of BEA and addition of Peterborough. The current registry remains the authority for its four customer marks. At the owner's request, remove the Winnipeg-only 22px height cap and internal padding that made it visibly smaller. All marks now share a 46px maximum artwork height, or 42px on phones, with centered 94px/90px slots to reserve vertical clear space outside the artwork. A shared 28px horizontal gap, including the marquee seam and static mobile grid, keeps adjacent marks separated. The original Winnipeg SVG, colors, aspect ratio, display permission and labels remain unchanged. Motion, pause controls and reduced-motion behavior are preserved.
