# OpenMathBoard v3 — Product Spec

## One-Line Definition

> **A math-first infinite canvas whiteboard with cloud sync, auth, and shareable read-only links — so teachers draw parametric shapes on iPad, save to the cloud, and share live boards with students.**

---

## Document Status

This specification describes the **target v3 product**, not only shipped functionality. Status labels are authoritative:

| Status | Meaning |
|--------|---------|
| ✅ Implemented | Present in the current production code |
| 🟡 Partial | Working foundation or prototype; not production-complete |
| 📋 Planned | Approved target requirement, not yet implemented |
| ❌ Deferred | Explicitly outside the current delivery phase |

### Current production baseline

Implemented today: infinite canvas drawing, parametric math shapes and anchors, selection, imported-image positioning/resizing, PNG export, browser-local persistence for strokes, English/Chinese UI, and local course recording with microphone plus optional face camera.

Known production blockers: images are still DOM-managed rather than persisted scene objects; storage is a single localStorage board; export is incomplete for several transformed shape types; long recordings are memory-bound; and cloud boards, text/math notation, PDF workflows, pages, sharing, student view, PWA/offline data, and institutional controls are planned rather than shipped.

## Top Principles

1. **Math objects, not pixels** — A parabola is `{vertex, a, direction}` with draggable handles. This is our moat.
2. **Teacher speed** — Every interaction < 200ms. Cloud sync is invisible (auto-save, no "save" button).
3. **Sign in and go** — One-click Microsoft/Google login. Boards auto-sync. Open any device, resume where you left off.
4. **Share, don't collaborate (MVP)** — Teachers share read-only links with students. Real-time co-editing is Phase 2+.
5. **OSS core, SaaS shell** — Core editor stays MIT. Cloud/auth layer is the product. Excalidraw model.
6. **Azure-native** — Already on Container Apps. Extend with Entra External ID, Blob Storage, Cosmos DB, SignalR.

---

## 1. Authentication & Identity

| Feature | Support | Details |
|---------|---------|---------|
| Email + password login | 📋 Planned | Microsoft Entra External ID custom policy |
| Microsoft account login | 📋 Planned | Microsoft Entra External ID built-in provider |
| Google account login | 📋 Planned | Microsoft Entra External ID social identity provider |
| Apple ID login | ❌ Phase 2 | Add when iOS app is considered |
| Anonymous / guest mode | ✅ Implemented | Current behavior — localStorage only, no cloud |
| Session management | 📋 Planned | JWT tokens, 30-day refresh, secure httpOnly cookies |
| Profile (name, avatar) | 📋 Planned | Pulled from identity provider, editable |

**Implementation:** Microsoft Entra External ID handles all OAuth flows. Frontend gets a JWT, passes it as `Authorization: Bearer <token>` to the API. No password storage on our side.

---

## 2. Board Management & Cloud Storage

| Feature | Support | Details |
|---------|---------|---------|
| Auto-save to cloud | 📋 Planned | Debounced (2s), full board state → Azure Blob Storage |
| Board list (dashboard) | 📋 Planned | Grid/list view, thumbnail, last-modified date, title |
| Create new board | 📋 Planned | Blank, or from template |
| Rename board | 📋 Planned | Inline edit on dashboard |
| Delete board | 📋 Planned | Soft delete → 30-day trash → permanent |
| Duplicate board | 📋 Planned | Deep copy of board state |
| Folders / organization | ❌ Phase 2 | Flat list for MVP |
| Search boards | ❌ Phase 2 | Title search |
| Board thumbnails | 📋 Planned | Auto-generated canvas snapshot on save |

### Board Data Model

```
Board {
  id: UUID
  userId: string          // owner
  title: string           // user-editable, default "Untitled Board"
  createdAt: ISO8601
  updatedAt: ISO8601
  thumbnailUrl: string    // Azure Blob URL to PNG thumbnail
  dataUrl: string         // Azure Blob URL to .openmathboard JSON
  isDeleted: boolean      // soft delete flag
  shareToken: string?     // nullable, generated on first share
}
```

