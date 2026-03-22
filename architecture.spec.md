# OpenMathBoard — Drawing Architecture Spec

## One-Line Definition

> Fix the drawing core so Apple Pencil input on iPad is smooth, reliable, and structurally correct — by rewriting the problematic modules in-place, not building a parallel system.

---

## 1. Problem Statement

The current codebase (~5k lines, ~20 modules) is functional but its drawing path is not suitable for high-quality Apple Pencil input. Users experience lag, missed strokes, and interrupted drawing.

Root causes identified in the current code:

| File | Lines | Problem |
|------|-------|---------|
| `src/interaction/input.js` | 516 | Input, tool logic, and rendering are coupled in one shared event handler. `getPointerPos()` reads `getBoundingClientRect()` on every coalesced sample. Point filtering uses fixed world-space distance that changes behavior with zoom. No `pointercancel` handling. |
| `src/canvas/renderer.js` | 355 | `redrawCanvas()` replays all committed strokes every frame during active drawing. The offscreen cache helps but still rebuilds on every camera or stroke-count change. |
| `src/canvas/camera.js` | 233 | Registers its own raw `touchstart/touchmove/touchend` listeners on the canvas, competing with the pointer listeners in `input.js`. |
| `src/core/history.js` | 61 | Uses `structuredClone()` of the full stroke array at interaction boundaries — acceptable for now but will not scale. |

The rest of the codebase — shapes, toolbar, palette, property panel, export, i18n — is not part of the drawing problem and should not be rewritten.

---

## 2. Goal

After this work, these properties must be true:

1. Active pen drawing does not trigger full committed-scene replay.
2. Input normalization does zero rendering work and zero layout reads.
3. Pen, eraser, select, and camera are separate tool modules, not branches in one handler.
4. Pointer listeners are unified under one owner — no parallel touch listeners.
5. Point filtering is zoom-aware, not fixed world-space.
6. `pointercancel` is handled correctly.
7. Gesture arbitration (pen vs finger vs pinch) is deterministic.

---

## 3. Non-Goals

- Building a parallel architecture alongside the current one
- Creating adapter layers or co-existence bridges
- Changing the shape data model or shape renderers
- Changing the toolbar, palette, property panel, export, or i18n modules
- Shipping cloud sync, auth, or sharing during this work
- Copying source code from external projects

---

## 4. Approach: Incremental Rewrite-in-Place

The codebase is small enough (~2k lines in the affected core) to rewrite in-place. The app stays working after each change. No parallel system, no feature flags, no legacy removal phase.

This is the right approach because:

- The codebase is ~5k total lines — small enough to hold in your head
- There are no users, no backward-compatibility constraints
- The module boundaries are already reasonable; the problem is what happens inside 2-3 files
- Parallel construction would produce more adapter complexity than the rewrite itself

---

## 5. Reference Architectures

Learn from, do not copy from:

### tldraw

- Central `InputsManager` normalizes all pointer data before tools see it
- Tools are state machines with explicit phases (idle → pointing → drawing)
- Pen point recording uses zoom-aware distance: `1 / editor.getZoomLevel()`
- Coalesced events are feature-gated — disabled on iOS where they're unreliable
- Pressure is smoothed via `RATE_OF_PRESSURE_CHANGE` constant
- Pointer velocity is tracked independently and updated on tick

### Excalidraw

- Rendering is split into `renderStaticScene` (committed) and `renderInteractiveScene` (live)
- `throttleRAF` gates pointermove rendering to one RAF
- Scene mutation and scene drawing are fully separated
- `pointercancel` is handled as a first-class event on the interactive canvas

---

## 6. Architectural Principles

1. **Input first, rendering second** — pointer handlers collect data; rendering consumes it on RAF.
2. **Two render paths** — committed scene (cached) and live overlay (redrawn per frame during interaction).
3. **One interaction owner** — a single input manager routes to the active tool; no parallel listeners.
4. **Tools own their state** — each tool is a module with its own interaction phases.
5. **Screen-space fidelity** — sampling thresholds scale with zoom level.
6. **Correctness before optimization** — get the architecture right first; micro-optimize later.

