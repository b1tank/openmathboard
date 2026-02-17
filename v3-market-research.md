# OpenMathBoard v3 — Market Research & Gap Analysis

## Product Space

**Math-focused infinite canvas whiteboards for live teaching** — positioned between general-purpose drawing tools (Excalidraw, tldraw) and dedicated math software (Desmos, GeoGebra). Target: math teachers on iPad/desktop doing live-stream or in-class instruction.

---

## Competitors Analyzed

### 1. Excalidraw (excalidraw.com / @excalidraw/excalidraw)

| Dimension | Details |
|-----------|---------|
| **What it is** | Hand-drawn-style infinite canvas whiteboard |
| **GitHub** | 117k ★, 353 contributors, MIT license |
| **npm package** | `@excalidraw/excalidraw` — React component, MIT |
| **Tech stack** | TypeScript, React, Rough.js for hand-drawn rendering |
| **Target audience** | Developers, designers, PMs — diagramming & brainstorming |
| **Pricing** | Free OSS editor; **Excalidraw+ $6/user/month** (cloud, teams, AI, presentations) |

**Core Strengths:**
- Zero-friction: no signup required, just open and draw
- `.excalidraw` open JSON format — portable, versionable
- End-to-end encrypted real-time collaboration (WebSocket + E2EE)
- PWA — works offline, installable
- Public shape libraries (community-contributed)
- Massive ecosystem: Obsidian, Notion, VS Code, CodeSandbox integrations
- SOC 2 certified (Plus)
- Generative AI (text-to-diagram)
- Presentations (Frames as slides)

**Core Weaknesses (for math teaching):**
- **No math-native shapes** — no parabolas, sine curves, coordinate axes, number lines
- **No parametric anchors** — shapes are static once drawn; no vertex/amplitude/frequency handles
- **No shape detection** — freehand stays freehand (no "draw then convert" for math shapes)
- **Hand-drawn aesthetic only** — "sketchy" style doesn't suit precise math diagrams
- **React dependency** — can't embed without React
- **No Apple Pencil optimization** — no pencil-vs-finger discrimination
- **No education features** — no student view, no board templates for math

**Plus (SaaS) Features:**
- Email/Google auth
- Unlimited scenes & folders saved to cloud
- Access management (edit/view rights)
- Shareable read-only links + embeds
- Voice hangouts & screensharing
- Extended AI
- Teams workspace management
- Comments
- PDF & PPTX export

---

### 2. tldraw (tldraw.com / tldraw SDK)

| Dimension | Details |
|-----------|---------|
| **What it is** | Infinite canvas SDK for React; also a hosted whiteboard app |
| **GitHub** | 45.2k ★, 222 contributors |
| **npm package** | `tldraw` — 144.9k weekly downloads |
| **Tech stack** | TypeScript, React, custom sync engine |
| **Target audience** | Developers embedding canvas into products (ClickUp, Padlet, Mobbin) |
| **Pricing** | Custom license — free with watermark; **business license** (value-based pricing) to remove watermark; 100-day free trial |

**Core Strengths:**
- **Best-in-class SDK** — designed for embedding, fully customizable shapes/tools/UI
- Enterprise-grade multiplayer sync (Cloudflare Durable Objects)
- Custom shape system — define your own shapes with full rendering/interaction control
- Runtime editor API — full programmatic control
- Pressure-sensitive freehand drawing
- Minimap, grid, rulers, smart camera
- Comprehensive starter kits (multiplayer, workflow, chat)
- Conflict-free collaborative editing (CRDT-based)
- Robust persistence and migration system
- Performance: viewport culling, efficient batching, thousands of shapes

**Core Weaknesses (for math teaching):**
- **Not MIT** — custom license requires watermark or paid business license
- **React required** — heavy framework dependency
- **No math shapes** — same as Excalidraw, all generic geometry
- **SDK-first, not app-first** — the hosted app is a demo, not a polished product for end users
- **Complex** — "the $5M canvas" is overkill for a focused math whiteboard
- **No education features** — no student view, no math templates
- **Value-based pricing** — unclear cost for small education startups

---

### 3. Desmos (desmos.com) — Adjacent Competitor

| Dimension | Details |
|-----------|---------|
| **What it is** | Graphing calculator & classroom activity builder |
| **Target audience** | Math teachers & students |
| **Pricing** | Free (acquired by Amplify, monetized through curriculum) |

**Strengths:** Precise mathematical graphing, equation-driven, classroom activities, student response collection
**Weaknesses:** No freehand drawing, no whiteboard UX, no free-form annotation, can't use as a general teaching canvas

---

### 4. GeoGebra (geogebra.org) — Adjacent Competitor

| Dimension | Details |
|-----------|---------|
| **What it is** | Dynamic mathematics software for geometry, algebra, calculus |
| **Target audience** | Math teachers & students |
| **Pricing** | Free (non-commercial), paid for commercial use |

