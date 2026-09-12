# Echelon Equipment Lab — Circular Clarifier

## Release scope

The first Echelon Equipment Lab module is available at `/equipment-lab`. It presents a learner-focused, interactive circular centre-feed clarifier model and is designed to reinforce the relationship between equipment, process flow, operator observations, and study content.

## Learner experience

The module offers four equipment views: **3D**, **top**, **cutaway**, and **exploded**. Learners can select seven components—centre feedwell, effluent weir and launder, bridge and drive, scraper arms, sludge hopper, surface skimmer, and underflow withdrawal—to see a plain-language function, an operator observation prompt, and an exam-oriented connection.

The page also includes water, solids, and flow-animation controls; four process stages; links to the wastewater process guide and Class 1 wastewater practice; and keyboard-operable SVG component controls. Motion respects the user’s reduced-motion preference.

## Scope and safety boundary

The model is an instructional schematic of a common centre-feed clarifier. It does not establish facility-specific operating limits, procedure steps, or mechanical work instructions. Learners are directed to use their approved local operating procedures, design documents, and safety requirements for real operating decisions.

## Validation

The clarifier learning data has focused unit coverage. Type checks and a production build passed. Desktop and mobile development previews were reviewed, including the exploded-view control and component-selection states. After the canonical checkpoint synchronized and the deployment retry completed, the custom and managed production routes both loaded the complete Equipment Lab with the expected component, process-stage, study-link, and visual-control set. The Resources menu was opened on **both** production domains and showed a correctly labeled **Equipment Lab — Explore equipment and process flow** entry pointing to `/equipment-lab`. This verification did not require authentication or create learner activity.

On the managed production page, all seven SVG component targets exposed `role="button"` and `tabIndex="0"`. Direct keyboard verification confirmed focus plus **Enter** changed the selection to **Surface Skimmer**, while focus plus **Space** changed it to **Effluent Weir & Launder**. The published styles also contain a `prefers-reduced-motion: reduce` override that disables the flow, sweep, and pulse animations for users who request reduced motion.