---

## 7. What Changes

### 7.1 Input Manager (rewrite of input event setup in `input.js`)

Extract a thin input manager that:

- Owns all pointer event listeners on the canvas (down, move, up, cancel, leave)
- Normalizes each event into `{ x, y, screenX, screenY, pressure, pointerType, pointerId, coalesced[] }`
- Caches canvas rect on pointerdown and resize — never reads layout mid-stroke
- Routes normalized events to the active tool module
- Handles pointer capture and pointer cancel

This replaces the current `setupCanvasListeners()`, `getPointerPos()`, `onPointerDown()`, `onPointerMove()`, and `onPointerUp()` in `input.js`.

### 7.2 Tool Modules (refactor of tool branches in `input.js`)

Split the current giant if/else tool branches into separate modules:

- `pen-tool.js` — drawing state machine: idle → pointing → drawing → finalizing
- `eraser-tool.js` — erase interaction logic
- `select-tool.js` — selection rect, drag, anchor editing

Each tool exports: `onPointerDown(e)`, `onPointerMove(e)`, `onPointerUp(e)`, `onCancel()`.

The input manager calls the active tool's handler. Tool switching remains in `tools.js`.

### 7.3 Canvas Layers (rewrite of rendering in `renderer.js`)

Split rendering into two canvas elements stacked via CSS:

- **Scene canvas** — committed strokes and shapes, redrawn only when scene data or camera changes
- **Live canvas** — active stroke, selection rect, anchors, eraser trail — redrawn every RAF during interaction

This replaces the current `redrawCanvas()` + `renderLoopTick()` approach where the entire scene replays on every frame.

The existing offscreen cache becomes the scene canvas cache. The current overlay drawing (selection highlights, anchors) moves to the live canvas.

### 7.4 Gesture Unification (rewrite of camera listeners in `camera.js`)

Remove the separate `touchstart/touchmove/touchend` listeners in `camera.js`. Route all touch and pointer events through the input manager.

Pinch zoom becomes a gesture recognized by the input manager (two active pointers) and forwarded to the camera controller. Pan becomes a tool mode or a recognized gesture (spacebar + pointer, or finger when pen is primary).

The camera module keeps its transform math (`zoomAtPoint`, `panByScreenDelta`, `worldToScreen`, `screenToWorld`) but loses its own event listeners.

### 7.5 Point Sampling Fix (targeted fix in pen tool)

Replace the current fixed `MIN_POINT_SPACING = 1.5` world-unit filter with zoom-aware spacing:

```js
const minSpacing = Math.max(1, 2 / camera.zoom);
```

This ensures consistent screen-space fidelity at all zoom levels.

### 7.6 History (keep, minor adjustment)

History stays as `structuredClone()` snapshots at interaction boundaries. No change to the mechanism — just ensure commit points align with the new tool finalization flow.

---

## 8. What Does Not Change

These modules are not part of the drawing problem and should not be modified:

- All shape renderers (`shapes/*.js`) — they receive `(ctx, stroke)` and draw; this interface stays
- Shape data model — strokes keep their current `{ points, color, width, dash, shape }` structure
- Toolbar, palette, property panel, conversion popup (`ui/*.js`)
- Export and image handling (`ui/export.js`, `ui/images.js`)
- i18n (`i18n/*.js`)
- Detection (`interaction/detection.js`)
- Persistence (`core/persistence.js`)
- Anchors (`canvas/anchors.js`) — rendering moves to live canvas but hit-test and drag logic stays

UI modules that currently call `redrawCanvas()` or `saveToHistory()` will call the same-named functions — the implementation behind them changes but the call sites don't.

---

## 9. Rendering Model

### Implementation: Two stacked canvases

