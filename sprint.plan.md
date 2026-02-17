# Sprint — Anchor Interaction, Property Panel UX, Sine/Cosine Enhancements

## Tasks (prioritized)

- [ ] **T1** Wire anchor drag into input.js SELECT mode — check anchors before stroke body; add isDraggingAnchor state; dispatch onAnchorDrag on move; save history on release
- [ ] **T2** Redesign property panel positioning — place to the right of selection bounding box (not on top); update position on shape move/anchor drag; ensure panel never overlaps shape
- [ ] **T3** Fix moveSelectedStrokes to move ALL shape types generically (currently misses ellipse, sine, cosine, arrow, axes)
- [ ] **T4** Enhance sine/cosine anchors — add period-control anchor (xScale), amplitude handle (peak drag), vertical B-frequency tuning. Allow multiple periods by dragging left/right edges further
- [ ] **T5** Make anchor handles larger (12px) and more visible; increase hit threshold to 28px for touch

## Hiccups & Notes

_(logged as encountered)_
