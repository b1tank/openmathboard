# Sprint Plan — iPad Apple Pencil Rendering Stability

## Objective
Eliminate dropped/missing strokes on iPad (Apple Pencil) by reducing pointermove render pressure, preserving high-frequency points, and cutting history-clone spikes.

## Scope
- In scope: `src/interaction/input.js`, `src/core/history.js`, `src/canvas/renderer.js` (gated), plus required cache invalidation call sites.
- Out of scope: worker-based rendering, tile cache system, major stroke data-structure rewrite.

## Success Criteria (must pass)
- No missing strokes in rapid lift-and-tap sequence (10+ consecutive strokes).
- Smooth fast handwriting without visible gaps.
- No regressions in select/drag/anchor/eraser interactions.
- `npx playwright test` passes.

## Delivery Strategy
Ship in two phases to control risk.

### Phase 1 (mandatory)
1. RAF-batched pointermove redraws.
2. Coalesced Pencil events + point spacing filter.
3. Replace JSON history clone with `structuredClone`.

### Phase 2 (conditional)
4. Offscreen committed-strokes cache.

**Go/No-Go Gate for Phase 2**
- Run Phase 1 verification on iPad.
- Only implement Phase 2 if missing strokes or unacceptable drawing latency still reproduces.

---

## Actionable Implementation Checklist

## P0 — Task 1: RAF-batch all pointermove redraws
**File:** `src/interaction/input.js`

- [x] Add module-level RAF scheduler:
  - [x] `let rafId = null`.
  - [x] `scheduleRedraw()` that gates to one `requestAnimationFrame` callback.
  - [x] In callback: call `redrawCanvas()`; if `getCurrentStroke()` exists, draw in-progress stroke overlay using `getCtx()`.
- [x] Replace pointermove synchronous redraw sites with `scheduleRedraw()`:
  - [x] anchor drag path.
  - [x] selection drag path.
  - [x] selection-rect path.
  - [x] PEN path (remove direct `getCanvas().getContext('2d')` draw block).
  - [x] eraser path (`eraseAtPoint` should schedule, not redraw synchronously).
- [x] Keep discrete-action redraws synchronous:
  - [x] click-to-select in `onPointerDown`.
  - [x] selection finalize in `onPointerUp`.
  - [x] end-of-stroke finalize in `onPointerUp`.
- [x] Add invariant comment near `setCurrentStroke(null)` in `onPointerUp`:
  - Clear current stroke before pending RAF callback runs; callback must tolerate `null`.

## P0 — Task 2: Coalesced events for PEN path
**File:** `src/interaction/input.js`

- [x] Add helper constant and distance utility:
  - [x] `const MIN_POINT_SPACING = 1.5` (world units).
  - [x] `worldDistance(a, b)`.
- [x] In PEN `onPointerMove` branch:
  - [x] Read `const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]`.
  - [x] Push points from each event through spacing filter.
  - [x] Preserve pressure via existing `getPointerPos(ce)` path.
  - [x] Use `scheduleRedraw()` (from Task 1).
- [x] Add tuning note in code comment: spacing is intentionally configurable if zoomed detail feels too coarse.

## P0 — Task 3: History clone optimization
**File:** `src/core/history.js`

- [x] Replace `JSON.parse(JSON.stringify(...))` with `structuredClone(...)` in `saveToHistory()`.
- [x] Replace `JSON.parse(JSON.stringify(...))` with `structuredClone(...)` in `restoreFromHistory()`.
- [x] Keep behavior/order unchanged (`updateHistoryButtons`, `scheduleSave`, selection reset).

## P1 (Gated) — Task 4: Offscreen cache for committed strokes
**File:** `src/canvas/renderer.js`

- [ ] Implement cache primitives:
  - [ ] `offscreenCanvas`, `offscreenCtx`, `cacheValid`, `cachedCamera`, `cachedStrokesLength`.
  - [ ] `invalidateCache()` export.
  - [ ] `ensureOffscreen(width, height)` with fallback if `OffscreenCanvas` unavailable.
- [ ] Update `redrawCanvas()`:
  - [ ] Build committed-strokes cache when invalid/camera changed/stroke count changed.
  - [ ] Blit cache to visible canvas.
  - [ ] Draw overlays (selection highlights, anchors, selection-rect) on visible canvas only.
- [ ] Retire unused dirty API cleanly (`markDirty`) or map it to `invalidateCache`.

### Task 4 Required Invalidation Coverage (must be complete)

**Centralized invalidation first (preferred):**
- [ ] Invalidate in `setStrokes(...)` (`src/core/state.js`) to cover all full-array replacements.

**Explicit invalidation for in-place mutation paths:**
- [ ] `src/interaction/selection.js`
  - [ ] `moveSelectedStrokes(...)`.
  - [ ] `deleteSelectedStrokes()`.
  - [ ] `pasteStrokes()`.
- [ ] `src/canvas/anchors.js`
  - [ ] `onAnchorDrag(...)`.
- [ ] `src/ui/property-panel.js`
  - [ ] `applyToSelected(...)`.
- [ ] `src/ui/conversion.js`
  - [ ] `convertLastStroke(...)`.
- [ ] `src/interaction/input.js`
  - [ ] stroke add path in `onPointerUp` (after push/finalize).
  - [ ] `eraseAtPoint(...)` when stroke set changes.
- [ ] `src/core/history.js`
  - [ ] `restoreFromHistory()`.
- [ ] `src/ui/toolbar.js`
  - [ ] clear canvas flow (`setStrokes([])`).
- [ ] `src/core/persistence.js`
  - [ ] `loadState()` after applying loaded strokes.

---

## Test Checklist (execution-ready)

## A. Functional regressions
- [ ] Anchor drag remains smooth.
- [ ] Selection drag tracks pointer without jump.
- [ ] Selection rectangle updates smoothly.
- [ ] Eraser scribble removes targeted strokes reliably.
- [ ] Undo/redo correctness after draw, move, erase, convert.

## B. iPad/Pencil validation
- [ ] Rapid lift-and-tap: 10+ strokes, none missing.
- [ ] Fast cursive writing: no visible gaps.
- [ ] Zoomed detail (5×): spacing does not over-filter.

## C. Cache-specific (Phase 2 only)
- [ ] Undo invalidates cache correctly.
- [ ] Erase invalidates cache correctly.
- [ ] Property edits invalidate cache correctly.
- [ ] Conversion popup replacement invalidates cache correctly.
- [ ] Pan/zoom and resize show no stale artifacts.

## D. Automation
- [x] Run `npx playwright test`.

---

## Implementation Order
1. Task 1 (RAF batching)
2. Task 2 (coalesced events)
3. Task 3 (history clone optimization)
4. Run validation checklist A/B/D
5. Decide Phase 2 with Go/No-Go gate
6. If needed, implement Task 4 and checklist C

## Risks & Mitigations
- Risk: stale cache due to missed invalidation.
  - Mitigation: centralized invalidation in `setStrokes` + explicit checklist above.
- Risk: over-filtered points at high zoom.
  - Mitigation: tune `MIN_POINT_SPACING` after iPad validation.
- Risk: unnecessary complexity if Phase 1 already solves issue.
  - Mitigation: strict Phase 2 gate.

## Hiccups & Notes
- Tasks 1+2 committed together (tightly coupled — both modify `onPointerMove` in `input.js`).
- Build and Playwright tests pass after all changes.
- Phase 2 (Task 4: offscreen cache) deferred pending iPad validation of Phase 1.

