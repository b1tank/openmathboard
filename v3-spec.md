# OpenMathBoard v3 — Product Spec

## One-Line Definition

> **A math-first infinite canvas whiteboard with cloud sync, auth, and shareable read-only links — so teachers draw parametric shapes on iPad, save to the cloud, and share live boards with students.**

---

## Top Principles

1. **Math objects, not pixels** — A parabola is `{vertex, a, direction}` with draggable handles. This is our moat.
2. **Teacher speed** — Every interaction < 200ms. Cloud sync is invisible (auto-save, no "save" button).
3. **Sign in and go** — One-click Microsoft/Google login. Boards auto-sync. Open any device, resume where you left off.
4. **Share, don't collaborate (MVP)** — Teachers share read-only links with students. Real-time co-editing is Phase 2+.
5. **OSS core, SaaS shell** — Core editor stays MIT. Cloud/auth layer is the product. Excalidraw model.
6. **Azure-native** — Already on Container Apps. Extend with AD B2C, Blob Storage, Cosmos DB, SignalR.

---

## 1. Authentication & Identity

| Feature | Support | Details |
|---------|---------|---------|
| Email + password login | ✅ | Azure AD B2C custom policy |
| Microsoft account login | ✅ | Azure AD B2C built-in provider |
| Google account login | ✅ | Azure AD B2C social identity provider |
| Apple ID login | ❌ Phase 2 | Add when iOS app is considered |
| Anonymous / guest mode | ✅ | Current behavior — localStorage only, no cloud |
| Session management | ✅ | JWT tokens, 30-day refresh, secure httpOnly cookies |
| Profile (name, avatar) | ✅ | Pulled from identity provider, editable |

**Implementation:** Azure AD B2C handles all OAuth flows. Frontend gets a JWT, passes it as `Authorization: Bearer <token>` to the API. No password storage on our side.

---

## 2. Board Management & Cloud Storage

| Feature | Support | Details |
|---------|---------|---------|
| Auto-save to cloud | ✅ | Debounced (2s), full board state → Azure Blob Storage |
| Board list (dashboard) | ✅ | Grid/list view, thumbnail, last-modified date, title |
| Create new board | ✅ | Blank, or from template |
| Rename board | ✅ | Inline edit on dashboard |
| Delete board | ✅ | Soft delete → 30-day trash → permanent |
| Duplicate board | ✅ | Deep copy of board state |
| Folders / organization | ❌ Phase 2 | Flat list for MVP |
| Search boards | ❌ Phase 2 | Title search |
| Board thumbnails | ✅ | Auto-generated canvas snapshot on save |

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
| Save to file | ✅ | Download `.openmathboard` JSON file |
| Load from file | ✅ | Open `.openmathboard` file → populate canvas |
| File format is JSON | ✅ | Human-readable, versionable, diffable |
| Schema version in file | ✅ | `{ version: 3, ... }` — migration on load |
| Export PNG | ✅ | Current behavior, keep |
| Export SVG | ✅ NEW | Vector export with math shapes as SVG paths |
| Copy canvas to clipboard | ✅ | Current behavior, keep |

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
| Generate share link | ✅ | One-click button → copy URL to clipboard |
| Read-only view | ✅ | Viewers see the board, can pan/zoom, cannot edit |
| No login required to view | ✅ | Share token in URL grants read access |
| View shows live updates | ✅ Phase 1.5 | Via polling (5s) initially; WebSocket later |
| Collaborative edit link | ❌ Phase 2 | Future: real-time co-editing |
| Embed via iframe | ❌ Phase 2 | `<iframe src="openmathboard.com/embed/TOKEN">` |
| QR code for share link | ✅ | Teacher projects QR, students scan with phone |
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
| Read-only live mirror | ✅ | Students see teacher drawing updated in near-real-time |
| No login for students | ✅ | Access via share link |
| Pan & zoom independently | ✅ | Students navigate the canvas independently of teacher |
| "Follow teacher" button | ✅ | Toggle: lock student camera to teacher's viewport |
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
| Place text on canvas | ✅ NEW | Click to create text box, type, click away to commit |
| Math symbols (basic) | ✅ NEW | ±, ², ³, √, π, θ, ∞, ≤, ≥, ≠ via emoji-style picker |
| Font sizes | ✅ NEW | Small / Medium / Large |
| Text color | ✅ NEW | Uses existing 6-color palette |
| Move / resize text | ✅ NEW | Select tool, drag to move, handles to resize |
| Edit existing text | ✅ NEW | Double-click to re-enter edit mode |
| LaTeX rendering | ❌ Phase 2 | Render `$y = ax^2 + bx + c$` as proper math typography |

