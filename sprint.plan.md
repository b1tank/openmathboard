# Sprint — Property Panel & Shape Palette Robustness

## Bugs (must fix)

- [ ] **B1 — Button hover bleeds outside panel border-radius.** The leftmost "thin" button and rightmost "dashed" button hover backgrounds extend past the panel's rounded corners. Root cause: `.property-panel` has `border-radius: 10px` but no `overflow: hidden`. The `.prop-widths` row has no internal padding/margin to keep buttons away from edges.
- [ ] **B2 — Panel width can't contain 5 buttons + divider.** 5 × 32px + 1px divider + 2×4px margin + 4×2px gap = 177px, but panel `min-width` is 160px and `width` is set to 170px in JS. The buttons have `flex-shrink: 0` so they overflow instead of fitting. Fix: size the panel to its content, or make buttons shrinkable.
- [ ] **B3 — Color active ring `box-shadow` overflows panel.** When a color is active, `box-shadow: 0 0 0 3.5px #374151` extends 3.5px outward, bleeding past panel edges if the button is near the edge. Need inset space or clip.

## UX Improvements

- [ ] **U1 — Highlight current stroke state in panel.** When object is selected, the panel should show which color/width/dash is currently active on that object (highlighted button). Currently no indication.
- [ ] **U2 — Panel should auto-dismiss on tap-away.** Clicking elsewhere on canvas should deselect → hide panel. Currently works via clearSelection(), but verify it's bulletproof.
- [ ] **U3 — Panel z-index vs shape palette conflict.** If shape palette (z:90) and property panel (z:200) are both open, they could overlap. Property panel should always be on top — OK currently. But if panel is positioned where palette is, they visually clash.
- [ ] **U4 — Panel animation.** Abrupt show/hide is jarring. Add a subtle 120ms fade-in/scale transition.

## Mobile / Responsive

- [ ] **M1 — Panel too wide for narrow viewport.** On a 320px phone, panel is 170px ≈ 53% of screen. On 375px (iPhone SE), it's 45%. Acceptable but tight. Consider shrinking buttons to 28px on <400px screens.
- [ ] **M2 — Shape palette 200px fixed width is half the screen on 375px phones.** Needs responsive width or bottom-sheet layout on narrow screens.
- [ ] **M3 — Panel position logic doesn't account for shape palette.** If palette is open (200px on right), the "right of selection" strategy should subtract palette width from available viewport, or the panel appears behind it.
- [ ] **M4 — Touch target sizes.** Spec says 44px minimum for iPad. Current buttons are 32×26px (width/dash) and 22×22px (colors). Need to verify these are large enough for finger taps; at minimum keep 32px hit areas.
- [ ] **M5 — Panel overflows bottom on landscape phone.** Panel height (~120px) + toolbar (48px) = 168px. On a landscape phone with 360px height, the shape selection box at center (180px from top) would push panel off-screen bottom. The BELOW fallback should work but verify.

## Edge Cases

- [ ] **E1 — Multi-select with mixed properties.** When multiple objects are selected with different colors/widths, the panel should show no active state (or "mixed" indicator) rather than an arbitrary one.
- [ ] **E2 — Very large shapes.** A circle with r=500 on a zoomed-out canvas: selection box spans the entire viewport. Panel has nowhere to go that doesn't overlap. Should fall back to a fixed corner position.
- [ ] **E3 — Very small shapes.** A tiny circle (r=5): selection box is a few pixels. Panel should still position sensibly next to it, not on top.
- [ ] **E4 — Panel should stay within viewport during rapid zoom.** If user zooms while panel is visible, panel position should update (it doesn't currently — only updates on selection/drag).

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
