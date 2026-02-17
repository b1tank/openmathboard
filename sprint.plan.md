# Sprint — Axes Enhancements, Icons, Source Organization

## Tasks

- [x] **T1 — Organize src into `src/` directory.** All JS modules moved to `src/`. Standard OSS layout.
- [x] **T2 — Axes: 4-directional anchors.** xPosLen, xNegLen, yPosLen, yNegLen — each arm independently stretchable.
- [x] **T3 — Axes: tick toggle.** showTicks property, rendered only when true.
- [x] **T4 — Axes: 1-D number line.** New `numberline` shape with ticks, origin mark, dual arrowheads.
- [x] **T5 — Axes: 3-D axes.** New `axes3d` shape — isometric projection with x/y/z labels.
- [x] **T6 — Simplify toolbar Shapes icon.** Triangle + circle (clean, minimal).
- [x] **T7 — Fix palette icons.** Cosine shows proper cos-wave, axes icon cleaner.

## Hiccups & Notes

- axes3d z-axis anchor drag uses projection math to maintain isometric angle
- numberline has an enlarged origin tick to visually mark the zero point
- Old axes shapes with xLen/yLen are backward-compatible via fallback defaults