**Why now:** Every competitor has text. Teachers need to write problem statements, label axes, annotate shapes. This is the #1 missing feature for "good-shape product" status.

---

## 7. Board Templates

| Feature | Support | Details |
|---------|---------|---------|
| Blank canvas | ✅ | Default, as today |
| Coordinate plane | ✅ NEW | Pre-placed axes object centered, grid on |
| Graph paper (4-quadrant) | ✅ NEW | Grid on, axes visible, pre-set zoom for typical graphing |
| Number line | ✅ NEW | Pre-placed number line, centered horizontally |
| Dot paper (isometric) | ❌ Phase 2 | For 3D geometry lessons |
| Custom template (save current as template) | ❌ Phase 2 | |

**Implementation:** Templates are just pre-defined `.openmathboard` JSON objects. On "New board → from template," load the JSON into state. No backend changes needed.

---

## 8. Dark Mode

| Feature | Support | Details |
|---------|---------|---------|
| Dark theme | ✅ NEW | Dark background, light strokes, themed UI |
| System preference detection | ✅ NEW | `prefers-color-scheme` media query |
| Manual toggle | ✅ NEW | Button in toolbar |
| Adapts canvas background | ✅ NEW | White → dark gray; grid color adjusts |
| Stroke colors remain vibrant | ✅ NEW | Color palette adjusted for dark backgrounds |

---

## 9. PWA & Offline

| Feature | Support | Details |
|---------|---------|---------|
| Service worker | ✅ NEW | Cache app shell for offline use |
| Installable (Add to Home Screen) | ✅ NEW | PWA manifest with icons |
| Offline drawing | ✅ NEW | Uses IndexedDB, syncs when online |
| Offline indicator | ✅ NEW | Banner: "You're offline. Changes will sync when connected." |

---

## 10. Additional Core Improvements

| Feature | Support | Details |
|---------|---------|---------|
| Rectangle tool | ✅ NEW | Basic shape, 4 corner anchors |
| Triangle tool | ✅ NEW | 3 vertex anchors |
| Snap to grid | ✅ NEW | Hold Shift while dragging → snap anchor to grid points |
| Keyboard shortcut overlay | ✅ NEW | Press `?` → show all shortcuts |
| SVG export | ✅ NEW | Vector format, great for printing math worksheets |
| Undo/redo visual indicator | ✅ NEW | Ghost count on undo/redo buttons |

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
| PWA (installable) | ✅ NEW |

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
    auth.js      — Azure AD B2C login/logout, token management
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
    auth.js          — Validate Azure AD B2C JWT
    cors.js          — CORS config
```

### Azure Resources (extend existing infra/)

| Resource | Purpose | New? |
|----------|---------|------|
| Container App | Serve frontend + API | Existing (extend) |
| Azure AD B2C | User authentication | ✅ NEW |
| Cosmos DB (serverless) | Board metadata | ✅ NEW |
| Azure Blob Storage | Board data + thumbnails | ✅ NEW |
| Azure SignalR Service | Push updates (Phase 2) | ❌ Phase 2 |
| Application Insights | Monitoring | Existing |
| Grafana | Dashboards | Existing |
| Azure CDN | Static asset caching | ✅ NEW (optional) |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/boards` | ✅ | List user's boards (metadata only) |
| `POST` | `/api/boards` | ✅ | Create new board |
| `GET` | `/api/boards/:id` | ✅ | Get board metadata |
| `GET` | `/api/boards/:id/data` | ✅ | Get board data (blob) |
| `PUT` | `/api/boards/:id/data` | ✅ | Save board data (blob) |
| `PUT` | `/api/boards/:id` | ✅ | Update board metadata (title, etc.) |
| `DELETE` | `/api/boards/:id` | ✅ | Soft-delete board |
| `POST` | `/api/boards/:id/share` | ✅ | Generate share token |
| `GET` | `/api/share/:token` | ❌ | Public: get shared board data (read-only) |
| `GET` | `/api/share/:token/camera` | ❌ | Public: get teacher's camera state (for follow mode) |

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
| LaTeX rendering | ❌ Phase 2 | Basic math symbols in text tool suffice for MVP |
| Custom shape libraries | ❌ Phase 2 | Pre-built library first |
| Notion/Obsidian integration | ❌ Future | Requires npm package (Phase 2+) |
| Pressure-sensitive strokes | ❌ | Adds complexity to data model, minimal teaching value |

