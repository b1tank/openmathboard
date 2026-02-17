# Sprint Plan — OpenMathBoard v2 Full Implementation

Reference: [plan.md](plan.md) | [spec.md](spec.md)

---

## Phase 0 — Modular Decomposition (Pure Refactor)

- [ ] **0.1** Extract `i18n-strings.js` — TRANSLATIONS object
- [ ] **0.2** Extract `state.js` — all global state with getter/setter exports
- [ ] **0.3** Extract `history.js` — undo/redo logic
- [ ] **0.4** Extract `tools.js` — setTool, setColor, setStrokeWidth
- [ ] **0.5** Extract `detection.js` — shape detection + math helpers
- [ ] **0.6** Extract `shapes/freehand.js` — freehand rendering
- [ ] **0.7** Extract `renderer.js` — redrawCanvas, selection drawing
- [ ] **0.8** Extract `selection.js` — find/move/copy/paste strokes
- [ ] **0.9** Extract `input.js` — pointer events, eraser
- [ ] **0.10** Extract `toolbar.js` — toolbar setup, dropdowns, mobile menu
- [ ] **0.11** Extract `export.js` — clipboard, save image
- [ ] **0.12** Extract `images.js` — drop zone, image import, drag
- [ ] **0.13** Slim `app.js` — entry point only (~80 lines)
- [ ] **0.14** Split `style.css` into `style.css` + `shapes.css`
- [ ] **0.15** Setup Playwright — package.json, config, helpers
- [ ] **0.16** Smoke test: draw freehand
- [ ] **0.17** Smoke test: export

## Phase 1 — Canvas + Core Rework

- [ ] **1.1** Camera system (camera.js) — zoom/pan transforms
- [ ] **1.2** Zoom — scroll wheel, pinch, +/- buttons
- [ ] **1.3** Pan — spacebar+drag, two-finger, middle-click
- [ ] **1.4** Pencil/finger detection — pointerType routing
- [ ] **1.5** Data model migration — strokes[] → objects[] with id, type, dash, fill
- [ ] **1.6** Dashed stroke toggle
- [ ] **1.7** Property panel — floating panel on selection
- [ ] **1.8** Remove sensitivity slider UI + smart shape settings
- [ ] **1.9** History refactor — command-based undo/redo

## Phase 2 — Shape System + Anchors

- [ ] **2.1** Anchor data model — getAnchors(obj)
- [ ] **2.2** Anchor rendering — handles at anchor positions
- [ ] **2.3** Anchor hit testing
- [ ] **2.4** Anchor dragging
- [ ] **2.5–2.7** Line, Circle, Ellipse anchors
- [ ] **2.8** Conversion popup — "draw then choose"
- [ ] **2.9** Convert freehand → shape
- [ ] **2.10** Shape palette UI

## Phase 3 — Math Curves

- [ ] **3.1** Parametric curve renderer
- [ ] **3.2** Parabola shape + anchors
- [ ] **3.3–3.4** Sine/Cosine shapes
- [ ] **3.5** Arrow shape
- [ ] **3.6** Coordinate axes shape
- [ ] **3.7** Parabola detection in popup
- [ ] **3.8–3.9** Shape palette complete + default placement

## Phase 4 — Polish

- [ ] **4.1** Grid overlay
- [ ] **4.2** Coordinate axes overlay
- [ ] **4.3** Export fix (viewport-aware)
- [ ] **4.4** Keyboard shortcuts update
- [ ] **4.5** Mobile toolbar updates
- [ ] **4.6** Performance (dirty-flag)
- [ ] **4.7** localStorage persistence
- [ ] **4.8** Onboarding update

---

## Hiccups & Notes

_(logged as encountered)_
