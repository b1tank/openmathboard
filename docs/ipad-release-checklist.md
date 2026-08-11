# Real iPad Release Smoke Checklist

Run this checklist against the exact production candidate after automated Chromium, Firefox, and WebKit tests pass.

## Test record

- Release SHA:
- URL:
- Date/tester:
- iPad model:
- iPadOS version:
- Safari version (same as iPadOS):
- Apple Pencil model:
- Orientation(s): portrait / landscape
- Display mode: full screen / split screen
- Network: Wi-Fi / offline transition

Record failures with a screenshot or screen recording, exact step, and whether a refresh reproduces it.

## 1. Launch and lifecycle

- [ ] Open from a fresh Safari tab; app shell is interactive in under 2 seconds on normal Wi-Fi.
- [ ] Reload; saved strokes and camera position return.
- [ ] Draw one final stroke, immediately switch apps for 10 seconds, return; the stroke remains.
- [ ] Draw one final stroke, immediately close the tab, reopen the URL; the stroke remains.
- [ ] Rotate portrait → landscape → portrait; canvas and panels remain usable and no content moves unexpectedly.
- [ ] Use 50/50 and narrow split-screen; toolbar does not overflow and bottom sheets remain dismissible.

## 2. Apple Pencil and touch routing

- [ ] Pencil draws a continuous line with no visible gaps or delayed first segment.
- [ ] Ten rapid short Pencil strokes all commit.
- [ ] Pencil stroke can start over existing ink and continue drawing.
- [ ] Pencil tap on an existing stroke switches to Select without creating a dot.
- [ ] Two-finger pinch zooms and pans without adding ink.
- [ ] A second finger during Pencil drawing cancels safely without a stuck stroke.
- [ ] Palm/finger contact does not create unintended ink after Pencil use.

## 3. Selection, anchors, images, and history

- [ ] Select, move, resize, and rotate a line, circle, ellipse, rectangle, parabola, and sine wave.
- [ ] Rotated anchors remain under the Pencil and move in the expected direction.
- [ ] Import a photo; Pencil tap selects it and shows four corner handles.
- [ ] Resize from all four image corners and move the image.
- [ ] Switch to Pen and annotate over the image.
- [ ] Undo and redo immediately after drawing, erasing, moving, and anchor editing.
- [ ] Redo remains available after Undo until a genuinely new edit is made.

## 4. Mobile panels and toolbar

- [ ] Pen style, shape picker, recording panel, and More menu never overlap.
- [ ] Pull the shape and recording sheet handles down; both dismiss and reopen at rest.
- [ ] All controls are comfortably tappable and visible above Safari browser chrome.
- [ ] Switch English ↔ Chinese from the single language toggle; labels update without reload.

## 5. Camera, microphone, and recording

Use production HTTPS—not a plain LAN HTTP URL.

- [ ] Turn Face camera on; permission appears and preview opens directly in the selected corner without flashing top-left.
- [ ] Bottom-corner preview stays above the open recording panel.
- [ ] Toggle Live preview off; preview hides but face remains in the final recording.
- [ ] Start with microphone + face camera; panel closes and timer appears in the toolbar.
- [ ] Draw, move the face window, pause, wait 5 seconds, resume, and continue.
- [ ] Timer excludes paused time and panel closes on resume.
- [ ] Mute/unmute microphone during recording.
- [ ] Stop and save; MP4 preview/download contains board, active ink, face, and synchronized audio.
- [ ] Start another recording and discard it; confirmation appears and no new download is created.
- [ ] While recording, attempt reload/navigation; Safari warns before leaving.
- [ ] Background Safari for 10 seconds during a test recording; document exact behavior and verify the app reports interruption rather than silently producing a bad file.

## 6. Export and download

- [ ] PNG export includes visible imported images and current camera viewport.
- [ ] PNG export preserves dash, fill, and rotation for representative shapes.
- [ ] Video download opens in Safari/Files and has the expected duration and audio.
- [ ] Clipboard/share fallback works when direct clipboard write is unavailable.

## Release decision

- [ ] No P0 data-loss, crash, permission, or unusable-input failure.
- [ ] Any P1 failure has an owner, documented workaround, and explicit release acceptance.
- [ ] Test evidence is linked from the release/deployment record.

A failed data-lifecycle, Pencil-routing, or recording-integrity check blocks release.
