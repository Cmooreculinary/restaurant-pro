# Restaurant Pro — CANONICAL REPO [Iteration 4 | Render-Ready | FastAPI + React]

> Restaurant business planning platform built by Blue Collar Apps. Site selection, lease negotiation, cost analysis, operations launch, and expansion planning — all in one place.

---

## What It Does

| Module | Description |
|---|---|
| Command Center | Dashboard overview and project status |
| Site Strategist | Location analysis with demographics and competition scoring |
| Ground Up | Full restaurant build-out planning and timeline |
| Ops Launchpad | Opening day operations and staff readiness |
| Lease Negotiation | AI-assisted lease analysis and term review |
| Expansion Toolkit | Multi-unit growth planning and franchise readiness |

**AI features** (require `ANTHROPIC_API_KEY`): lease analysis, menu cost calculator, site evaluation, business strategy.

---

## Deploy to Render

Connect this repo to Render — the `render.yaml` at the root handles both services.

**Backend env vars:**
```
MONGO_URL=mongodb+srv://...
ANTHROPIC_API_KEY=sk-ant-...       # required for AI modules
STRIPE_API_KEY=sk_live_...          # required for subscriptions
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend env vars:**
```
REACT_APP_BACKEND_URL=https://restaurant-pro-api.onrender.com
```

---

## Run Locally

```bash
# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn server:app --reload

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm start
```

---

## Tech Stack

- **Backend**: FastAPI, Motor (async MongoDB), Anthropic Claude, Stripe native SDK
- **Frontend**: React 18, CRACO, Tailwind CSS, Radix UI
- **Auth**: Email + password (SHA256, session-token cookie, MongoDB sessions)
- **Payments**: Stripe Checkout + webhook subscription lifecycle
- **Deploy**: Render (Python web service + static site)

---

## License

Proprietary — All Rights Reserved © Blue Collar Apps
