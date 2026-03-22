# OpenMathBoard — Drawing Architecture Plan

Reference: [architecture.spec.md](architecture.spec.md)

---

## Approach

Incremental rewrite-in-place across 3 focused sprints. The app stays working after each change. No parallel system, no adapters, no legacy removal phase.

### Files that change

| File | Action |
|------|--------|
| `src/interaction/input.js` (516 lines) | Rewrite → input manager + tool routing |
| `src/canvas/renderer.js` (355 lines) | Rewrite → two-canvas scene/live split |
| `src/canvas/camera.js` (233 lines) | Refactor → remove own listeners, keep transform math |
| `src/interaction/selection.js` (219 lines) | Refactor → becomes part of select-tool |
| `index.html` | Add second canvas element |
| `style.css` | Add stacking styles for two canvases |
| New: `src/interaction/input-manager.js` | ~150 lines |
| New: `src/interaction/pen-tool.js` | ~150 lines |
| New: `src/interaction/eraser-tool.js` | ~60 lines |
| New: `src/interaction/select-tool.js` | ~200 lines |

### Files that do NOT change

All shape renderers, toolbar, palette, property panel, conversion popup, export, images, i18n, detection, persistence, anchors (logic), history (mechanism).

---

## Sprint 1 — Input/Render Decoupling

### Goal

Active pen drawing no longer triggers full committed-scene replay.

### Work

1. **Add second canvas to DOM**
   - Add `<canvas id="liveCanvas">` above the existing drawing canvas in `index.html`
   - CSS: both canvases absolutely positioned, same size, live canvas on top with `pointer-events: none` on scene canvas
   - Rename existing canvas to `sceneCanvas` in DOM and code references

2. **Create input manager** (`src/interaction/input-manager.js`)
   - Single owner of all pointer event listeners on the live canvas
   - Normalizes events: `{ x, y, screenX, screenY, pressure, pointerType, pointerId }`
   - Caches `getBoundingClientRect()` on `pointerdown` and `resize` — never during `pointermove`
   - Reads coalesced events, feature-gated: skip on iOS Safari
   - Routes normalized events to active tool's `onPointerDown/Move/Up/Cancel`
   - Handles `pointercancel` as first-class event
   - Handles `pointerleave` with existing buttons-check guard

3. **Create pen tool** (`src/interaction/pen-tool.js`)
   - Extracts pen logic from current `onPointerDown/Move/Up` branches in `input.js`
   - State machine: idle → drawing → finalizing
   - Zoom-aware point spacing: `Math.max(1, 2 / camera.zoom)` replaces fixed `MIN_POINT_SPACING`
   - Renders active stroke on live canvas only (via live render loop)
   - On pointerup: commits stroke to `strokes[]`, invalidates scene cache, stops render loop, defers history save
   - On cancel: discards stroke cleanly

4. **Split renderer into scene/live**
   - `redrawScene()` — draws committed strokes on scene canvas (using existing offscreen cache logic)
   - `redrawLive()` — clears live canvas, draws current in-progress stroke + selection overlays + anchors
   - `redrawCanvas()` — calls both (backward-compatible for UI call sites)
   - Render loop during drawing calls `redrawLive()` only, not `redrawScene()`

5. **Wire it up**
   - `app.js`: initialize input manager instead of calling `setupCanvasListeners()`
   - Input manager replaces the current `onPointerDown/Move/Up` in `input.js`
   - Move eraser and select logic into temporary stubs that forward to existing code

### Success criteria

- Drawing a stroke on a board with 50+ existing strokes does not visibly lag
- Scene canvas redraw count during active drawing: 0
- All existing Playwright tests pass
- All existing features still work (eraser, select, shapes, toolbar, etc.)

### Estimated scope

~500 lines of new/rewritten code across 4 files.

---

## Sprint 2 — Tool Separation

### Goal

Pen, eraser, and select are isolated tool modules instead of branches in one handler.

### Work

1. **Create eraser tool** (`src/interaction/eraser-tool.js`)
   - Extracts `eraseAtPoint()` and eraser drawing logic from `input.js`
   - `onPointerDown` → start erasing, start render loop
   - `onPointerMove` → erase strokes at current position
   - `onPointerUp` → stop, save history

2. **Create select tool** (`src/interaction/select-tool.js`)
   - Extracts selection, drag, and anchor editing from `input.js`
   - Sub-states: idle → pointingShape / brushing / draggingSelection / draggingAnchor
   - Selection rect, highlights, and anchors render on live canvas
   - Delegates to existing `selection.js` functions and `anchors.js` for hit-test/drag math

3. **Clean up `input.js`**
   - Remove all tool-specific code (now in tool modules)
   - `input.js` becomes thin: exports keyboard shortcuts setup only
   - The input manager is the sole pointer event owner

