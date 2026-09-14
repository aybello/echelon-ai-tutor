# 3D Process Explorer — Batch 1

Review prototype for a separate Echelon 3D Process Explorer. The existing Process Guide pages, data, routes and controls are not modified or imported by this prototype. No application deployment or database change is required to review it.

## Models

| Process | Visible mechanism | Inspection points |
| --- | --- | --- |
| Intake and screening | Coarse-screen rake, fine screen, low-lift pump and discharge | Source water, coarse screen, fine screen, pump, discharge valve |
| Coagulation | Chemical feed at the inlet and a driven, baffled rapid mixer | Chemical feed, injection point, mixer drive, impeller/baffles, outlet |
| Flocculation | Three paddle cells with progressively slower rotation and growing floc | Three cells, alternating baffles, outlet |
| Sedimentation | Feedwell, settling particles, scraper and separate sludge/clarified-water outlets | Feedwell, drive/scraper, sludge hopper, weir/launder, outlet |

All models support rotate/zoom, five numbered inspection targets, a cutaway and a tracked parcel that can be run, paused, scrubbed and replayed. The three mixing/settling models also separate their drives for inspection. Animation is paused during disassembly, offscreen and in hidden tabs. Motion starts only on a learner action.

The geometry, particle sizes and 26-second journey are illustrative. They are not equipment specifications, residence times, mixing-energy settings, dose recommendations or a hydraulic simulation. Conventional treatment is one possible treatment train; actual facilities vary. The chemical colour identifies the feed path and does not represent a required chemical colour.

Teaching sequence/reference checked September 14, 2026: [CDC: How Water Treatment Works](https://www.cdc.gov/drinking-water/about/how-water-treatment-works.html). Mechanical details are representative educational geometry, not a specific manufacturer's installation. Coagulation destabilizes particles; gentle flocculation supports their aggregation; gravity settling separates floc from clarified water.

## Build and review

Use the repository's installed dependencies; no additional packages or runtime CDN calls are needed.

```sh
node prototypes/process-explorer/build.mjs /workspace/water-process-batch-one.html
```

The output is an inline HTML fragment, including bundled Three.js and OrbitControls. To inspect it outside the conversation, wrap the fragment with a document/viewport and a sandboxed iframe (allow-scripts and allow-same-origin). The visualization skill's `scripts/render.py` supplies this wrapper when available:

```sh
python3 /root/.codex/skills/oai/visualize/scripts/render.py /workspace/water-process-batch-one.html /tmp/water-process-batch-one-preview.html --force
node prototypes/process-explorer/browser-check.mjs /tmp/water-process-batch-one-preview.html
```

Browser checks use Playwright's Chromium. `CHROMIUM_EXECUTABLE` and `CHROMIUM_ARGS_JSON` can configure an existing portable Chromium; `PREVIEW_EVIDENCE_DIR` chooses the screenshot/result directory. The script hosts the wrapper on loopback and blocks HTTPS requests, so no customer account, backend, email, or production data is used.

## Verification scope

The focused browser checks cover actual animation pixel changes and pausing in every model, all 20 inspection targets, cutaways, disassembly, completion/replay, repeated-switch geometry disposal, camera drag, simulated context loss/restoration, explicit unavailable-WebGL messaging, and 390px/320px touch layouts in dark mode. Screenshots accompany the checks for visual review. They do not certify hydraulic accuracy or real-device performance.

## Agreed next batches

1. **Current preview:** intake/screening, coagulation, flocculation, sedimentation.
2. Water filtration/backwashing, disinfection, storage and pumping.
3. Wastewater screening/grit, primary treatment, biological treatment and secondary clarification with RAS/WAS.
4. Nutrient removal, wastewater disinfection and sludge thickening/digestion/dewatering.
5. Water Distribution processes.
6. Wastewater Collection processes.
7. Pumping Systems.
8. Instrumentation and Process Control.
9. Chemical Feed.

Review each batch before publishing. Future site integration should use its own Process Explorer entry point and loading boundary. Preserve all seven existing Process Guides. This batch is not integrated into their navigation, and does not change the separate PR #83 work.
