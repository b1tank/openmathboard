# OpenMathBoard v2 — Technical Implementation Plan

Reference: [spec.md](spec.md) for product requirements.

---

## Current Architecture (v1)

### File structure
```
app.js      — 2714 lines, single file, all logic
style.css   — 872 lines
index.html  — 385 lines
lib/i18n.js — shared i18n utility
```

### Data model (v1)
```js
// A stroke is a freehand or snapped shape
stroke = {
  points: [{x, y}, ...],    // raw or generated points
  color: '#000000',
  width: 4,
  type: 'freehand' | 'line' | 'circle' | 'parabola',
  // shape-specific (only if snapped):
  startPoint, endPoint,      // line
  cx, cy, r,                 // circle
  fit: { a, b, c, mode },   // parabola
}

// Global state
strokes = [];               // all strokes on canvas
historyStack = [];           // undo/redo snapshots (full copies)
selectedStrokes = [];        // indices into strokes[]
```

### Rendering (v1)
- Single `<canvas>` element, fixed size (window dimensions)
- Full redraw on every change (`redrawCanvas()` clears + redraws all strokes)
- Images are DOM elements overlaid on canvas, not part of stroke data
- No zoom/pan — canvas is 1:1 with viewport

### Key problems to solve
1. **No infinite canvas** — fixed canvas size, no zoom/pan
2. **No anchor system** — shapes are rendered as point arrays, not parametric objects
3. **Auto-convert is threshold-based** — frustrating sensitivity tuning
4. **No dashed strokes** — `ctx.setLineDash()` never called
5. **No property editing** — can't change existing stroke color/width
6. **History is full snapshots** — memory-heavy with many strokes

---

## Target Architecture (v2)

### Data model (v2)

```js
// ─── Base types ─────────────────────────────────────────────
// Every object on canvas extends this
CanvasObject = {
  id: string,              // unique ID (crypto.randomUUID())
  type: 'freehand' | 'line' | 'circle' | 'ellipse' | 'parabola' |
        'sine' | 'cosine' | 'arrow' | 'axes',
  // Style (shared by all objects)
  color: string,
  width: number,           // stroke width in px
  dash: boolean,           // dashed stroke?
  fill: 'none' | 'transparent' | 'solid',  // for closed shapes

  // Position in world coordinates (infinite canvas)
  // Each type stores its own geometry — see below
}

// ─── Freehand stroke ────────────────────────────────────────
FreehandObject = CanvasObject & {
  type: 'freehand',
  points: [{x, y}, ...],  // world coordinates
}

// ─── Line segment ───────────────────────────────────────────
LineObject = CanvasObject & {
  type: 'line',
  x1: number, y1: number, // endpoint A (world coords)
  x2: number, y2: number, // endpoint B
  // Anchors: [A, B]
}

// ─── Circle ─────────────────────────────────────────────────
CircleObject = CanvasObject & {
  type: 'circle',
  cx: number, cy: number,  // center (world coords)
  r: number,               // radius
  // Anchors: [center, radius-handle at (cx+r, cy)]
}

// ─── Ellipse ────────────────────────────────────────────────
EllipseObject = CanvasObject & {
  type: 'ellipse',
  cx: number, cy: number,
  rx: number,              // semi-major axis
  ry: number,              // semi-minor axis
  rotation: number,        // rotation in radians
  // Anchors: [center, right(rx), top(ry)]
}

// ─── Parabola y = a(x-h)² + k ──────────────────────────────
ParabolaObject = CanvasObject & {
  type: 'parabola',
  h: number, k: number,   // vertex (world coords)
  a: number,               // curvature coefficient
  xMin: number,            // left extent
  xMax: number,            // right extent
  // Anchors: [vertex, left-end, right-end]
  // Dragging ends changes xMin/xMax and adjusts `a` to pass through endpoint
}

// ─── Sine / Cosine: y = A·sin(B(x - C)) + D ────────────────
SineObject = CanvasObject & {
  type: 'sine' | 'cosine',
  A: number,               // amplitude
  B: number,               // angular frequency (period = 2π/B)
  C: number,               // phase shift (horizontal)
  D: number,               // vertical shift
  xMin: number,            // left extent
  xMax: number,            // right extent
  // Anchors: [left-edge, right-edge, peak, midline]
}

// ─── Arrow ──────────────────────────────────────────────────
ArrowObject = CanvasObject & {
  type: 'arrow',
  x1: number, y1: number,
  x2: number, y2: number,
  // Anchors: [start, end]
}

// ─── Coordinate Axes ────────────────────────────────────────
AxesObject = CanvasObject & {
  type: 'axes',
  ox: number, oy: number, // origin (world coords)
  xLen: number,            // half-length of x-axis
  yLen: number,            // half-length of y-axis
  // Anchors: [origin, x-pos-end, y-pos-end]
}
```

