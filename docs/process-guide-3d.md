# 3D secondary clarifier in the wastewater Process Guide

## Learner experience

Open `/wastewater`, select **Secondary Clarification** in the process strip, then **Explore in 3D**. The strip advertises the available model and now opens the selected lesson directly from the process map.

The model is embedded at full guide width, above the existing labelled diagram and lesson. Learners can rotate, zoom, select components, switch between cutaway and exploded views, and read each part's purpose and exam connection. The lesson explains how settled sludge connects to RAS and WAS; the existing process diagram remains the reference for those routes. This is the existing conceptual circular-clarifier model integrated into the guide, not a new plant-wide simulation. Other treatment stages retain their existing diagrams.

The model is opt-in: the guide does not download the Three.js model chunk or create a WebGL context before the learner requests 3D. Closing it, leaving the lesson, or switching guide views unmounts the scene. Reduced-motion preferences apply. WebGL unavailability, lost context, failed module downloads and startup failures return learners to the diagram. The shared lazy loader gives both the guide and Equipment Lab a 12-second module timeout.

## Release

No schema migration, content import, entitlement change or production data update is required. This branch builds on PR #82's numbered marker repair. Merge #82 first, retarget this PR to current `main`, and rerun the gate if the resulting merge changes the code.

After deployment, open the route above on desktop and mobile, inspect a numbered exploded part, close the model, and move to Biological Treatment. With WebGL disabled, confirm the lesson and interactive diagram remain available.

## Automated verification

`e2e/process-guide-three.spec.ts` is explicitly run by the Quality Gate alongside the Teams and Equipment Lab browser suites. It covers real rendered frames at desktop/mobile sizes, deferred model loading, keyboard opening, cutaway/exploded interaction, component explanations, scene disposal, no horizontal page overflow, reduced motion, disabled WebGL, a failed chunk and context loss. Equipment Lab retains its existing module-timeout regression.
