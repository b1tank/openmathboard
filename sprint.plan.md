# Sprint — Axes Enhancements, Icons, Source Organization

## Tasks

- [ ] **T1 — Organize src into `src/` directory.** Move all JS modules into `src/` (app.js, state.js, camera.js, etc.). Move shapes into `src/shapes/`. Keep index.html, style.css, shapes.css, assets at root. Update all import paths. Follow standard OSS convention (vite/parcel-style flat `src/`).
- [ ] **T2 — Axes: 4-directional anchors.** Current axes only has xEnd (+x) and yEnd (-y). Add xNeg (-x) and yNeg (+y) anchors. Store as `xPosLen, xNegLen, yPosLen, yNegLen` instead of symmetric `xLen, yLen`. Each arm independently stretchable.
- [ ] **T3 — Axes: tick toggle.** Add `showTicks: true` property to axes shape. Toggle via double-click or property panel checkbox. Render ticks only when enabled.
- [ ] **T4 — Axes: 1-D number line.** New shape type `numberline` — horizontal axis only with ticks + arrowheads on both ends. Anchors: center (move), left-end, right-end.
- [ ] **T5 — Axes: 3-D axes.** New shape type `axes3d` — isometric 3-axis (x right, y up, z out-of-screen at 30° angle). Anchors: origin + 3 axis-end handles. Wireframe projection only.
- [ ] **T6 — Simplify toolbar Shapes icon SVG.** Current icon is cluttered (small circle + square + rectangle + scattered stars). Replace with a cleaner minimal icon — just a simple geometric shape hint.
- [ ] **T7 — Clean up palette shape icons.** The cosine icon `V\` shape is confusing. Fix cosine to show actual cos curve starting from peak. Simplify axes icon.

## Removed from previous sprint (not valid / already working)

- ~~U2~~ Panel auto-dismiss on tap-away — already works via clearSelection()
- ~~U3~~ z-index conflict — property panel (200) > palette (90), no issue
- ~~M4~~ Touch target sizes — 30×26px acceptable for secondary controls
- ~~M5~~ Panel bottom overflow — BELOW fallback + clamp handles it
- ~~E3~~ Very small shapes — works correctly, panel positions beside tiny box
- ~~E4~~ Panel during zoom — low priority, deferred indefinitely

## Hiccups & Notes

_(logged as encountered)_