### Canvas / Camera system

```js
// Camera state (infinite canvas)
camera = {
  x: 0,          // pan offset X (world coords)
  y: 0,          // pan offset Y
  zoom: 1,       // zoom level (0.1 = zoomed out, 5 = zoomed in)
}

// World coords ↔ Screen coords conversion
function worldToScreen(wx, wy) {
  return {
    x: (wx - camera.x) * camera.zoom,
    y: (wy - camera.y) * camera.zoom
  };
}

function screenToWorld(sx, sy) {
  return {
    x: sx / camera.zoom + camera.x,
    y: sy / camera.zoom + camera.y
  };
}
```

**Implementation approach:**
- Canvas element stays full-viewport sized
- On every frame, translate all world coordinates through `worldToScreen()` before drawing
- Zoom centered on pointer/pinch midpoint
- Pan via two-finger drag (iPad) / middle-click+drag / spacebar+drag (desktop)
- Zoom via pinch (iPad) / scroll wheel (desktop) / +/- buttons

### Rendering pipeline (v2)

```
Input event → update camera or object data → requestAnimationFrame → render()

render():
  1. Clear canvas
  2. Save context, apply camera transform
  3. For each object in objects[]:
     - if freehand: draw point path
     - if shape: compute render points from params, draw
  4. For selected objects:
     - draw selection outline (bounding box, blue dashed)
     - draw anchor handles at anchor positions
  5. Draw conversion popup if active
  6. Restore context
```

**Performance:** Only redraw when state changes (dirty flag). For 100+ objects, this is still fast since it's pure canvas 2D calls. No need for spatial indexing at this scale.

### Anchor system implementation

```js
// Each shape type defines its anchors
function getAnchors(obj) {
  switch (obj.type) {
    case 'line':
      return [
        { id: 'p1', x: obj.x1, y: obj.y1, type: 'endpoint' },
        { id: 'p2', x: obj.x2, y: obj.y2, type: 'endpoint' },
      ];
    case 'circle':
      return [
        { id: 'center', x: obj.cx, y: obj.cy, type: 'center' },
        { id: 'radius', x: obj.cx + obj.r, y: obj.cy, type: 'scale' },
      ];
    case 'parabola':
      return [
        { id: 'vertex', x: obj.h, y: obj.k, type: 'center' },
        { id: 'left', x: obj.xMin, y: obj.a * (obj.xMin - obj.h) ** 2 + obj.k, type: 'curve' },
        { id: 'right', x: obj.xMax, y: obj.a * (obj.xMax - obj.h) ** 2 + obj.k, type: 'curve' },
      ];
    // ... etc
  }
}

// On anchor drag:
function onAnchorDrag(obj, anchorId, newWorldPos) {
  switch (obj.type) {
    case 'line':
      if (anchorId === 'p1') { obj.x1 = newWorldPos.x; obj.y1 = newWorldPos.y; }
      if (anchorId === 'p2') { obj.x2 = newWorldPos.x; obj.y2 = newWorldPos.y; }
      break;
    case 'circle':
      if (anchorId === 'center') { obj.cx = newWorldPos.x; obj.cy = newWorldPos.y; }
      if (anchorId === 'radius') { obj.r = Math.hypot(newWorldPos.x - obj.cx, newWorldPos.y - obj.cy); }
      break;
    case 'parabola':
      if (anchorId === 'vertex') { obj.h = newWorldPos.x; obj.k = newWorldPos.y; }
      if (anchorId === 'left') {
        obj.xMin = newWorldPos.x;
        // Recalculate `a` so curve passes through new left endpoint
        const dx = obj.xMin - obj.h;
        if (dx !== 0) obj.a = (newWorldPos.y - obj.k) / (dx * dx);
      }
      // ... similar for right
      break;
    // ... etc
  }
}
```

