# Sprint — Property Panel & Shape Palette Robustness

## Bugs (must fix)

- [x] **B1 — Button hover bleeds outside panel border-radius.** Fixed: `overflow: hidden` on `.property-panel`.
- [x] **B2 — Panel width can't contain 5 buttons + divider.** Fixed: removed fixed `width`/`min-width`, panel auto-sizes to content. Buttons reduced to 30px.
- [x] **B3 — Color active ring `box-shadow` overflows panel.** Fixed: 4px inset padding on `.prop-colors` row.

## UX Improvements

- [x] **U1 — Highlight current stroke state in panel.** Panel now shows active color/width/dash of selected object(s). Mixed-select shows no highlight.
- [ ] **U2 — Panel should auto-dismiss on tap-away.** Already works via clearSelection().
- [ ] **U3 — Panel z-index vs shape palette conflict.** Property panel z:200 > palette z:90, OK.
- [x] **U4 — Panel animation.** 120ms fade-in + scale(0.95→1) transition.

## Mobile / Responsive

- [x] **M1 — Panel too wide for narrow viewport.** Buttons shrink to 26px on <400px screens.
- [x] **M2 — Shape palette bottom-sheet on mobile.** Full-width bottom sheet with 4-column grid on ≤600px.
- [x] **M3 — Panel position logic accounts for palette.** Subtracts palette width when open.
- [ ] **M4 — Touch target sizes.** 30×26px buttons are acceptable (44px spec is for primary actions).
- [ ] **M5 — Panel overflows bottom on landscape phone.** BELOW fallback + clamp handles this.

## Edge Cases

- [x] **E1 — Multi-select with mixed properties.** No active state shown when objects have different values.
- [x] **E2 — Very large shapes.** Falls back to top-right corner when shape covers >80% viewport.
- [ ] **E3 — Very small shapes.** Works — panel positions adjacent to tiny bounding box.
- [ ] **E4 — Panel position during zoom.** Would need zoom event listener — deferred.

## Implementation Priority

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B1 | overflow: hidden + internal padding | S | P0 |
| B2 | Auto-size panel or shrink buttons | S | P0 |
| B3 | Inset color rings | XS | P0 |
| U1 | Show current state highlights | M | P1 |
| U4 | Fade-in transition | XS | P1 |
| M1 | Responsive button sizes | S | P1 |
| M3 | Account for palette in positioning | S | P1 |
| M2 | Bottom-sheet palette on mobile | M | P2 |
| E1 | Mixed-select indicator | S | P2 |
| E2 | Large-shape fallback position | S | P2 |

## Hiccups & Notes

_(logged as encountered)_
