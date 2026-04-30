# 🌍 CarbonTwin

**CarbonTwin** is a digital sustainability platform that turns invisible digital and lifestyle emissions into a concrete, trackable Eco-Score. Every metric on the dashboard is computed from real activity logged by the user — there is **no synthetic or seeded data**.

It was originally built and won [hackathon name] under tight time pressure. This repo is the cleaned-up, demo-ready version: every button is wired, every number is real, and the AI features fail loudly when their keys are missing instead of silently faking results.

---

## What it does

- **Real carbon engine** — All calculations use the formula
  `kg CO₂ = usage × baseEnergy(kWh) × PUE (1.2) × Grid Intensity (0.71)`
  where `0.71 kg CO₂/kWh` is the India CEA 2023 grid intensity factor.
- **Activity ingestion** — Browser, hardware and lifestyle endpoints store an `ActivityLog` document per event, recompute the user's `totalCarbonSaved`, `totalRupeesSaved`, streak and Eco-Score, then push a live socket update.
- **AI Eco-Coach** — A Groq Llama 3.3 chatbot grounded in the user's real recent activity. If `GROQ_API_KEY` is missing, the UI shows a clear "AI not configured" state instead of fake replies.
- **Smart Commute Scanner** — Uploads a transit ticket, extracts route + mode using Gemini Vision (or xAI Grok Vision as fallback), computes CO₂ saved vs. driving the same distance, and awards Eco-Points.
- **What-If Simulator** — A stateless slider playground that calls the same carbon engine. The "Apply" button persists the chosen habits as a real `ActivityLog`.
- **ESG Export** — One-click CSV (or JSON) of the user's Scope 2 + Scope 3 net emissions, suitable for personal records.
- **Live leaderboard** — Top 10 users by Eco-Score, cached in Redis with a 30s TTL. Users with zero activity are excluded so the board never shows "ranks" that never moved.
- **Real-time dashboard** — Socket.io pushes a `metrics_update` event whenever totals or score change, so the UI never needs a refresh.

---

## Tech stack

| Layer | Tech |
|------|------|
| Frontend | React + Vite, TypeScript, TailwindCSS, Framer Motion, Recharts, Socket.io client |
| Backend | Node.js, Express, Mongoose, Socket.io, node-cron, JWT auth, multer |
| Database | MongoDB Atlas |
| Cache | Redis (with in-memory fallback when not running locally) |
| AI | Groq (Llama 3.3 70B) for chat + suggestions; Google Gemini 1.5 Flash (or xAI Grok Vision) for ticket OCR |

---

## Project layout

```
.
├── server/                 Express API
│   ├── index.js            Bootstrap + bootstrap order
│   └── src/
│       ├── controllers/    auth, dashboard, ingest, simulator, chat, suggestion, scan, export, trade, stats
│       ├── services/       CarbonEngine, AIService, SocketService, RedisService
│       ├── models/         User, Organization, ActivityLog, Suggestion
│       ├── jobs/           Daily nudgeCron (8 AM IST)
│       ├── middleware/     authMiddleware (JWT)
│       └── routes/         Central router
├── src/                    React frontend
│   ├── pages/              Landing, AuthPage, DashboardPage, etc.
│   ├── components/         landing/, dashboard/, ui/
│   └── services/           api.ts, DashboardContext.tsx, useGlobalStats.ts
└── extension/              Optional Chrome extension (Manifest V3)
```

---

## Run it locally

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # then edit values (see below)
npm run dev            # starts on http://localhost:3001
```

Required env (`server/.env`):

```
PORT=3001
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=replace-with-a-long-random-string
FRONTEND_URL=http://localhost:5173

# Optional but recommended:
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Optional:
REDIS_URL=redis://localhost:6379
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

The API still starts when MongoDB is unavailable — protected endpoints simply return `503` so the UI shows an honest error.

### 2. Frontend

```bash
# from repo root
npm install
npm run dev            # starts on http://localhost:5173
```

Optional `.env.local`:

```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Chrome extension (optional)

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Load unpacked → select the `extension/` folder.
4. The extension reads your CarbonTwin auth token from the dashboard tab and POSTs telemetry every 5 minutes.

---

## API surface (all under `/api`)

| Method | Path | Auth | Purpose |
|------|------|------|---------|
| GET | `/health` | — | Liveness probe |
| GET | `/stats/global` | — | Real platform totals (used by landing page) |
| POST | `/auth/signup` | — | Create account |
| POST | `/auth/login` | — | Sign in |
| GET | `/auth/me` | ✓ | Current profile |
| PATCH | `/auth/profile` | ✓ | Update name / avatar |
| PATCH | `/auth/password` | ✓ | Change password |
| DELETE | `/auth/account` | ✓ | Delete account + activity |
| GET | `/dashboard/metrics` | ✓ | User + chart + recent activity |
| GET | `/dashboard/leaderboard` | ✓ | Top 10 by Eco-Score |
| GET | `/dashboard/activity` | ✓ | Paginated activity log |
| POST | `/ingest/{browser,hardware,lifestyle}` | ✓ | Log new activity |
| POST | `/simulator/what-if` | ✓ | Stateless habit projection |
| POST | `/chat` | ✓ | Eco-Coach chat |
| GET | `/suggestions` | ✓ | Pending AI suggestions |
| PATCH | `/suggestions/:id` | ✓ | Accept / dismiss |
| POST | `/suggestions/generate` | ✓ | Force regenerate |
| POST | `/sustainability/scan-ticket` | ✓ | Vision-based ticket scanner |
| GET | `/export/esg` | ✓ | Personal ESG CSV/JSON |
| POST | `/trade/points` | ✓ | Atomic P2P Eco-Point transfer |

---

## Honest limits

- **Hackathon scope.** This is a personal project, not a SaaS. There is no billing, no enterprise SSO, no audit trail.
- **Energy constants are estimates** based on public datasets (CEA grid intensity, average video bitrates, common laptop sleep draw). They are good enough to compare habits against each other but are not certified by an external auditor.
- **AI features require keys.** Without `GROQ_API_KEY`, the chat and suggestion endpoints return `503`. The UI surfaces this clearly.
- **The Chrome extension is optional.** The dashboard works fine without it — you can log activity manually via the simulator.

---

Made by Aman Shekhar.