**Anchor rendering:**
- `endpoint` → 8px circle, white fill, colored stroke
- `center` → 8px crosshair circle
- `scale` → 8px square
- `curve` → 8px diamond (rotated square)
- All scaled by `1/camera.zoom` so they stay constant screen size
- Hit testing: check distance from pointer to each anchor, threshold = 22px screen (44px touch ÷ 2 for radius)

### "Draw then choose" popup

```js
// After pointerUp on a freehand stroke:
function showConversionPopup(stroke, endScreenPos) {
  const candidates = detectShapeCandidates(stroke.points);
  // candidates = ['line'] or ['circle'] or ['parabola'] or [] etc.

  if (candidates.length === 0) return; // no shapes detected, stay freehand

  // Show popup near stroke end
  popup.innerHTML = candidates.map(shape =>
    `<button data-shape="${shape}">${shapeIcon(shape)} ${shapeName(shape)}</button>`
  ).join('') + `<button data-shape="keep">✏️ Keep</button>`;

  popup.style.left = endScreenPos.x + 'px';
  popup.style.top = endScreenPos.y - 40 + 'px';
  popup.classList.add('show');

  // Auto-dismiss after 3s
  popupTimer = setTimeout(() => popup.classList.remove('show'), 3000);

  // On click: convert or keep
  popup.onclick = (e) => {
    const shape = e.target.dataset.shape;
    if (shape && shape !== 'keep') {
      convertFreehandToShape(stroke, shape);
    }
    popup.classList.remove('show');
    clearTimeout(popupTimer);
  };
}
```

**Detection reuses existing `detectLine()`, `detectCircle()`, `detectParabola()` functions** but with a fixed moderate threshold (no user slider). Only shows detectable shapes in popup.

### Property editing panel

```html
<!-- Floating panel, positioned near selection -->
<div id="propertyPanel" class="property-panel">
  <div class="prop-colors"><!-- 6 color swatches --></div>
  <div class="prop-widths"><!-- thin/med/thick buttons --></div>
  <div class="prop-dash"><!-- solid/dashed toggle --></div>
  <button class="prop-delete">🗑️</button>
</div>
```

- Appears when 1+ objects are selected
- Positioned above/below selection bounding box
- Clicking a property updates all selected objects
- Panel hides on deselect

### Input handling (iPad Pencil vs Finger)

```js
function onPointerDown(e) {
  const isPencil = e.pointerType === 'pen';
  const isFinger = e.pointerType === 'touch';
  const isMouse = e.pointerType === 'mouse';

  if (isPencil || isMouse) {
    // Draw / select / erase based on current tool
    handleToolDown(e);
  } else if (isFinger) {
    // Start pan (or pinch if second finger)
    handlePanStart(e);
  }
}
```

- `pointerType === 'pen'` → Apple Pencil detected → draws
- `pointerType === 'touch'` → finger → pans/zooms
- `pointerType === 'mouse'` → desktop → draws (uses tools)
- Pinch zoom: track two active touch points, compute distance delta

### Shape rendering functions

