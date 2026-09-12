# Echelon Equipment Lab — Circular Clarifier

## Release scope

The first Echelon Equipment Lab module is available at `/equipment-lab`. It presents a learner-focused, interactive circular centre-feed clarifier model and is designed to reinforce the relationship between equipment, process flow, operator observations, and study content.

## Learner experience

The module offers four equipment views: **3D**, **top**, **cutaway**, and **exploded**. Learners can select seven components—centre feedwell, effluent weir and launder, bridge and drive, scraper arms, sludge hopper, surface skimmer, and underflow withdrawal—to see a plain-language function, an operator observation prompt, and an exam-oriented connection.

The page also includes water, solids, and flow-animation controls; four process stages; links to the wastewater process guide and Class 1 wastewater practice; and keyboard-operable SVG component controls. Motion respects the user’s reduced-motion preference.

## Three.js enhancement — 2026-09-12.equipment-lab-three.1

The default experience now loads a dedicated **Three.js** circular-clarifier exploration model. It is a code-built educational visualization with orbit, top, cutaway, and exploded views; visible water and solids layers; optional scraper-motion controls; clickable 3D geometry for the same seven components; and the shared four-stage clarification sequence.

The heavy 3D scene is loaded only when the learner selects the 3D model mode, keeping the page shell and the existing diagram module independent. The HTML component buttons remain the keyboard-operable selection route, and the original SVG-based **Diagram view** is retained as an explicit, learner-selectable fallback. If the 3D canvas cannot initialize, the page reports that state without hiding the diagram option.

## Scope and safety boundary

The model is an instructional schematic of a common centre-feed clarifier. It does not establish facility-specific operating limits, procedure steps, or mechanical work instructions. Learners are directed to use their approved local operating procedures, design documents, and safety requirements for real operating decisions.

## Validation

The clarifier learning data has focused unit coverage. Type checks and a production build passed. Desktop and mobile development previews were reviewed, including the exploded-view control and component-selection states. After the canonical checkpoint synchronized and the deployment retry completed, the custom and managed production routes both loaded the complete Equipment Lab with the expected component, process-stage, study-link, and visual-control set. The Resources menu was opened on **both** production domains and showed a correctly labeled **Equipment Lab — Explore equipment and process flow** entry pointing to `/equipment-lab`. This verification did not require authentication or create learner activity.

On the managed production page, all seven SVG component targets exposed `role="button"` and `tabIndex="0"`. Direct keyboard verification confirmed focus plus **Enter** changed the selection to **Surface Skimmer**, while focus plus **Space** changed it to **Effluent Weir & Launder**. The published styles also contain a `prefers-reduced-motion: reduce` override that disables the flow, sweep, and pulse animations for users who request reduced motion.

For the Three.js follow-on release, all 1,335 unit tests, TypeScript checks, and the production build passed. The standalone public browser test confirmed the default 3D canvas, view controls, component-button **Enter** selection, water visibility control, four process stages, SVG diagram switch, and reduced-motion state without authentication or learner activity. Desktop and mobile previews were also inspected directly. After auto-publish propagation, the same public browser suite passed **2/2** against both the managed domain and the custom domain; no sign-in, answer selection, submission, or learner record was created.