**Storage architecture:**
- **Metadata** → Azure Cosmos DB (board title, timestamps, userId, shareToken)
- **Board data** → Azure Blob Storage (the full `.openmathboard` JSON file, gzipped)
- **Thumbnails** → Azure Blob Storage (256×192 PNG, auto-generated client-side)

### Sync Strategy

```
┌──────────────┐     save (debounced 2s)     ┌────────────┐
│  Client JS   │ ──────────────────────────→  │  REST API  │
│  (IndexedDB  │                              │ (Container  │
│   + memory)  │ ←────────────────────────── │    App)     │
└──────────────┘    load on auth / page open  └────────────┘
                                                   │
                                          ┌────────┴────────┐
                                          │  Cosmos DB      │  ← metadata
                                          │  Blob Storage   │  ← board data
                                          └─────────────────┘
```

- **Offline-first:** IndexedDB is the local cache. Writes go to IndexedDB immediately, then sync to cloud.
- **Conflict resolution:** Last-write-wins (single-user boards). No CRDT needed for MVP.
- **Auth required for cloud:** Guest users stay localStorage-only. On first login, offer to migrate local boards to cloud.

---

## 3. File Format (.openmathboard)

| Feature | Support | Details |
|---------|---------|---------|
| Save to file | 📋 Planned | Download `.openmathboard` JSON file |
| Load from file | 📋 Planned | Open `.openmathboard` file → populate canvas |
| File format is JSON | 📋 Planned | Human-readable, versionable, diffable |
| Schema version in file | 📋 Planned | `{ version: 3, ... }` — migration on load |
| Export PNG | ✅ Implemented | Current behavior, keep |
| Export SVG | 📋 Planned | Vector export with math shapes as SVG paths |
| Copy canvas to clipboard | ✅ Implemented | Current behavior, keep |

### File Schema (v3)

```json
{
  "version": 3,
  "title": "Quadratic Functions Lesson",
  "createdAt": "2026-02-17T10:00:00Z",
  "updatedAt": "2026-02-17T10:30:00Z",
  "camera": { "x": 0, "y": 0, "zoom": 1 },
  "objects": [
    {
      "id": "abc-123",
      "type": "parabola",
      "h": 200, "k": 300, "a": 0.01,
      "xMin": 50, "xMax": 350,
      "color": "#e63946", "width": 4, "dash": false, "fill": "none"
    },
    {
      "id": "def-456",
      "type": "freehand",
      "points": [{"x": 100, "y": 200}, ...],
      "color": "#000000", "width": 3, "dash": false
    }
  ]
}
```

---

## 4. Shareable Links

| Feature | Support | Details |
|---------|---------|---------|
| Generate share link | 📋 Planned | One-click button → copy URL to clipboard |
| Read-only view | 📋 Planned | Viewers see the board, can pan/zoom, cannot edit |
| No login required to view | 📋 Planned | Share token in URL grants read access |
| View shows live updates | 📋 Planned | Via polling (5s) initially; WebSocket later |
| Collaborative edit link | ❌ Phase 2 | Future: real-time co-editing |
| Embed via iframe | ❌ Phase 2 | `<iframe src="openmathboard.com/embed/TOKEN">` |
| QR code for share link | 📋 Planned | Teacher projects QR, students scan with phone |
| Link expiration | ❌ Phase 2 | Links are permanent for MVP |

**URL format:** `https://openmathboard.com/board/<shareToken>`

**Implementation:**
- When teacher clicks "Share," generate a `shareToken` (nanoid, 12 chars) stored in Cosmos DB.
- Share URL resolves to a read-only viewer (same canvas renderer, edit tools hidden).
- Live updates: client polls `/api/boards/:shareToken/data` every 5 seconds. Server returns `304 Not Modified` if unchanged (via ETag). Upgrade to Azure SignalR for push in Phase 2.

