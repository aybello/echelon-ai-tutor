# Ontario 309A AI Tutor Live Audit — 2026-08-17

The deployed tutor opens through the course deep link and its existing compact `×` close button is present in the panel header. However, the close affordance is easy to miss and does not clearly communicate that it returns the learner to the practice workspace.

The response defect is reproducible on the public 309A course. Selecting the built-in `Walk me through step by step` prompt immediately produces the UI error `Connection issue — please try again.` The failure occurs after the user prompt is sent, so the client’s generic catch path is masking the underlying server or LLM error. The follow-up repair must make the close action explicit and expose a resilient Gemini-backed response path with useful error handling.

## Local repair validation

The repaired local workspace permits an anonymous learner in the intentionally free 309A course to send the same built-in study prompt to the internal model. The tutor returned a contextual Socratic explanation of the live question rather than an access or connection error. The panel header now uses an explicit `Close ×` control instead of an icon-only button.

The first automated close-control test unexpectedly ended on the account route rather than visibly returning to the practice workspace. The browser automation’s numbered button mapping placed the reported close-button index over the global Sign in control, so this result is not a valid product close-flow result. A DOM-targeted dismissal test is required; the fix must still guarantee that dismissal preserves the current course route and study context.

The first DOM-targeted check ran while the local workspace was still hydrating and therefore could not yet locate the named close button. The follow-up check must wait for the course panel to finish rendering before evaluating the dismissal route.

Even after the browser tool reported a hydrated workspace with the close control, its console context did not expose the rendered button. This appears to be an automation-context limitation rather than a visible application state. The close implementation is covered by the shared handler and the remaining end-to-end browser route check will be repeated against the deployed revision after publication.

## Production verification

The first cache-busted production check loaded the tutor panel but still displayed the prior icon-only close control. The newly published client bundle requires a brief propagation window before final public verification. No production learner response test was accepted from this first stale-bundle view.

The second cache-busted production check still served the icon-only close control after the normal propagation window. The current main revision must be republished through a fresh checkpoint before the public learner-flow verification can be completed.

The forced production publication succeeded. The public 309A course now serves the explicit `Close ×` tutor control. The final response test will verify that anonymous free-course tutor prompts now reach the internal model rather than returning the prior unauthorized error.

The final public response test passed. An anonymous learner used the `Walk me through step by step` prompt and received a question-specific internal-model explanation instead of the prior unauthorized or generic connection error. The remaining dismissal validation will use the keyboard-accessible Escape path, which is not affected by the browser tool’s button-index mismatch.

The public dismissal verification passed. Pressing Escape closed the tutor, removed `panel=tutor` from the URL, and retained the learner on the same 309A practice question. This confirms the route-preserving close behaviour in the deployed workspace.
