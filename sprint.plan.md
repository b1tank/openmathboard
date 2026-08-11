# Sprint Plan — Production Readiness Sprint 0

## Objective

Harden the release pipeline and local data lifecycle before larger scene-model and cloud work. This sprint executes the low-hanging safety backlog from `plan.md` with AI-assisted delivery and atomic commits.

## Prioritized Task List

- [x] **PR-001 — Dependency security:** Upgrade Vite and vulnerable transitive dependencies; regenerate lockfile; verify audit/build/tests.
- [x] **PR-002 — CI validation gate:** Add a required validation job using clean install, build, Chromium Playwright tests, and production dependency audit before deployment.
- [x] **PR-003 — Post-deploy smoke:** Verify the deployed health endpoint and app shell; fail deployment on smoke failure and record the deployed revision.
- [x] **PR-004 — Browser matrix:** Add Chromium, Firefox, and WebKit Playwright projects and make the suite browser-aware.
- [x] **PR-005 — Real iPad release checklist:** Document repeatable Apple Pencil, lifecycle, camera, recording, orientation, and download checks.
- [x] **PR-006 — Lifecycle persistence:** Flush pending local saves on `visibilitychange` and `pagehide`.
- [x] **PR-007 — Save status:** Add Saved / Saving / Error status tied to actual localStorage durability.
- [x] **PR-008 — Bounded history:** Cap undo history by count and approximate serialized memory; preserve the current branch and UI correctness.
- [x] **PR-009 — Frontend telemetry:** Add privacy-safe client error, rejection, save-failure, and release metadata telemetry without recording board content.
- [x] **PR-010 — Documentation truthfulness:** Implemented/planned status and active roadmap were corrected in commit `1b7939a`.
- [x] **Final build and full browser test matrix**
- [x] **Push all atomic commits**

## Merge Decisions

- PR-002 creates the validation job; PR-004 extends it to the full browser matrix in a separate commit.
- PR-006 implements lifecycle durability; PR-007 adds user-visible status in a separate commit because it changes UI and i18n.
- PR-009 is limited to a local telemetry abstraction plus Application Insights-compatible endpoint configuration; no board content, stroke data, camera, microphone, or recording blobs may be emitted.

## Hiccups & Notes

- Upgrading Playwright changed browser revisions, so local Chromium/Firefox/WebKit binaries had to be downloaded again.
- Vite 8 warned that ESM syntax in `vite.config.js` would not work with the future native loader; the config was renamed to `vite.config.mjs`.
- The new Firefox project exposed a real video-only recording bug: requesting an Opus MIME type without an audio track prevented final recording events. MIME negotiation now has separate audio/video-only candidate lists.
- WebKit does not reliably allow replacing `navigator.mediaDevices.getUserMedia` directly. Recording now supports an explicit test transport hook while production still uses the native API.
- A stale pre-upgrade Vite dev process temporarily created duplicate hot-module state during save-status testing. Restarting the clean Vite 8 server resolved it; CI always starts clean.
- Frontend telemetry is privacy-safe and disabled by default. Set the `TELEMETRY_ENDPOINT` GitHub variable to a same-origin collector connected to Application Insights before expecting production events.
- The first gated CI run correctly blocked deployment: Playwright's Linux WebKit build does not expose canvas recording APIs that are available in macOS/iOS WebKit. Media-dependent recording tests now capability-skip only on browser builds without those APIs; all toolbar/layout tests still run, and real iPad recording remains release-gated by the physical-device checklist.
- Final verification: Vite 8 build passed, `npm audit` reports 0 vulnerabilities, and 63/63 Playwright tests passed across Chromium, Firefox, and WebKit.