---

## 5. Student View Mode (Education Feature)

| Feature | Support | Details |
|---------|---------|---------|
| Read-only live mirror | 📋 Planned | Students see teacher drawing updated in near-real-time |
| No login for students | 📋 Planned | Access via share link |
| Pan & zoom independently | 📋 Planned | Students navigate the canvas independently of teacher |
| "Follow teacher" button | 📋 Planned | Toggle: lock student camera to teacher's viewport |
| See teacher's cursor | ❌ Phase 2 | Show teacher cursor position to students |
| Student can annotate own copy | ❌ Phase 2 | Fork board for personal notes |

**Implementation:**
- Teacher publishes board + camera position to cloud every 2 seconds.
- Student view fetches state via polling (or SignalR push later).
- "Follow teacher" syncs student camera to teacher's last camera state.
- Minimal extra infra: same share link, same Blob data, just add `camera` to the polling response.

---

## 6. Text Tool (Missing Core Feature)

| Feature | Support | Details |
|---------|---------|---------|
| Place text on canvas | 📋 Planned | Click to create text box, type, click away to commit |
| Math symbols (basic) | 📋 Planned | ±, ², ³, √, π, θ, ∞, ≤, ≥, ≠ via emoji-style picker |
| Font sizes | 📋 Planned | Small / Medium / Large |
| Text color | 📋 Planned | Uses existing 6-color palette |
| Move / resize text | 📋 Planned | Select tool, drag to move, handles to resize |
| Edit existing text | 📋 Planned | Double-click to re-enter edit mode |
| LaTeX rendering | 📋 Planned | Render `$y = ax^2 + bx + c$` as proper math typography |

**Why now:** Every competitor has text. Teachers need to write problem statements, label axes, annotate shapes. This is the #1 missing feature for "good-shape product" status.

---

## 7. Board Templates

| Feature | Support | Details |
|---------|---------|---------|
| Blank canvas | 📋 Planned | Default, as today |
| Coordinate plane | 📋 Planned | Pre-placed axes object centered, grid on |
| Graph paper (4-quadrant) | 📋 Planned | Grid on, axes visible, pre-set zoom for typical graphing |
| Number line | 📋 Planned | Pre-placed number line, centered horizontally |
| Dot paper (isometric) | ❌ Phase 2 | For 3D geometry lessons |
| Custom template (save current as template) | ❌ Phase 2 | |

**Implementation:** Templates are just pre-defined `.openmathboard` JSON objects. On "New board → from template," load the JSON into state. No backend changes needed.

---

## 8. Dark Mode

| Feature | Support | Details |
|---------|---------|---------|
| Dark theme | 📋 Planned | Dark background, light strokes, themed UI |
| System preference detection | 📋 Planned | `prefers-color-scheme` media query |
| Manual toggle | 📋 Planned | Button in toolbar |
| Adapts canvas background | 📋 Planned | White → dark gray; grid color adjusts |
| Stroke colors remain vibrant | 📋 Planned | Color palette adjusted for dark backgrounds |

---

## 9. PWA & Offline

| Feature | Support | Details |
|---------|---------|---------|
| Service worker | 📋 Planned | Cache app shell for offline use |
| Installable (Add to Home Screen) | 📋 Planned | PWA manifest with icons |
| Offline drawing | 📋 Planned | Uses IndexedDB, syncs when online |
| Offline indicator | 📋 Planned | Banner: "You're offline. Changes will sync when connected." |

---

## 10. Additional Core Improvements

| Feature | Support | Details |
|---------|---------|---------|
| Rectangle tool | ✅ Implemented | Basic shape, 4 corner anchors |
| Triangle tool | ✅ Implemented | 3 vertex anchors |
| Snap to grid | 📋 Planned | Hold Shift while dragging → snap anchor to grid points |
| Keyboard shortcut overlay | 📋 Planned | Press `?` → show all shortcuts |
| SVG export | 📋 Planned | Vector format, great for printing math worksheets |
| Undo/redo visual indicator | 📋 Planned | Ghost count on undo/redo buttons |