```html
<div id="canvasContainer">
  <canvas id="sceneCanvas"></canvas>   <!-- committed strokes, below -->
  <canvas id="liveCanvas"></canvas>     <!-- active interaction, above -->
</div>
```

Both canvases are the same size, absolutely positioned, with `pointer-events: none` on the scene canvas.

### Scene canvas

- Redraws when: stroke added/removed, stroke property changed, camera moved, resize
- Uses the existing offscreen cache pattern for committed strokes
- Does NOT redraw during active pen drawing

### Live canvas

- Cleared and redrawn every RAF during active interaction
- Draws: current in-progress stroke, selection rect, selection highlights, anchors, eraser trail
- Cheap because it only draws 1-2 objects, not the whole scene

### Redraw API

- `redrawScene()` — marks scene canvas dirty, redraws on next RAF
- `redrawLive()` — marks live canvas dirty, redraws on next RAF (called by render loop during interaction)
- `redrawCanvas()` — calls both (backward-compatible name for UI call sites)

---

## 10. Data Flow: Pen Stroke

End-to-end path for drawing one stroke:

```
pointerdown (DOM)
  → InputManager.onPointerDown()
    → cache canvas rect
    → normalize event
    → PenTool.onPointerDown(normalized)
      → create currentStroke { points: [pt], color, width, dash }
      → start render loop (RAF)

pointermove (DOM)
  → InputManager.onPointerMove()
    → normalize event (using cached rect)
    → read coalesced events (feature-gated)
    → PenTool.onPointerMove(normalized)
      → push points through zoom-aware spacing filter
      → (render loop draws currentStroke on live canvas each frame)

pointerup (DOM)
  → InputManager.onPointerUp()
    → normalize event
    → PenTool.onPointerUp(normalized)
      → capture final point
      → push currentStroke to scene store (strokes[])
      → invalidate scene cache
      → clear currentStroke
      → stop render loop
      → redrawScene()
      → defer: saveToHistory(), showConversionPopup()

pointercancel (DOM)
  → InputManager.onPointerCancel()
    → PenTool.onCancel()
      → discard currentStroke
      → stop render loop
      → clear live canvas
```

---

## 11. iPad / Apple Pencil Requirements

- `pointercancel` handled — discards in-progress stroke cleanly
- `pointerleave` guarded — only finalizes if no buttons pressed (existing logic kept)
- Canvas rect cached on `pointerdown` and `resize` — no `getBoundingClientRect()` during move
- Coalesced events: use `e.getCoalescedEvents()` on non-iOS; fall back to single event on iOS Safari
- Pen vs finger: when pen input detected, finger touch is routed to camera (pan/zoom), not drawing
- Touch listeners unified — no parallel `touchstart/touchmove/touchend` competing with pointer events

---

## 12. Testing

### Automated (Playwright)

- pen draw: start → move → end produces correct stroke
- rapid short strokes: 10+ consecutive, none missing
- selection drag: correct position tracking
- anchor drag: shape updates correctly
- undo/redo: correct at interaction boundaries
- existing e2e tests pass unchanged

### Manual (iPad + Apple Pencil)

- fast cursive writing — no visible gaps
- rapid lift-and-tap — no missing strokes
- dense board (~50 strokes) — drawing remains smooth
- finger pan while Pencil is available — does not draw
- pinch zoom — does not interfere with drawing state

### Instrumentation (added to dev builds)

- pointer samples received vs committed to stroke
- frame duration while drawing
- scene canvas redraw count during active drawing (target: 0)
- pointer cancel count

---

## 13. Success Criteria

1. Active pen drawing does not trigger scene canvas redraw.
2. Apple Pencil drawing feels smooth under fast real usage on iPad.
3. Pen, eraser, and select are separate tool modules.
4. All pointer/touch listeners go through one input manager.
5. Point filtering is zoom-aware.
6. `pointercancel` is handled.
7. All existing Playwright tests pass.
8. All existing features (shapes, anchors, conversion, export, toolbar) still work.
