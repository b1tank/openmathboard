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
4. **Cloud product** — Microsoft Entra External ID, multi-board dashboard, offline/cloud sync
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

## 🚀 Self-Host on Azure

Deploy your own OpenMathBoard instance on Azure in ~15 minutes. Everything is automated via GitHub Actions.

### What You'll Get

| Resource | Purpose | Est. Cost |
|----------|---------|-----------|
| Container App | Hosts the app (nginx) | ~$5/mo |
| Container Registry (Basic) | Stores Docker images | ~$5/mo |
| Application Insights | Monitoring + alerts | Free tier |
| Managed Grafana | Dashboards | ~$0/mo |
| **Total** | | **~$10/mo** |

### Step 1: Fork & Clone

```bash
git clone https://github.com/<your-username>/openmathboard.git
cd openmathboard
```

### Step 2: Create Azure Resources

```bash
az login
az group create --name openmathboard-rg --location westus3
```

### Step 3: Create a Service Principal

```bash
az ad sp create-for-rbac \
  --name "openmathboard-github-deploy" \
  --role Contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/openmathboard-rg \
  --json-auth
```

Copy the entire JSON output.

### Step 4: Configure GitHub Secrets & Variables

Go to your forked repo → **Settings → Secrets and variables → Actions**.

**Secrets tab** (sensitive, encrypted):

| Secret | Value |
|--------|-------|
| `AZURE_CREDENTIALS` | Full JSON from Step 3 |
| `AZURE_RESOURCE_GROUP` | `openmathboard-rg` |
| `ACR_NAME` | `openmathboardacr` (must match Bicep) |
| `CONTAINER_APP_NAME` | `openmathboard-app` (must match Bicep) |

**Variables tab** (non-sensitive, visible):

| Variable | Value | Example |
|----------|-------|---------|
| `DOMAIN_NAME` | Your domain | `lezhi.school` |
| `ALERT_EMAIL` | Your email for alerts | `you@example.com` |

### Step 5: Deploy Infrastructure

1. Go to **Actions → Deploy Infrastructure → Run workflow**
2. Select **"deploy"** → click **"Run workflow"**
3. Wait ~3 minutes for all Azure resources to be created

### Step 6: Point Your Domain

Add these DNS records at your domain registrar:

| Type | Host | Value |
|------|------|-------|
| A | `@` | Container App's IP (from Azure Portal → Container App → Custom domains) |
| TXT | `asuid` | Custom domain verification ID (from Container App → Properties) |

After DNS propagates, re-run **Deploy Infrastructure** — it will automatically create a managed HTTPS certificate and bind your domain.

### Step 7: Deploy the App

Push any commit to `main`:

```bash
git commit --allow-empty -m "chore: trigger first deploy" && git push
```

### Step 8: Verify

```bash
curl -s https://yourdomain.com/health
# → OK
```

---

### CI/CD: What Happens Automatically

| Trigger | Workflow | What it does |
|---------|----------|--------------|
| Push to `main` | **Deploy App** | Builds Docker image → pushes to ACR → deploys to Container App |
| Manual dispatch | **Deploy Infrastructure** | Creates/updates Azure resources → configures custom domain + HTTPS |

### Monitoring (included)

- **Application Insights** — request metrics, error logs
- **Azure Monitor Alerts** — email alerts for: app down, high error rate, slow responses
- **Managed Grafana** — dashboard URL in deployment outputs

---

## License

MIT
