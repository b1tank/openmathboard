# Sprint Plan — Production Readiness Sprint 0

## Objective

Harden the release pipeline and local data lifecycle before larger scene-model and cloud work. This sprint executes the low-hanging safety backlog from `plan.md` with AI-assisted delivery and atomic commits.

## Prioritized Task List

- [ ] **PR-001 — Dependency security:** Upgrade Vite and vulnerable transitive dependencies; regenerate lockfile; verify audit/build/tests.
- [ ] **PR-002 — CI validation gate:** Add a required validation job using clean install, build, Chromium Playwright tests, and production dependency audit before deployment.
- [ ] **PR-003 — Post-deploy smoke:** Verify the deployed health endpoint and app shell; fail deployment on smoke failure and record the deployed revision.
- [ ] **PR-004 — Browser matrix:** Add Chromium, Firefox, and WebKit Playwright projects and make the suite browser-aware.
- [ ] **PR-005 — Real iPad release checklist:** Document repeatable Apple Pencil, lifecycle, camera, recording, orientation, and download checks.
- [ ] **PR-006 — Lifecycle persistence:** Flush pending local saves on `visibilitychange` and `pagehide`.
- [ ] **PR-007 — Save status:** Add Saved / Saving / Error status tied to actual localStorage durability.
- [ ] **PR-008 — Bounded history:** Cap undo history by count and approximate serialized memory; preserve the current branch and UI correctness.
- [ ] **PR-009 — Frontend telemetry:** Add privacy-safe client error, rejection, save-failure, and release metadata telemetry without recording board content.
- [x] **PR-010 — Documentation truthfulness:** Implemented/planned status and active roadmap were corrected in commit `1b7939a`.
- [ ] **Final build and full browser test matrix**
- [ ] **Push all atomic commits**

## Merge Decisions

- PR-002 creates the validation job; PR-004 extends it to the full browser matrix in a separate commit.
- PR-006 implements lifecycle durability; PR-007 adds user-visible status in a separate commit because it changes UI and i18n.
- PR-009 is limited to a local telemetry abstraction plus Application Insights-compatible endpoint configuration; no board content, stroke data, camera, microphone, or recording blobs may be emitted.

## Hiccups & Notes

- None yet.
