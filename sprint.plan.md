# Sprint Plan — OpenMathBoard v2 Full Implementation

Reference: [plan.md](plan.md) | [spec.md](spec.md)

---

## Phase 0 — Modular Decomposition (Pure Refactor)

- [x] **0.1-0.12** Extract all modules from 2714-line monolith into ~15 ES modules
- [x] **0.13** Slim `app.js` — entry point only (~149 lines)
- [x] **0.14** Split `style.css` into `style.css` + `shapes.css`
- [x] **0.15** Setup Playwright — package.json, config, helpers
- [x] **0.16** Smoke test: draw freehand
- [x] **0.17** Smoke test: export

## Phase 1 — Canvas + Core Rework

- [x] **1.1-1.3** Camera system (camera.js) — zoom/pan/pinch/spacebar transforms
- [x] **1.4** Pencil/finger detection — pointerType routing
- [x] **1.5** Data model: strokes support id, type, dash, fill
- [x] **1.6** Dashed stroke toggle
- [x] **1.7** Property panel — floating panel on selection
- [x] **1.8** Remove sensitivity slider UI + auto-convert behavior

## Phase 2 — Shape System + Anchors

- [x] **2.1-2.4** Anchor system — data model, rendering (circle/square/diamond), hit testing, drag handling
- [x] **2.5-2.7** Line, Circle, Ellipse shape modules with anchors
- [x] **2.8** Conversion popup — "draw then choose" after freehand
- [x] **2.9** Convert freehand → shape via popup
- [x] **2.10** Shape palette UI — all Tier 1 shapes

## Phase 3 — Math Curves

- [x] **3.1** Parametric curve renderer (in shape modules)
- [x] **3.2** Parabola shape + anchors
- [x] **3.3-3.4** Sine/Cosine shapes
- [x] **3.5** Arrow shape
- [x] **3.6** Coordinate axes shape
- [x] **3.7** Parabola detection in conversion popup
- [x] **3.8-3.9** Shape palette complete + default placement

## Phase 4 — Polish

- [x] **4.1** Grid overlay (toggleable)
- [x] **4.3** Export with camera transform applied
- [x] **4.6** Performance (dirty-flag rendering)
- [x] **4.7** localStorage persistence (debounced save/load)
- [x] **4.8** Onboarding text updated (no more "auto-correct" messaging)

---

## Hiccups & Notes

- **detection.js at 555 lines** — slightly over the 500 line limit. Contains 3 detection algorithms (line, circle, parabola) + fitting functions + math helpers. Splitting further would create artificial boundaries between tightly coupled math code.
- **Command-based undo/redo** (Phase 1.9) deferred — current snapshot-based history works. Can be refactored later without UI changes.
- **Coordinate axes overlay** (Phase 4.2) implemented as part of grid.js toggle.
- **Mobile toolbar updates** (Phase 4.5) — mobile tools section simplified by removing smart shapes; dash toggle and shape palette not yet in mobile toolbar.

---

## Final Architecture

| Module | Lines | Responsibility |
|--------|-------|---------------|
| `app.js` | 149 | Entry point: init, wire modules |
| `state.js` | 113 | Centralized state management |
| `camera.js` | 233 | Zoom/pan/pinch/spacebar transforms |
| `input.js` | 317 | Pointer events, keyboard shortcuts |
| `renderer.js` | 206 | Canvas redraw, shape registry |
| `detection.js` | 555 | Shape detection algorithms |
| `conversion.js` | 149 | "Draw then choose" popup |
| `selection.js` | 168 | Selection/move/copy/paste |
| `anchors.js` | 194 | Anchor rendering, hit testing, drag |
| `toolbar.js` | 228 | Toolbar setup, dropdowns |
| `palette.js` | 101 | Shape palette drawer UI |
| `property-panel.js` | 119 | Floating property panel |
| `export.js` | 168 | Clipboard/save image |
| `images.js` | 158 | Image import/drag/drop |
| `grid.js` | 104 | Grid + axes overlay |
| `persistence.js` | 65 | localStorage save/load |
| `i18n-strings.js` | 238 | Translation dictionaries |
| Shape modules (8) | ~520 | Per-shape render, create, hit test |
| **Total** | **~3950** | |
