<p align="center">
  <img src="logo.svg" alt="OpenMathBoard" width="80" height="80">
</p>

<h1 align="center">OpenMathBoard 乐之数学画板</h1>

<p align="center">
  <strong>An open-source math sketching whiteboard with intent-based geometry.</strong><br>
  为数学老师设计的智能几何白板。<br>
  Draw freely, get smart shapes. Optimized for iPad + Apple Pencil.
</p>

---

## 🎯 Why OpenMathBoard?

**No open-source tool combines all of these:**

| Capability | GeoGebra | Excalidraw | Inkscape | OMB |
|------------|----------|------------|----------|-----|
| Freehand-first UX | ❌ | ✅ | ❌ | ✅ |
| Math-aware parametric shapes | ✅ | ❌ | ❌ | ✅ |
| Elegant snapping (not aggressive) | ❌ | ❌ | ✅ | ✅ |
| Lightweight, hackable | ❌ | ✅ | ❌ | ✅ |

> *Geometry-native sketching optimized for human intent.*

## ✨ Features (Implemented)

- **Smart shape suggestions** — Lines, circles, and parabolas are detected after drawing for explicit conversion
- **Select tool** — Click or drag-rectangle to select, move, copy/paste, delete strokes
- **Infinite canvas** — Zoom, pan, pinch gestures, and camera-aware rendering
- **Parametric anchors** — Move, resize, rotate, and tune math-specific geometry
- **Freehand drawing** — Smooth stroke stabilization with quadratic curves
- **6 colors** — Black, blue, red, green, purple, orange
- **3 stroke widths** — Thin (2px), medium (4px), thick (8px)
- **Eraser** — Tap to remove entire strokes
- **Undo/redo** — Snapshot history for strokes and parametric shapes
- **Image import** — Drag & drop, paste, tap-to-select, reposition, and four-corner resize
- **Course recording** — Visible-board video with microphone, optional face camera, pause/resume, discard, and local download
- **Export** — Copy to clipboard (PNG) or save to file
- **Keyboard shortcuts** — P=pen, E=eraser, S=select, Ctrl+Z/Y/S
- **i18n** — English / 中文
- **Mobile responsive** — Hamburger menu on narrow screens

## 🚀 Roadmap

The editor foundation and browser-local course recording are implemented. The active roadmap now prioritizes production trust and complete teacher workflows:

1. **Release safety** — dependency upgrades, CI test gates, WebKit coverage, frontend telemetry
2. **Data safety** — unified scene objects, IndexedDB, save lifecycle, bounded history, recovery
3. **Lesson creation** — text/math notation, PDF annotation, pages, templates, correct SVG/PDF export
4. **Cloud product** — managed authentication, multi-board dashboard, offline/cloud sync
5. **Classroom sharing** — read-only links, QR codes, student viewer, follow-teacher mode
6. **School readiness** — accessibility, legal/DPA, LMS integrations, admin and operations

See [v3-spec.md](v3-spec.md) for target requirements and [plan.md](plan.md#production-readiness-plan-active) for the active AI-assisted execution backlog and effort estimates.

## 🎯 Design Philosophy

> *Assume the user is right, even when their hand is wrong.*

**Everything is math objects**, not Bézier paths. A parabola has vertex, axis, curvature—not control points.

## 🔒 Privacy

The current editor and recorder run entirely in your browser. Boards, camera, microphone, and recordings are not uploaded by the current implementation; recordings are downloaded locally. Cloud sync and sharing are planned features and will require explicit privacy, retention, and account controls before launch.

## 📝 Notes

- Optimized for iPad Safari + Apple Pencil
- Works on desktop with mouse/trackpad
- Inspired by GeoGebra (math), Excalidraw (UX), Procreate (gesture feel)

---

## 🚀 Deploy to Cloudflare

OpenMathBoard is a static Vite application deployed to Cloudflare Workers Static Assets.

```bash
npm ci
npm test
npm run deploy:cloudflare
```

Production deployments run automatically from `main` through GitHub Actions. Configure these repository settings:

- Secret: `CLOUDFLARE_API_TOKEN`
- Variable: `CLOUDFLARE_ACCOUNT_ID`

The Worker configuration in `wrangler.jsonc` owns the `lezhi.school` custom domain, SPA fallback, and static asset delivery. Static requests do not require an always-running server or container registry.

Verify a deployment with:

```bash
curl -fsS https://lezhi.school/health
```

Cloudflare Workers logs and zone analytics provide operational visibility.

## License

MIT
