# Equipment Lab clarifier upgrade

The dedicated `/equipment-lab` model now opens in cutaway view. It includes a
sloping tank floor and hopper, notched effluent weir and launder, inlet and outlet
pipework, bridge handrails and drive, rotating scraper arms, and separate water
and solids particle paths. Colours, port labels and component explanations connect
the equipment to the clarification sequence.

The earlier `clarifier_lab.html` demonstration is the design reference. This
implementation bundles its dependencies with the application rather than loading
Three.js from a CDN. Flow paths, speeds and dimensions remain illustrative, not
predictions of plant behaviour.

## Scope and release

- Existing Process Guide model, lesson data, course recording and Diagram fallback
  are retained. Only the Equipment Lab lazy import selects the new model.
- No migrations, content imports, environment variables or dependency changes.
- Deploy the application through the existing hosting project after the complete
  Quality Gate passes. Merging does not itself prove that Manus published it.
- Confirm `/equipment-lab` opens in Cutaway with the flow legend; check Top,
  Exploded, part selection, Pause, Reset and Diagram. Check a narrow phone viewport.
- Visit the wastewater guide and open its original optional 3D model to confirm
  that guide behaviour is unchanged.

## Verification evidence

The Equipment Lab browser suite requires actual rendered geometry on desktop and
mobile, checks that all seven exploded labels fit inside the canvas, and attaches
cutaway and exploded screenshots to the browser report. It covers reset, stage
selection, reduced motion, failed/pending imports, missing WebGL and context loss.
The Process Guide suite covers its original model and cross-route failure isolation.

Browser evidence is retained by the Quality Gate for successful and failed runs.
Review the attached desktop/mobile screenshots alongside the automated results.

Animation pauses when the model leaves the viewport or its tab becomes hidden.
Reduced-motion mode is static, and water/solids/motion are hidden in Exploded view.
Blocked browser storage must not prevent a successfully loaded model from opening.
