# Sprint Plan — Architecture Sprints 2+3: Tool Separation + Hardening

## Objective
Complete the architecture rebuild: extract eraser/select into tool modules, remove legacy bridge, unify gesture handling, add instrumentation, and ensure all tests pass.

## Scope
- Sprint 2: eraser-tool.js, select-tool.js, input-manager update, input.js slim-down, camera.js gesture unification
- Sprint 3: perf instrumentation, pointercancel tests, test helper fix for two-canvas

## Task List

### Sprint 2 — Tool Separation

- [x] T1: Create eraser-tool.js
- [x] T2: Create select-tool.js
- [x] T3: Update input-manager to route eraser/select directly (remove legacy bridge)
- [x] T4: Slim input.js to keyboard shortcuts only
- [x] T5: Remove legacy bridge imports from app.js
- [x] T6: Unify gestures — remove touch listeners from camera.js, add pinch to input-manager

### Sprint 3 — Hardening & Instrumentation

- [x] T7: Add perf instrumentation module
- [x] T8: Add pointercancel Playwright test
- [x] T9: Fix test helper for two-canvas (query #drawingCanvas specifically)
- [x] T10: Build check + run tests
- [x] T11: Update sprint plan + push

## Hiccups & Notes
- Synthetic pointercancel does not work with setPointerCapture in Playwright headless. Converted to handler-wiring verification test. Full behavioral test of cancel needs real iPad.
- input.js reduced from 516 to 72 lines.
- Build: 42 modules, 266ms. Tests: 4/4 pass.
- Pinch zoom moved from raw touch listeners to pointer-based detection in input-manager.
