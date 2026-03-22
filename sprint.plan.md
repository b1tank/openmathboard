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
- [ ] Add `<canvas id="liveCanvas"></canvas>` after `drawingCanvas` in `index.html`
- [ ] Add CSS for `#liveCanvas` — same positioning as `#drawingCanvas`, z-index above it
- [ ] `#drawingCanvas` gets `pointer-events: none` (scene canvas); live canvas receives all pointer events

### Task 2: Add liveCanvas + liveCtx to state.js
- [ ] Add `liveCanvas`, `liveCtx` state variables with getters/setters

### Task 3: Create input-manager.js
- [ ] Single owner of pointer events on liveCanvas
- [ ] Caches canvas rect on pointerdown + resize
- [ ] Normalizes events, routes to active tool's `onPointerDown/Move/Up/Cancel`
- [ ] Handles pointercancel, pointerleave with buttons-check guard
- [ ] Pen-vs-finger gating: finger ignored when pen detected (unless select tool)
- [ ] For eraser/select: falls through to legacy `input.js` handlers (temporary stub)

### Task 4: Create pen-tool.js
- [ ] Extracts pen logic from `input.js` onPointerDown/Move/Up
- [ ] Zoom-aware point spacing
- [ ] Renders active stroke on live canvas only
- [ ] On pointerup: commits to strokes[], invalidates scene cache, defers history
- [ ] On cancel: discards cleanly

### Task 5: Split renderer into scene/live
- [ ] `redrawScene()` — committed strokes on scene canvas (existing offscreen cache)
- [ ] `redrawLive()` — live canvas: current stroke + selection overlays + anchors
- [ ] `redrawCanvas()` — backward-compatible wrapper calling both
- [ ] Render loop during pen drawing calls `redrawLive()` only

### Task 6: Wire app.js to new modules
- [ ] Initialize liveCanvas + liveCtx in init()
- [ ] Call `setupInputManager()` instead of `setupCanvasListeners()`
- [ ] Resize both canvases in `resizeCanvas()`
- [ ] Keep `setupCanvasListeners()` for keyboard shortcuts only

### Task 7: Stub eraser/select in input-manager
- [ ] Eraser/select pointer events forwarded to legacy `input.js` handlers
- [ ] Legacy handlers still work unchanged until Sprint 2 extracts them

### Task 8: Build check + run tests
- [ ] `npx vite build` succeeds
- [ ] `npx playwright test` passes

### Task 9: Push all commits
- [ ] `git push` to current branch

---

## Hiccups & Notes
- (filled in during execution)