---

## Implementation Phases

### Phase 5 — Core Product Gaps (pre-cloud foundation)
*~2 weeks*

| Task | Est. Lines |
|------|-----------|
| 5.1 Text tool (create, edit, render, select, move) | ~300 |
| 5.2 Rectangle tool (with 4 corner anchors) | ~100 |
| 5.3 Dark mode (CSS variables, toggle, persist preference) | ~150 |
| 5.4 File format: save/load `.openmathboard` JSON | ~100 |
| 5.5 SVG export | ~200 |
| 5.6 Keyboard shortcut overlay (`?`) | ~80 |
| 5.7 Board templates (coordinate plane, number line, blank) | ~100 |
| 5.8 Snap-to-grid (Shift modifier) | ~60 |
| 5.9 PWA manifest + service worker | ~100 |

### Phase 6 — Authentication & Cloud
*~3 weeks*

| Task | Est. Lines |
|------|-----------|
| 6.1 Azure AD B2C tenant setup + config | Infra (Bicep) |
| 6.2 Frontend auth module (login/logout/token) | ~200 |
| 6.3 API scaffolding (Express or Azure Functions) | ~150 |
| 6.4 Cosmos DB setup + board metadata CRUD | ~200 |
| 6.5 Azure Blob Storage setup + board data upload/download | ~150 |
| 6.6 Auto-save to cloud (debounced, ETags, offline queue) | ~250 |
| 6.7 IndexedDB local cache for offline | ~150 |
| 6.8 Dashboard UI (board list, create, rename, delete) | ~400 |
| 6.9 Migrate localStorage boards to cloud on first login | ~80 |
| 6.10 Thumbnail generation (client-side canvas → PNG → Blob) | ~60 |

### Phase 7 — Sharing & Student View
*~2 weeks*

| Task | Est. Lines |
|------|-----------|
| 7.1 Share link generation (nanoid token, Cosmos DB) | ~80 |
| 7.2 QR code generation (client-side, lightweight lib) | ~50 |
| 7.3 Read-only viewer page (stripped UI, pan/zoom only) | ~200 |
| 7.4 Polling-based live update (5s interval, ETag/304) | ~100 |
| 7.5 "Follow teacher" camera sync | ~80 |
| 7.6 Share UI (button in toolbar, copy link, show QR) | ~100 |

### Phase 8 — Polish & Launch Readiness
*~1 week*

| Task | Est. Lines |
|------|-----------|
| 8.1 Loading states & error handling (API failures, offline) | ~100 |
| 8.2 Toast notifications (saved, shared, error, offline) | ~50 |
| 8.3 Onboarding flow (first-time user tooltip tour) | ~150 |
| 8.4 Landing page (marketing, feature list, sign-up CTA) | ~300 |
| 8.5 Privacy policy & terms of service pages | Content |
| 8.6 Azure infra hardening (CORS, rate limiting, WAF) | Infra |
| 8.7 E2E tests for auth, save, share flows | ~300 |

---

## Total Estimated Effort (v3)

| Phase | New Lines | Duration |
|-------|-----------|----------|
| Phase 5 — Core Gaps | ~1200 | ~2 weeks |
| Phase 6 — Auth & Cloud | ~1700 | ~3 weeks |
| Phase 7 — Sharing & Student View | ~600 | ~2 weeks |
| Phase 8 — Polish & Launch | ~900 | ~1 week |
| **Total v3** | **~4400** | **~8 weeks** |

Combined with v2 (~4500 lines): Total codebase ~9000 lines across ~30 modules.

---

## Success Metrics (Launch)

| Metric | Target |
|--------|--------|
| Time to first draw (guest) | < 2 seconds |
| Time to first draw (authenticated) | < 5 seconds (login flow) |
| Auto-save latency | < 3 seconds after last change |
| Share link load time (student) | < 2 seconds |
| Student view update latency | < 7 seconds (polling) |
| Lighthouse score (PWA) | > 90 |
| Board file size (typical lesson) | < 500 KB |
