# OpenMathBoard v2 — Redesign Spec

## 🧠 One-Line Definition

> **A math-first infinite canvas whiteboard where teachers draw freehand, explicitly convert to math shapes, and tune them with parametric anchors — optimized for iPad + Apple Pencil live teaching.**

## Top Principles

1. **Explicit over magic** — Users choose when to convert freehand → shapes; no surprise auto-conversions
2. **Anchors on everything** — Every shape has draggable handles to tune geometry precisely
3. **Math objects, not pixels** — A parabola is {vertex, a, direction}, not Bézier curves
4. **Freehand is always available** — Smart shapes enhance but never replace raw drawing
5. **Teacher speed** — Every interaction must work at live-teaching pace (< 200ms response)

---

## 1. Canvas System

| Feature | Support |
|---------|---------|
| Infinite canvas (pan in all directions) | ✅ |
| Zoom (pinch + scroll wheel + buttons) | ✅ |
| Pan (two-finger drag / middle-click / spacebar+drag) | ✅ |
| Minimap | ❌ (non-goal) |
| Grid overlay (optional, toggleable) | ✅ |
| Coordinate axes overlay (toggleable) | ✅ |
| Canvas background color | ✅ white / graph paper |

**Implementation:** DIY CSS transforms on a container element. No React/framework dependency. Zoom via `transform: scale()`, pan via `translate()`. Touch events for iPad, pointer events for desktop.

---

## 2. Drawing & Strokes

| Feature | Support |
|---------|---------|
| Freehand drawing (current behavior) | ✅ |
| Stroke colors (6 colors) | ✅ |
| Stroke widths (thin/medium/thick) | ✅ |
| **Dashed stroke toggle** | ✅ NEW |
| **Change existing stroke properties** (color, width, dash) | ✅ NEW |
| Eraser (tap to remove stroke) | ✅ |
| Select tool (click, drag-rect) | ✅ |
| Move selected strokes/shapes | ✅ |
| Copy/paste selected | ✅ |
| Undo/redo | ✅ |

---

## 3. Shape Conversion UX (NEW)