```js
// Each shape type has a render function
function renderObject(ctx, obj, camera) {
  ctx.strokeStyle = obj.color;
  ctx.lineWidth = obj.width / camera.zoom; // constant screen width
  ctx.setLineDash(obj.dash ? [8 / camera.zoom, 6 / camera.zoom] : []);

  switch (obj.type) {
    case 'freehand':
      renderFreehand(ctx, obj);
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(obj.x1, obj.y1);
      ctx.lineTo(obj.x2, obj.y2);
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(obj.cx, obj.cy, obj.r, 0, Math.PI * 2);
      ctx.stroke();
      if (obj.fill !== 'none') { ctx.fillStyle = ...; ctx.fill(); }
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(obj.cx, obj.cy, obj.rx, obj.ry, obj.rotation, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'parabola':
      renderParametricCurve(ctx, obj, (t) => {
        const x = obj.xMin + t * (obj.xMax - obj.xMin);
        const y = obj.a * (x - obj.h) ** 2 + obj.k;
        return { x, y };
      });
      break;
    case 'sine':
      renderParametricCurve(ctx, obj, (t) => {
        const x = obj.xMin + t * (obj.xMax - obj.xMin);
        const y = obj.A * Math.sin(obj.B * (x - obj.C)) + obj.D;
        return { x, y };
      });
      break;
    case 'cosine':
      renderParametricCurve(ctx, obj, (t) => {
        const x = obj.xMin + t * (obj.xMax - obj.xMin);
        const y = obj.A * Math.cos(obj.B * (x - obj.C)) + obj.D;
        return { x, y };
      });
      break;
    case 'arrow':
      renderArrow(ctx, obj);
      break;
    case 'axes':
      renderAxes(ctx, obj);
      break;
  }
}

// Generic parametric curve renderer (parabola, sine, cosine, etc.)
function renderParametricCurve(ctx, obj, paramFn, steps = 200) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const { x, y } = paramFn(t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
```

### History system (v2)

Switch from full-state snapshots to **command-based undo/redo**:

```js
// Each action produces a command
command = {
  type: 'add' | 'remove' | 'modify' | 'batch',
  objectId: string,
  before: {...},  // previous state (for undo)
  after: {...},   // new state (for redo)
}

historyStack = [];  // commands
historyIndex = -1;

function undo() {
  if (historyIndex < 0) return;
  const cmd = historyStack[historyIndex--];
  applyReverse(cmd);
}

function redo() {
  if (historyIndex >= historyStack.length - 1) return;
  const cmd = historyStack[++historyIndex];
  applyForward(cmd);
}
```

This is much more memory-efficient than copying the entire strokes array.

---

## Migration Strategy

### What to keep from v1
- i18n system and translations (expand with new strings)
- Color palette, stroke width presets, keyboard shortcuts
- Image import/export (drag & drop, clipboard, save)
- Overall toolbar layout and mobile hamburger menu
- Shape detection algorithms (`detectLine`, `detectCircle`, `detectParabola`)

### What to rewrite
- **Canvas rendering** — add camera transform layer
- **Data model** — stroke objects → typed CanvasObject with params
- **Input handling** — add pencil/finger separation, pan/zoom
- **Selection** — anchor-aware hit testing
- **History** — snapshot → command-based

### What to remove
- Sensitivity slider UI and all related code
- Auto-convert on stroke end (replaced by popup)
- `SMART_SHAPE_DEFAULTS`, `SMART_SHAPE_STORAGE_KEY`, sensitivity presets

### What to add
- Camera system (zoom/pan/transforms)
- Anchor system (rendering, hit testing, drag handling)
- Property panel (floating, contextual)
- Conversion popup ("draw then choose")
- Shape palette (toolbar drawer)
- Dashed stroke rendering
- Predefined shape constructors (sine, cosine, axes, arrow)

---

## Phase 1 — Canvas + Core Rework

**Goal:** Infinite canvas with zoom/pan, dashed strokes, property editing. No new shapes yet — existing freehand + snapped shapes work on infinite canvas.

### Tasks
- [ ] **1.1 Camera system** — `camera = {x, y, zoom}`, `worldToScreen()`, `screenToWorld()`, apply transform in `redrawCanvas()`
- [ ] **1.2 Zoom** — scroll wheel (desktop), pinch gesture (iPad), +/- buttons in toolbar
- [ ] **1.3 Pan** — spacebar+drag (desktop), two-finger drag (iPad), middle-click drag
- [ ] **1.4 Pencil/finger detection** — `pointerType === 'pen'` → draw, `'touch'` → pan
- [ ] **1.5 Data model migration** — convert `strokes[]` to `objects[]` with `id`, `type`, `dash`, `fill`
- [ ] **1.6 Dashed stroke toggle** — new toolbar button, `ctx.setLineDash()`
- [ ] **1.7 Property panel** — floating panel on selection: change color, width, dash of existing objects
- [ ] **1.8 Remove sensitivity slider** — delete UI, smart shape settings, storage key
- [ ] **1.9 History refactor** — command-based undo/redo replacing snapshot-based

