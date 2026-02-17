# Sprint — Selection, Anchors & Rotation Overhaul

## Goal
Make selection, moving, anchoring, and rotation work seamlessly for all shapes.

## Tasks

- [x] **T1 — Selection boundary dashed rectangle + move anywhere inside**
  Polish dashed boundary. Allow drag-move by clicking anywhere inside the bounding box (not just on the stroke).

- [x] **T2 — H/V stretch anchors for all shapes**
  Add 4 edge-midpoint general stretch anchors (N, S, E, W) on bounding box for every shape. Dragging scales the shape horizontally or vertically.

- [x] **T3 — Rotation anchor outside boundary**
  Rotation icon anchor above top-center, connected by thin line. Dragging rotates shape around its center.

- [x] **T4 — Parabola special anchors**
  Left end, right end, vertex. Drag vertex changes curve with ends fixed; parabola flips between peak/valley when vertex crosses the line between endpoints.

- [x] **T5 — Audit all shapes for anchor completeness**
  Verified: line, arrow, circle, ellipse, sine/cosine, axes, numberline, axes3d all have correct special anchors. Freehand gets general anchors only.

- [x] **T6 — Build check & push**

## Hiccups & Notes

- Parabola vertex drag required storing endpoint y-values at drag start (in dragInfo) since the shape params change incrementally during drag
- getStrokeBounds already had freehand fallback so general anchors worked for all strokes without additional code
- Rotation stored as shape.rotation and applied via ctx.rotate transform in renderer
- Stretch anchors use green (#16a34a) and rotation uses orange (#ea580c) for visual hierarchy against blue special anchors
