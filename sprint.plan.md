# Sprint Plan — Architecture Sprint 1: Input/Render Decoupling

## Objective
Active pen drawing no longer triggers full committed-scene replay. Input is decoupled from rendering via a two-canvas architecture and a centralized input manager.

## Scope
- In scope: `index.html`, `style.css`, `src/core/state.js`, `src/interaction/input.js`, `src/canvas/renderer.js`, `src/app.js`, plus new files `src/interaction/input-manager.js` and `src/interaction/pen-tool.js`.
- Out of scope: eraser/select tool extraction (Sprint 2), gesture unification (Sprint 2), iPad instrumentation (Sprint 3).

## Success Criteria
- Active pen drawing renders only on the live canvas — scene canvas redraw count during drawing: 0.
- All existing Playwright tests pass.
- All existing features still work (eraser, select, shapes, toolbar, etc.).

## Delivery Strategy
Ship in atomic commits. Each step produces a working app.

---

## Actionable Task List

### Task 1: Add liveCanvas to DOM and CSS
- [x] Add `<canvas id="liveCanvas"></canvas>` after `drawingCanvas` in `index.html`
- [x] Add CSS for `#liveCanvas` — same positioning as `#drawingCanvas`, z-index above it
- [x] `#drawingCanvas` gets `pointer-events: none` (scene canvas); live canvas receives all pointer events

### Task 2: Add liveCanvas + liveCtx to state.js
- [x] Add `liveCanvas`, `liveCtx` state variables with getters/setters

### Task 3: Create input-manager.js
- [x] Single owner of pointer events on liveCanvas
- [x] Caches canvas rect on pointerdown + resize
- [x] Normalizes events, routes to active tool's `onPointerDown/Move/Up/Cancel`
- [x] Handles pointercancel, pointerleave with buttons-check guard
- [x] Pen-vs-finger gating: finger ignored when pen detected (unless select tool)
- [x] For eraser/select: falls through to legacy `input.js` handlers (temporary stub)

### Task 4: Create pen-tool.js
- [x] Extracts pen logic from `input.js` onPointerDown/Move/Up
- [x] Zoom-aware point spacing
- [x] Renders active stroke on live canvas only
- [x] On pointerup: commits to strokes[], invalidates scene cache, defers history
- [x] On cancel: discards cleanly

### Task 5: Split renderer into scene/live
- [x] `redrawScene()` — committed strokes on scene canvas (existing offscreen cache)
- [x] `redrawLive()` — live canvas: current stroke + selection overlays + anchors
- [x] `redrawCanvas()` — backward-compatible wrapper calling both
- [x] Render loop during pen drawing calls `redrawLive()` only

### Task 6: Wire app.js to new modules
- [x] Initialize liveCanvas + liveCtx in init()
- [x] Call `setupInputManager()` instead of `setupCanvasListeners()`
- [x] Resize both canvases in `resizeCanvas()`
- [x] Keep `setupCanvasListeners()` for keyboard shortcuts only

### Task 7: Stub eraser/select in input-manager
- [x] Eraser/select pointer events forwarded to legacy `input.js` handlers
- [x] Legacy handlers still work unchanged until Sprint 2 extracts them

### Task 8: Build check + run tests
- [x] `npx vite build` succeeds
- [x] `npx playwright test` passes

### Task 9: Push all commits
- [x] `git push` to current branch

---

## Hiccups & Notes
- Build passes (vite build: 39 modules, 265ms).
- All 2 Playwright tests pass.
- Legacy input.js pointer capture removed (handled by input-manager now).
- Literal newline bug in sed replacement caught and fixed inline.