**Strengths:** Powerful mathematical constructions, geometry proofs, CAS integration
**Weaknesses:** Complex UI (steep learning curve), not a whiteboard, no freehand-first UX, intimidating for quick live teaching

---

## Feature Comparison Matrix

| Feature | OpenMathBoard v2 | Excalidraw | tldraw | Desmos | GeoGebra |
|---------|:-:|:-:|:-:|:-:|:-:|
| **Canvas & Drawing** | | | | | |
| Infinite canvas | ✅ | ✅ | ✅ | ❌ | ❌ |
| Zoom & pan | ✅ | ✅ | ✅ | ✅ | ✅ |
| Freehand drawing | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pressure sensitivity | ❌ | ❌ | ✅ | ❌ | ❌ |
| Apple Pencil optimization | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hand-drawn style | ❌ | ✅ | ✅ | ❌ | ❌ |
| Clean/precise style | ✅ | ❌ | ✅ | ✅ | ✅ |
| Image support | ✅ | ✅ | ✅ | ❌ | ✅ |
| Dark mode | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Math-Specific Shapes** | | | | | |
| Parabola (parametric) | ✅ | ❌ | ❌ | ✅ | ✅ |
| Sine/cosine curves | ✅ | ❌ | ❌ | ✅ | ✅ |
| Coordinate axes (2D) | ✅ | ❌ | ❌ | ✅ | ✅ |
| 3D axes (isometric) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Number line | ✅ | ❌ | ❌ | ❌ | ✅ |
| Arrow (math vector) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Ellipse (parametric) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Parametric Editing** | | | | | |
| Draggable anchors on shapes | ✅ | ❌ | ❌ | ✅ (sliders) | ✅ |
| Vertex/amplitude/frequency handles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Draw-then-convert popup | ✅ | ❌ | ❌ | ❌ | ❌ |
| Shape detection from freehand | ✅ | ❌ | ❌ | ❌ | ❌ |
| **General Shapes** | | | | | |
| Rectangle | ❌ | ✅ | ✅ | ❌ | ✅ |
| Diamond | ❌ | ✅ | ✅ | ❌ | ✅ |
| Text tool | ❌ | ✅ | ✅ | ✅ | ✅ |
| Sticky notes | ❌ | ❌ | ✅ | ❌ | ❌ |
| Arrow binding (snap to shapes) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Persistence & Sharing** | | | | | |
| Local save (browser) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save to file (.json/.excalidraw) | ❌ | ✅ | ✅ | ❌ | ✅ |
| Cloud save (auto-sync) | ❌ | ✅ (Plus) | ✅ | ✅ | ✅ |
| User authentication | ❌ | ✅ (Plus) | ✅ | ✅ | ✅ |
| Shareable links (read-only) | ❌ | ✅ (Plus) | ✅ | ✅ | ✅ |
| Shareable links (collaborative) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Export PNG/SVG | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export PDF | ❌ | ✅ (Plus) | ❌ | ❌ | ✅ |
| Open file format | ❌ | ✅ (.excalidraw JSON) | ✅ | ❌ | ✅ |
| **Collaboration** | | | | | |
| Real-time multi-user editing | ❌ | ✅ | ✅ | ✅ (activities) | ❌ |
| Live cursors | ❌ | ✅ | ✅ | ❌ | ❌ |
| End-to-end encryption | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Education** | | | | | |
| Student view (read-only mirror) | ❌ | ❌ | ❌ | ✅ (activities) | ❌ |
| Board templates | ❌ | ❌ | ❌ | ✅ | ✅ |
| Presentation mode | ❌ | ✅ (Plus) | ❌ | ❌ | ❌ |
| Classroom activity builder | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Platform** | | | | | |
| iPad + Apple Pencil | ✅ (primary) | ✅ | ✅ | ✅ (app) | ✅ (app) |
| Desktop browser | ✅ | ✅ | ✅ | ✅ | ✅ |
| PWA / offline | ❌ | ✅ | ❌ | ✅ (app) | ✅ (app) |
| **Developer / OSS** | | | | | |
| Open source | ✅ MIT | ✅ MIT | ⚠️ Custom license | ❌ | ⚠️ Non-commercial |
| npm package (embeddable) | ❌ | ✅ (React) | ✅ (React) | ❌ | ✅ |
| No framework dependency | ✅ | ❌ (React) | ❌ (React) | N/A | N/A |
| i18n | ✅ (en/zh) | ✅ (30+ langs) | ✅ | ✅ | ✅ |

---

## Gap Analysis — What OpenMathBoard is Missing

### Critical Gaps (blocking "good-shape product" status)

