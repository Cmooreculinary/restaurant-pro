# Restaurateur Pro - Product Requirements Document

## Overview
Restaurateur Pro is a comprehensive Restaurant SaaS platform designed to help entrepreneurs design, build, and scale their restaurant concepts. Features AI-powered suite (GPT-5.2), Google authentication, Stripe subscriptions, and an interactive dashboard with 6 operational modules.

## What's Been Implemented (March 2026)

### Phase 1 - Foundation ✅
- [x] FastAPI backend with MongoDB
- [x] React/Tailwind frontend with Shadcn UI
- [x] Emergent Google Auth integration
- [x] 6 dashboard modules
- [x] Stripe subscriptions ($14 Single / $18 Multi-Unit)
- [x] Landing page with OG tags

### Phase 2 - Business Profile Integration ✅
- [x] BusinessProfileContext - centralized state management
- [x] 7-step onboarding questionnaire
- [x] BusinessProfile page (Master Control Center)
- [x] All 6 modules consume profile data

### Phase 3 - Enhanced UX ✅
- [x] Quick Setup Wizard - generates tailored sample data
- [x] Add Task/Team Dialogs
- [x] Empty States - clean UI when no data
- [x] InlineEdit Component
- [x] Mobile Responsive CSS

### Phase 4 - Admin & CRUD ✅ (Today)
- [x] **Secret Admin Login** - 14-day expiry, code: `restaurateur2026`
- [x] **Task CRUD** - Create, Read, Update, Delete with dialogs
- [x] **Team CRUD** - Create, Read, Update, Delete with dialogs
- [x] **Task Completion** - Click checkbox to mark complete/reopen
- [x] **Edit/Delete Dropdowns** - Appear on hover for tasks and team
- [x] **Edit Dialogs** - Pre-filled forms for updating tasks/team

## Authentication

### Google OAuth (Standard Users)
- Via Emergent Auth
- 7-day session expiry

### Secret Admin Access
- Endpoint: `POST /api/auth/secret`
- Code: `restaurateur2026`
- Creates: `admin@restaurateurpro.com`
- Session: 14 days
- UI: Click "Admin Access" on landing page

## Dashboard Modules
1. **Command Center** - Tasks, budget, team with full CRUD
2. **Site Strategist** - Location analysis, AI lease analysis
3. **Ground Up** - Floor plans, permits, equipment
4. **Ops Launchpad** - Hiring, menu engineering, supply chain
5. **Expansion Toolkit** - Multi-unit dashboard
6. **Lease Negotiation** - Clause tracking, AI analyzer

## API Endpoints

### Auth
- `POST /api/auth/secret` - Secret admin login
- `POST /api/auth/session` - Google OAuth exchange
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Team
- `GET /api/team` - List team members
- `POST /api/team` - Create member
- `PUT /api/team/{id}` - Update member
- `DELETE /api/team/{id}` - Delete member

### Other
- `/api/profile` - Business profile CRUD
- `/api/equipment`, `/api/vendors`, `/api/permits`, `/api/menu-items`, `/api/budget` - Resource CRUD
- `/api/subscriptions/*` - Stripe integration
- `/api/ai/analyze` - GPT-5.2 analysis

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, MongoDB (Motor)
- **Auth:** Emergent Google OAuth + Secret Login
- **Payments:** Stripe
- **AI:** GPT-5.2 via Emergent LLM Key

## Test Results
- Backend: 100% pass rate
- Frontend: 100% pass rate
- Test reports: `/app/test_reports/iteration_4.json`

## Prioritized Backlog

### P1 (High Priority)
- [ ] Equipment/Vendor/Permit CRUD in GroundUp module
- [ ] Menu item CRUD in OpsLaunchpad
- [ ] Financial report generation

### P2 (Medium Priority)
- [ ] AI-generated onboarding suggestions
- [ ] Export business profile as PDF
- [ ] Task assignment to team members

### Future
- [ ] Multi-location comparison dashboard
- [ ] Financial projections module
- [ ] Vendor marketplace integration