4. **Unify gesture handling**
   - Remove `touchstart/touchmove/touchend/touchcancel` listeners from `camera.js`
   - Pinch zoom: input manager detects 2 active pointers, forwards delta to `camera.zoomAtPoint()`
   - Pan: spacebar+pointer continues as before; finger-when-pen-detected routes to camera
   - `camera.js` keeps `zoomAtPoint`, `panByScreenDelta`, `worldToScreen`, `screenToWorld`, `setupWheelZoom`

### Success criteria

- `input.js` is under 100 lines (keyboard shortcuts only)
- Each tool module has a clear `onPointerDown/Move/Up/Cancel` interface
- Pen-vs-finger arbitration works: pen draws, finger pans when Pencil detected
- No parallel touch listeners on the canvas — all input goes through input manager
- All existing Playwright tests pass

### Estimated scope

~400 lines of new/refactored code across 3-4 files.

---

## Sprint 3 — iPad Hardening & Instrumentation

### Goal

Validate and measure the drawing experience on iPad with Apple Pencil.

### Work

1. **Add `pointercancel` test coverage**
   - Playwright test: simulate cancel during active draw → stroke discarded
   - Playwright test: simulate cancel during selection drag → selection cleared

2. **Add instrumentation** (dev-only, behind a flag or console toggle)
   - `perf.samplesReceived` — total pointer events during stroke
   - `perf.samplesCommitted` — points that passed spacing filter
   - `perf.frameDuration` — average ms per frame during drawing
   - `perf.sceneRedraws` — count of scene canvas redraws during drawing (target: 0)
   - `perf.cancelCount` — pointer cancels observed
   - Log summary on stroke completion

3. **iOS coalesced events gate**
   - Detect iOS Safari via user agent
   - Skip `getCoalescedEvents()` on iOS — use single event per pointermove instead
   - Rationale: tldraw does the same; coalesced events on iOS are unreliable in non-HTTPS local mode

4. **iPad manual test pass**
   - Fast cursive writing — no gaps
   - Rapid lift-and-tap (10+ strokes) — none missing
   - Dense board (~50 strokes) — drawing remains smooth
   - Finger pan — does not draw
   - Pinch zoom — does not corrupt drawing state
   - Document results

5. **Zoom-aware threshold tuning**
   - Test point spacing at 0.5x, 1x, 2x, 5x zoom
   - Adjust `Math.max(1, 2 / camera.zoom)` constant if needed
   - Verify cursive fidelity and performance at each level

### Success criteria

- iPad manual test pass documented with results
- Instrumentation shows 0 scene redraws during active drawing
- No regressions in existing Playwright tests
- Drawing feels smooth and reliable on iPad

### Estimated scope

~200 lines of new code (instrumentation + tests), plus manual testing.

---

## Module Layout After All Sprints

```text
src/
  app.js                          — entry point, wiring (unchanged)
  core/
    state.js                      — central state (unchanged)
    history.js                    — undo/redo (unchanged)
    persistence.js                — localStorage save/load (unchanged)
  interaction/
    input-manager.js              — NEW: pointer event normalization + routing
    pen-tool.js                   — NEW: pen drawing state machine
    eraser-tool.js                — NEW: eraser interaction
    select-tool.js                — NEW: selection, drag, anchor editing
    tools.js                      — tool switching (unchanged interface)
    selection.js                  — selection math helpers (unchanged)
    detection.js                  — shape detection (unchanged)
    input.js                      — SHRUNK: keyboard shortcuts only
  canvas/
    renderer.js                   — REWRITTEN: scene/live split
    camera.js                     — REFACTORED: listeners removed, math kept
    anchors.js                    — logic unchanged, rendering moves to live canvas
  shapes/                         — ALL UNCHANGED
  ui/                             — ALL UNCHANGED
  i18n/                           — ALL UNCHANGED
```

Total new files: 4. Total deleted files: 0. Total rewritten: 2. Total refactored: 2.

---

## Dependency Order

```
Sprint 1 does not depend on Sprint 2 or 3.
Sprint 2 depends on Sprint 1 (input manager must exist).
Sprint 3 depends on Sprint 2 (all tools must be separated).
```

Sprints are sequential. Each sprint produces a working app.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Two-canvas stacking causes visual artifacts (gaps, z-order) | Both canvases sized identically via resize observer; live canvas clears fully each frame |
| iOS Safari pointer event quirks | Feature-gate coalesced events; test on real iPad early (Sprint 3) |
| Existing UI code calls `redrawCanvas()` — breaks if API changes | Keep `redrawCanvas()` as backward-compatible wrapper that calls both `redrawScene()` + `redrawLive()` |
| Select tool refactor is complex (anchors, bounds, rotation) | Delegate to existing `selection.js` and `anchors.js` — only move the pointer routing, not the math |

---

## Definition of Done

All of the following are true:

1. Active pen drawing does not trigger scene canvas redraw.
2. `input.js` is under 100 lines (keyboard shortcuts only).
3. Pen, eraser, select are separate tool modules.
4. All pointer/touch events go through one input manager.
5. Point filtering is zoom-aware.
6. `pointercancel` is handled.
7. All existing Playwright tests pass.
8. All existing features work unchanged.
9. iPad manual test pass completed and documented.