| Gap | Impact | Competitor Reference |
|-----|--------|---------------------|
| **No cloud persistence** | Teachers lose work if they clear browser data. Can't access boards from another device. | Excalidraw+, tldraw, Desmos, GeoGebra all have cloud save |
| **No user authentication** | Can't identify users, can't tie boards to accounts | Excalidraw+: email/Google; Desmos: Google/Clever/email |
| **No shareable links** | Teachers can't send boards to students for review | Excalidraw: shareable links; Desmos: activity codes |
| **No save/load to file** | Can't export/import `.openmathboard` JSON files — only PNG export | Excalidraw: `.excalidraw` JSON; GeoGebra: `.ggb` files |
| **No text tool** | Can't label axes, add equation annotations, or write problem statements | Every competitor has text |
| **No dark mode** | Poor accessibility, looks dated | Excalidraw, tldraw both have dark mode |

### Important Gaps (expected by users)

| Gap | Impact | Competitor Reference |
|-----|--------|---------------------|
| **No student view mode** | Teachers can't share live board with students during class | Desmos classroom activities |
| **No board templates** | Teachers start from blank every time; common setups (coordinate plane, graph paper with axes) should be one-click | Desmos, GeoGebra templates |
| **No rectangle/polygon tool** | Missing basic shapes that every whiteboard has | Excalidraw, tldraw |
| **No PWA / offline** | Can't install as app, doesn't work without internet | Excalidraw is a full PWA |
| **No board management UI** | No dashboard to list, rename, delete, organize boards | Excalidraw+: scenes & folders; GeoGebra: materials |
| **No keyboard shortcut overlay** | Users can't discover shortcuts | Excalidraw: `?` shows shortcuts |

### Nice-to-Have Gaps (differentiation opportunities)

| Gap | Opportunity |
|-----|------------|
| **No LaTeX/equation rendering** | Math teachers need to write equations — even basic inline math |
| **No presentation mode** | Teachers could use frames/slides for structured lessons |
| **No recording/playback** | Record drawing session, share as replay — huge for async teaching |
| **No snap-to-grid** | Helpful for precise math diagrams |
| **No shape libraries** | Pre-made geometry sets (triangles, polygons, unit circles) |

---

## Differentiation — OpenMathBoard's Unique Value

OpenMathBoard isn't competing with Excalidraw or tldraw head-to-head. It occupies a **unique niche** that neither addresses:

| Differentiator | Why it matters |
|----------------|---------------|
| **Math-native shapes** | Parabolas, sine curves, 3D axes, number lines — none of the general whiteboards have these |
| **Parametric anchors** | Drag to change amplitude, vertex, frequency — not just resize. Teachers manipulate the *math*, not pixels |
| **Draw-then-convert** | Freehand → recognized math shape with one tap. No other tool does this |
| **Apple Pencil optimized** | Pencil draws, finger pans — designed for iPad teaching |
| **Zero framework dependency** | Pure JS, no React. Fast to load, easy to embed anywhere |
| **Teacher-speed UX** | Every interaction < 200ms. Optimized for live teaching pace |
| **MIT licensed, truly free** | Unlike tldraw (custom license) or GeoGebra (non-commercial restrictions) |

**Positioning statement:** *"The math whiteboard that Excalidraw and tldraw can't be — purpose-built for teachers who need parametric shapes, not just pretty diagrams."*

---

## Recommended Strategy: OSS + SaaS (Excalidraw Model)

Based on your goals and market research, here's the recommended split:

### Layer 1: OSS Core Editor (MIT, current repo)

**What stays open source:**
- The entire canvas engine (drawing, shapes, anchors, detection, rendering)
- All math shapes (parabola, sine, axes, number line, etc.)
- Shape palette, property panel, toolbar
- localStorage persistence
- File export/import (.openmathboard JSON + PNG/SVG)
- i18n system
- Zero dependencies, pure ES modules

**Why:** This is your community flywheel. Math teachers, ed-tech developers, and OSS contributors use and improve the core. It's what makes OpenMathBoard defensible — the math-native shapes and parametric system are hard to replicate.

**Future:** Publish as `@openmathboard/core` npm package (vanilla JS, no React needed). Anyone can `<script type="module">` include it.

### Layer 2: SaaS Website (Proprietary, separate repo or directory)

**What's behind the hosted service (openmathboard.com):**
- User authentication (Email, Microsoft, Google via Azure AD B2C)
- Cloud board storage & auto-sync (Azure Blob Storage + Cosmos DB)
- Board management dashboard (list, rename, delete, organize)
- Shareable read-only links (teacher → students)
- Student view mode (live read-only mirror via SignalR/WebSocket)
- Board templates (coordinate plane, blank, graph paper, number line)
- Usage analytics

**Why:** This is your revenue layer. Teachers get the "just works" experience — sign in, draw, boards are saved, share link with class. Free tier + paid Pro tier.

### Pricing Model (Suggested)

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Core editor, 3 cloud boards, export PNG/SVG, read-only share links |
| **Teacher Pro** | $4/month | Unlimited boards, folders, board templates, student view mode, file export/import |
| **School** | $3/user/month (min 10) | Everything in Pro + admin dashboard, bulk user management |

(Undercut Excalidraw+ at $6/month by being math-focused and leaner.)