---

## UI / UX Principles (v3 additions)

| Principle | Description |
|-----------|-------------|
| **Cloud is invisible** | No "save" button. Boards auto-save. Status indicator: ✓ Saved / ☁ Syncing / ⚠ Offline |
| **Auth is optional** | Guest mode works fully (localStorage). Login unlocks cloud + sharing. No gate. |
| **Dashboard is simple** | Grid of board cards with thumbnails. No folders for MVP. Search later. |
| **Share is one button** | Click Share → link copied → toast "Link copied! Students can view at this URL" + QR code |
| **Student view is stripped** | No toolbar, no tools. Just the canvas + pan/zoom + "Follow teacher" toggle |

---

## Platform / Scope (v3)

| Platform | Priority |
|----------|----------|
| iPad Safari + Apple Pencil | **Primary** |
| Desktop Chrome/Firefox/Edge | **Primary** (dashboard + editor) |
| Android tablets | Supported |
| Mobile phones | View-only (student view works, editor is desktop/tablet) |
| PWA (installable) | 📋 Planned |

---

## Tech Architecture (v3)

### Frontend (same repo, new directories)

```
src/
  core/          — existing: state, history, persistence (extend for cloud sync)
  canvas/        — existing: camera, grid, renderer, anchors
  shapes/        — existing: all shape modules
  interaction/   — existing: input, detection, selection, tools
  ui/            — existing: toolbar, palette, export, etc.
  i18n/          — existing: i18n engine + strings
  NEW: auth/
    auth.js      — Microsoft Entra External ID login/logout, token management
    session.js   — JWT handling, refresh, session state
  NEW: cloud/
    api.js       — REST API client (boards CRUD, sync)
    sync.js      — Auto-save + load orchestration, conflict resolution
    indexeddb.js  — Local cache for offline support
  NEW: dashboard/
    dashboard.js — Board list/grid UI, create/delete/rename
    templates.js — Template definitions and selection UI
    share.js     — Share link generation, QR code, copy-to-clipboard
  NEW: viewer/
    viewer.js    — Read-only board viewer (student view)
    follow.js    — "Follow teacher" camera sync logic
  NEW: text/
    text.js      — Text tool: create, edit, render text objects
    symbols.js   — Math symbol picker
```

### Backend API (new: api/ directory or separate repo)

```
api/
  server.js          — Express.js or Azure Functions entry
  routes/
    auth.js          — Token validation middleware
    boards.js        — GET/POST/PUT/DELETE /api/boards
    share.js         — GET /api/boards/:shareToken (public, no auth)
  services/
    cosmos.js        — Cosmos DB client (board metadata)
    blob.js          — Azure Blob Storage client (board data + thumbnails)
  middleware/
    auth.js          — Validate Microsoft Entra External ID JWT
    cors.js          — CORS config
```

### Azure Resources (extend existing infra/)