### Estimated size: ~800 lines changed, ~200 lines new

---

## Phase 2 — Shape System + Anchors

**Goal:** Anchor system on line/circle/ellipse. "Draw then choose" popup. Shape palette UI (empty for now, populated in Phase 3).

### Tasks
- [ ] **2.1 Anchor data model** — `getAnchors(obj)` returns array of typed anchor points
- [ ] **2.2 Anchor rendering** — draw handles (circle/square/diamond) at anchor positions, constant screen size
- [ ] **2.3 Anchor hit testing** — on pointerDown, check if pointer is near an anchor before starting draw/select
- [ ] **2.4 Anchor dragging** — `onAnchorDrag(obj, anchorId, newWorldPos)` updates object params live
- [ ] **2.5 Line anchors** — 2 endpoints, drag to move/rotate/resize
- [ ] **2.6 Circle anchors** — center + radius handle
- [ ] **2.7 Ellipse anchors** — center + rx handle + ry handle (circle → ellipse by dragging ry)
- [ ] **2.8 Conversion popup** — after freehand stroke, detect candidates, show popup near stroke end
- [ ] **2.9 Convert freehand → shape** — replace freehand object with typed shape object (line/circle/ellipse)
- [ ] **2.10 Shape palette UI** — toolbar drawer/panel (initially with line, circle, ellipse)

### Estimated size: ~600 lines new

---

## Phase 3 — Math Curves

**Goal:** Parabola, sine, cosine, arrow, coordinate axes — all with anchors. Shape palette fully populated.

### Tasks
- [ ] **3.1 Parametric curve renderer** — generic `renderParametricCurve(ctx, obj, paramFn)` 
- [ ] **3.2 Parabola** — vertex + 2 curve-end anchors, `a` recalculated on drag
- [ ] **3.3 Sine curve** — predefined shape: A, B, C, D params, 4 anchors (edges, peak, midline)
- [ ] **3.4 Cosine curve** — same engine as sine, `C` offset by π/2
- [ ] **3.5 Arrow shape** — line + arrowhead, 2 endpoint anchors
- [ ] **3.6 Coordinate axes** — origin + x-length + y-length anchors, with tick marks
- [ ] **3.7 Parabola detection in popup** — existing `detectParabola()` wired into conversion popup
- [ ] **3.8 Shape palette complete** — all Tier 1 shapes available: line, circle, ellipse, parabola, sine, cosine, arrow, axes
- [ ] **3.9 Shape default placement** — tap shape in palette → place default instance at viewport center

### Estimated size: ~500 lines new

---

## Phase 4 — Polish

**Goal:** Grid overlay, export fixes, performance, mobile UX.

### Tasks
- [ ] **4.1 Grid overlay** — toggleable graph paper background, scales with zoom
- [ ] **4.2 Coordinate axes overlay** — optional always-visible axes with labels
- [ ] **4.3 Export fix** — render visible viewport to PNG (respecting zoom/pan)
- [ ] **4.4 Keyboard shortcuts** — update for new tools (shape palette, zoom, pan)
- [ ] **4.5 Mobile toolbar** — hamburger menu updates for new tools/shapes
- [ ] **4.6 Performance** — dirty-flag rendering, avoid redraw when nothing changed
- [ ] **4.7 localStorage persistence** — save/load objects[] + camera state
- [ ] **4.8 Onboarding** — update hero section text, keyboard shortcut hints

### Estimated size: ~400 lines new

---

## Total estimated effort

| Phase | New/Changed Lines | Duration |
|-------|-------------------|----------|
| Phase 1 — Canvas + Core | ~1000 | ~1 week |
| Phase 2 — Shapes + Anchors | ~600 | ~1 week |
| Phase 3 — Math Curves | ~500 | ~1 week |
| Phase 4 — Polish | ~400 | ~1 week |
| **Total** | **~2500** | **~4 weeks** |

Current `app.js` is 2714 lines. After v2, expect ~4000-4500 lines (single file, per yummyjars convention).