**"Draw then choose" pattern** — after completing a freehand stroke, a small popup appears near the stroke offering conversion options. This is best practice (matches Apple Notes, Samsung Notes, OneNote's behavior).

| Step | Behavior |
|------|----------|
| User draws a freehand stroke | Stroke appears as freehand |
| On stroke end, if shape is detectable | Popup: "Convert to: Line / Circle / Parabola / Keep freehand" |
| User taps a shape option | Freehand replaced with parametric shape + anchors |
| User taps "Keep" or taps away | Stays freehand |
| Popup auto-dismisses after 3s | Stays freehand |

**Detection sensitivity:** Internal detection runs at a fixed reasonable threshold. No user-facing sensitivity slider (removed). The popup lets the user decide — no false positives.

**Detectable shapes from freehand:**
| Shape | Detection heuristic |
|-------|-------------------|
| Straight line | Low curvature variance |
| Circle | Closed loop, consistent radius |
| Ellipse | Closed loop, two-axis ratio |
| Parabola | Open curve, fits y=ax²+bx+c |
| Arc | Partial circle/ellipse |

---

## 4. Shape Palette (NEW — Predefined Shapes)

For shapes that are hard to draw freehand, provide a **shape palette** in the toolbar. Tap to place a default instance, then tune with anchors.

### Tier 1 — Predefined shapes with anchors (MVP)

| Shape | Default placement | Anchors |
|-------|------------------|---------|
| **Line segment** | Horizontal line | 2 endpoints (drag to move/rotate/resize) |
| **Circle** | Unit circle | Center + radius handle |
| **Ellipse** | Default ellipse | Center + semi-major + semi-minor handles |
| **Parabola** | y=x² | Vertex + 2 curve-end handles (stretch/flatten) |
| **Sine curve** | y=sin(x), one period | Start-x + end-x + amplitude handle + vertical shift |
| **Cosine curve** | y=cos(x), one period | Same as sine |
| **Arrow** | Horizontal arrow | 2 endpoints + optional label |
| **Coordinate axes** | Standard x-y axes | Origin (movable) + axis length handles |

### Tier 2 — Add later

| Shape | Anchors |
|-------|---------|
| Exponential (eˣ) | Base point + growth rate handle + range |
| Logarithmic (ln x) | Base point + scale handle + range |
| Rational (1/x) | Center + scale handle |
| Hyperbola | Center + a + b handles |
| Tangent line (to a curve) | Tangent point on parent curve |
| Absolute value (|x|) | Vertex + slope handles |

### Tier 3 — Future

| Shape | Notes |
|-------|-------|
| 3D prism/pyramid/cone/sphere | Wireframe with standard angles |
| Vector arrow | With magnitude/direction handles |
| Angle arc with label | Between two lines |
| Number line | With tick marks |

---

## 5. Anchor System (NEW — Core Feature)

Every shape becomes tunable via draggable anchor points.

| Anchor type | Visual | Behavior |
|-------------|--------|----------|
| **Endpoint** | ○ small circle | Drag to move one end of a line/curve |
| **Center** | ⊕ crosshair | Drag to reposition entire shape |
| **Radius/Scale** | □ small square | Drag to resize/stretch |
| **Curve control** | ◇ diamond | Drag to change curvature/amplitude |

**Anchor interaction:**
- Anchors appear when shape is selected
- Anchors are large enough for finger/pencil tap (min 44px touch target)
- Dragging an anchor live-updates the shape
- Double-tap a shape to enter "anchor edit" mode
- Tap elsewhere to deselect

**Specific anchor layouts:**

**Line:** `○————————○` (2 endpoints)

**Circle:** Center `⊕` + radius handle `□` at 3 o'clock

**Ellipse:** Center `⊕` + semi-major `□` (right) + semi-minor `□` (top)

**Parabola y=a(x-h)²+k:**
- Vertex `⊕` (drag → move h,k)
- Two curve-end handles `◇` (drag apart → flatten, drag together → steepen)

**Sine/Cosine y=A·sin(Bx+C)+D:**
- Left edge `○` (drag → change start x / phase C)
- Right edge `○` (drag → change period via B)
- Peak `◇` (drag up/down → change amplitude A)
- Midline `□` (drag up/down → change vertical shift D)

---

## 6. Property Editing (NEW)

When shape(s) are selected, a floating property panel appears:

| Property | Control |
|----------|---------|
| Stroke color | 6-color palette |
| Stroke width | Thin / Medium / Thick |
| Stroke style | Solid / Dashed |
| Fill (for closed shapes) | None / Transparent / Solid |
| Delete | 🗑️ button |

This applies to both freehand strokes and parametric shapes.

---

## 7. UI / UX Principles

| Principle | Description |
|-----------|-------------|
| **iPad-first** | All interactions optimized for Apple Pencil + finger gestures |
| **Pencil draws, finger pans** | When Apple Pencil is detected: pencil = draw, finger = pan/zoom. Fallback: touch = draw |
| **Minimal chrome** | Toolbar collapses to icons on small screens |
| **Shape palette as drawer** | Shapes panel slides in from side, doesn't clutter main toolbar |
| **Anchors are big** | Min 44px touch targets, visible on iPad at arm's length |
| **No modal dialogs** | All editing is inline / floating panels |
| **Draw-then-choose popup** | Non-intrusive, auto-dismiss, positioned near stroke end |
| **Live preview** | Dragging anchors updates shape in real-time, no "apply" button |

---

## 8. Platform / Scope

| Platform | Priority |
|----------|----------|
| iPad Safari + Apple Pencil | **Primary** |
| Desktop Chrome/Firefox/Edge (mouse/trackpad) | Supported |
| Android tablets | Supported (touch) |
| Mobile phones | Basic (view-only stretch goal) |

---

## 9. Explicit Non-Goals

| Feature | Status | Reason |
|---------|--------|--------|
| Auto-snap to existing points | ❌ | Over-complex; anchors let users position manually |
| Collaboration / multiplayer | ❌ | Teacher-only tool, not student collaboration |
| LaTeX rendering | ❌ | Out of scope for v2 |
| Text tool with math symbols | ❌ | Future, not v2 |
| Multiple pages / slides | ❌ | Infinite canvas replaces this |
| Save/load to cloud | ❌ | localStorage only for now |
| React/framework dependency | ❌ | Pure JS, no build step |
| tldraw / Excalidraw integration | ❌ | React required, commercial license (tldraw), overkill |
| Sensitivity slider | ❌ REMOVED | Replaced by explicit "draw then choose" popup |
| Auto-convert without user confirmation | ❌ REMOVED | Source of frustration |
| 3D shapes | ❌ | Future tier 3 |
| Pressure sensitivity | ❌ | Nice-to-have, not MVP |

---

## Implementation Phases

See [plan.md](plan.md) for detailed technical implementation plan.