| Resource | Purpose | New? |
|----------|---------|------|
| Container App | Serve frontend + API | Existing (extend) |
| Microsoft Entra External ID | User authentication | 📋 Planned |
| Cosmos DB (serverless) | Board metadata | 📋 Planned |
| Azure Blob Storage | Board data + thumbnails | 📋 Planned |
| Azure SignalR Service | Push updates (Phase 2) | ❌ Phase 2 |
| Application Insights | Monitoring | Existing |
| Grafana | Dashboards | Existing |
| Azure CDN | Static asset caching | 📋 Planned (optional) |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/boards` | 📋 Planned | List user's boards (metadata only) |
| `POST` | `/api/boards` | 📋 Planned | Create new board |
| `GET` | `/api/boards/:id` | 📋 Planned | Get board metadata |
| `GET` | `/api/boards/:id/data` | 📋 Planned | Get board data (blob) |
| `PUT` | `/api/boards/:id/data` | 📋 Planned | Save board data (blob) |
| `PUT` | `/api/boards/:id` | 📋 Planned | Update board metadata (title, etc.) |
| `DELETE` | `/api/boards/:id` | 📋 Planned | Soft-delete board |
| `POST` | `/api/boards/:id/share` | 📋 Planned | Generate share token |
| `GET` | `/api/share/:token` | ❌ | Public: get shared board data (read-only) |
| `GET` | `/api/share/:token/camera` | ❌ | Public: get teacher's camera state (for follow mode) |

---

## 11. Course Recording

| Feature | Status | Production requirement |
|---------|--------|------------------------|
| Visible-board video recording | 🟡 Partial | Canvas, imported images, active ink, and math objects render into a clean output stream |
| Microphone audio | 🟡 Partial | Permission handling, mute, track-end detection, and audio-level feedback |
| Face camera overlay | 🟡 Partial | Live preview, size, corner placement, preview privacy toggle, and recorded composition |
| Pause/resume | 🟡 Partial | Timer excludes paused duration; lifecycle tested on real iOS |
| Local MP4/WebM download | 🟡 Partial | MIME negotiation, playback review, retry, and explicit file-size feedback |
| Discard with confirmation | ✅ Implemented | No output generated after confirmed discard |
| Long-session crash recovery | 📋 Planned | Periodic MediaRecorder chunks persisted to IndexedDB |
| Resumable cloud upload | 📋 Planned | Chunk upload, retry, finalization/transcoding, storage quotas, and playback URL |
| Captions/transcript | 📋 Planned | Accessible transcript and optional searchable lesson text |
| Recording library | 📋 Planned | Board association, title, thumbnail, retention, delete, and share controls |

**MVP safety rule:** local browser recording is for short and medium lessons. Do not promise hour-long iOS recording until chunk checkpointing, interruption tests, and storage limits are implemented.

---

## 12. Unified Scene and Data Safety

Every board-visible object must be represented in versioned scene state. DOM-only content is prohibited for production persistence.

```text
SceneObject
  id · type · style · zIndex
  render() · getBounds() · hitTest()
  move() · resize()
  serialize() · deserialize() · export()
```

| Requirement | Status | Acceptance criterion |
|-------------|--------|----------------------|
| Strokes and shapes in scene state | ✅ Implemented | Render, select, persist, and undo/redo |
| Images in scene state | 📋 Planned | Reload, undo/redo, file export, cloud sync, mixed selection |
| Text in scene state | 📋 Planned | Edit, select, serialize, export, and migrate |
| Versioned board schema | 📋 Planned | Forward migration and safe fallback for unsupported versions |
| IndexedDB board storage | 📋 Planned | Transactional board/blob storage and migration from localStorage |
| Save-on-background | 📋 Planned | Flush on visibility/page lifecycle events with visible status |
| Bounded history | 📋 Planned | Memory budget with deterministic undo availability |
| Native board file | 📋 Planned | Round-trip all object types without loss |
| Corruption recovery | 📋 Planned | Last-known-good snapshot and actionable recovery UI |

---

## 13. Production Non-Functional Requirements

| Area | Requirement | Target |
|------|-------------|--------|
| Data integrity | No acknowledged edit lost after save state is shown | 99.99% |
| Crash-free sessions | Client sessions without unhandled fatal error | ≥ 99.5% beta, ≥ 99.9% launch |
| Input latency | Pen-to-pixel latency under normal board load | p95 < 50 ms |
| Save latency | Local durable save after last edit | p95 < 1 s |
| Cloud sync | Successful background sync after retries | ≥ 99.9% |
| Share load | Read-only lesson interactive | p75 < 2 s |
| Accessibility | Product UI | WCAG 2.2 AA |
| Browser matrix | Automated | Chromium, Firefox, WebKit |
| Physical devices | Release smoke | Current iPadOS Safari + Apple Pencil |
| Recording | Short lesson completion | ≥ 99% for supported duration |
| Security | Deployment gate | Tests, audit, image scan, staging smoke, rollback |
| Observability | Client releases | Errors, save failures, recording failures, Web Vitals, release ID |

---

## Explicit Non-Goals (v3)

| Feature | Status | Reason |
|---------|--------|--------|
| Real-time collaboration (multi-editor) | ❌ Phase 2 | Complex (CRDT/OT), not needed for teacher → student flow |
| End-to-end encryption | ❌ | Adds complexity, not required for education use case |
| Voice chat / screensharing | ❌ | Teachers already use Zoom/Meet/Teams for streaming |
| Generative AI (text-to-diagram) | ❌ | Distraction from core math value |
| React wrapper / npm SDK | ❌ Phase 2 | Ship SaaS first, SDK later |
| Desktop app (Electron/Tauri) | ❌ | PWA covers this need |
| iOS/Android native app | ❌ | PWA + Safari is sufficient for iPad |
| Payment integration (Stripe) | ❌ Phase 2 | Free tier is generous enough for launch |
| Admin dashboard (school tier) | ❌ Phase 2 | Focus on individual teacher first |
| Board version history | ❌ Phase 2 | Nice but not MVP |
| Comments / annotations by students | ❌ Phase 2 | One-directional (teacher → student) for MVP |
| Custom shape libraries | ❌ Phase 2 | Pre-built library first |
| Notion/Obsidian integration | ❌ Future | Requires npm package (Phase 2+) |
| Pressure-sensitive strokes | ❌ | Adds complexity to data model, minimal teaching value |

---

## Implementation Phases

Estimates assume one experienced engineer using AI assistance heavily and include implementation, focused tests, review, and deployment. Real-device validation, migrations, cloud correctness, accessibility, and legal review do not compress at the same rate as isolated UI work.

### Phase 5A — Trustworthy Teacher Beta

| Task | Status | AI-assisted effort |
|------|--------|---------------------|
| Upgrade vulnerable dependencies and lockfile | 📋 Planned | 2–4 hours |
| Add build/test/audit/smoke gates before deploy | 📋 Planned | 1–2 days |
| Add WebKit and Firefox CI projects | 📋 Planned | 1–3 days plus exposed fixes |
| Save-on-background and visible save status | 📋 Planned | 1–2 days |
| Bound history memory | 📋 Planned | 0.5–1 day |
| Frontend error/release telemetry | 📋 Planned | 1–2 days |
| Unify images into scene state | 📋 Planned | 5–10 days |
| Versioned scene schema and validation | 📋 Planned | 5–10 days |
| IndexedDB storage and localStorage migration | 📋 Planned | 4–8 days |
| Corruption recovery and last-known-good state | 📋 Planned | 4–7 days |
| Correct all-shape export via central renderer | 📋 Planned | 1–3 days |
| `.openmathboard` save/load | 📋 Planned | 3–5 days |

**Exit gate:** 100 repeated background/reload tests without content loss; 30-minute iPad sessions remain responsive; exported output matches the board; crash-free sessions ≥ 99.5%.

### Phase 5B — Complete Lesson Creation

| Task | Status | AI-assisted effort |
|------|--------|---------------------|
| Basic text and math symbols | 📋 Planned | 5–8 days |
| LaTeX/math typesetting | 📋 Planned | 5–10 days |
| PDF import and annotation backgrounds | 📋 Planned | 5–10 days |
| Pages/lesson scenes and navigator | 📋 Planned | 1–2 weeks |
| Starter math templates | 📋 Planned | 2–4 days after schema |
| SVG export | 📋 Planned | 4–7 days |
| Multi-page PDF export | 📋 Planned | 4–8 days after pages |
| PWA shell and update UX | 📋 Planned | 2–4 days |
| Recording duration/size/interruption hardening | 📋 Planned | 3–6 days |
| Recording chunk checkpointing to IndexedDB | 📋 Planned | 5–10 days |
| First-run onboarding and shortcut help | 📋 Planned | 2–4 days |

**Exit gate:** new teacher creates a useful lesson in under five minutes; pilot teachers complete real lessons without help; week-4 pilot retention ≥ 30%.

### Phase 6 — Identity, Boards, and Cloud Sync

| Task | Status | AI-assisted effort |
|------|--------|---------------------|
| Microsoft Entra External ID configuration | 📋 Planned | 5–10 days |
| Board metadata/blob API with ETags | 📋 Planned | 2–3 weeks |
| Offline queue, retries, and conflict handling | 📋 Planned | 1–2 weeks |
| Dashboard, thumbnails, rename/duplicate/trash | 📋 Planned | 2–4 weeks |
| Guest-board migration on sign-in | 📋 Planned | 2–4 days |
| Cloud backups, quotas, telemetry, and load tests | 📋 Planned | 1–2 weeks |

**Exit gate:** sync success ≥ 99.9%; cross-device board open works after offline edits; deletion/recovery and data export are verified.

### Phase 7 — Sharing and Student View

| Task | Status | AI-assisted effort |
|------|--------|---------------------|
| Revocable read-only share links | 📋 Planned | 1–2 weeks |
| QR code and share UI | 📋 Planned | 2–4 days |
| Stripped student viewer | 📋 Planned | 4–7 days |
| Follow-teacher viewport updates | 📋 Planned | 4–7 days |
| Recording upload/share | 📋 Planned | 3–6 weeks |
| Abuse controls, expiration, and caching | 📋 Planned | 4–8 days |

**Exit gate:** share view interactive in under two seconds; classroom access works behind shared school NAT; ≥ 25% of active teachers share weekly.

### Phase 8 — School Readiness

| Task | Status | AI-assisted effort |
|------|--------|---------------------|
| Google Classroom / Teams basic sharing | 📋 Planned | 1–2 weeks each |
| LTI 1.3 / LMS integration | 📋 Planned | 3–6 weeks |
| WCAG 2.2 AA remediation and independent audit | 📋 Planned | 3–6 weeks plus audit calendar |
| Privacy, terms, DPA, FERPA/COPPA posture | 📋 Planned | 1–3 months with counsel |
| Admin, audit log, retention, domain controls | 📋 Planned | 2–4 months |
| CDN, staging, rollback, status page, scaling | 📋 Planned | 2–4 weeks incrementally |

---

## AI-Assisted Effort Summary

| Milestone | Focused team estimate |
|-----------|-----------------------|
| Low-hanging safety improvements | 1 week |
| Trustworthy closed teacher beta | 6–10 weeks |
| Strong local lesson-creation product | 2–3 months |
| Cloud-backed individual-teacher product | 3–5 months |
| School-ready platform | 9–15 months |

Recent feature and bug-fix velocity supports aggressive estimates for contained UI work. The schedule must still reserve time for migrations, iOS soak testing, security, accessibility, legal review, and teacher validation.

---

## Success Metrics

| Metric | Beta target | Launch target |
|--------|-------------|---------------|
| Time to first draw | < 2 s | < 2 s |
| Time to first useful lesson | < 10 min | < 5 min |
| Local durable-save latency | p95 < 1 s | p95 < 1 s |
| Crash-free sessions | ≥ 99.5% | ≥ 99.9% |
| Recording completion (supported duration) | ≥ 98% | ≥ 99% |
| Cloud sync success | — | ≥ 99.9% |
| Share view interactive | — | p75 < 2 s |
| Week-1 teacher retention | ≥ 40% pilot | ≥ 45% |
| Week-4 teacher retention | ≥ 30% pilot | ≥ 35% |
| Active teachers sharing weekly | — | ≥ 25% |
| North star | Weekly lessons created and shared by retained teachers | Growth with stable retention |
