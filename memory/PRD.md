# Restaurateur Pro - Product Requirements Document

## Overview
Restaurateur Pro is a comprehensive Restaurant SaaS platform designed to help entrepreneurs design, build, and scale their restaurant concepts. Features AI-powered suite (GPT-5.2), Google authentication, Stripe subscriptions, and an interactive dashboard with 6 operational modules.

## Core User Personas
1. **First-time Restaurateurs** - Need guidance from concept to opening
2. **Multi-unit Operators** - Expanding existing concepts
3. **Franchise Developers** - Scaling with replicable systems

## What's Been Implemented (March 2026)

### Phase 1 - Foundation ✅
- [x] FastAPI backend with MongoDB
- [x] React/Tailwind frontend with Shadcn UI
- [x] Emergent Google Auth integration
- [x] 6 dashboard modules created
- [x] Stripe subscriptions ($14 Single / $18 Multi-Unit)
- [x] Landing page with OG tags

### Phase 2 - Business Profile Integration ✅
- [x] BusinessProfileContext - centralized state management
- [x] 7-step onboarding questionnaire (Concept, Location, Financial, Operational, Menu, Team, Branding)
- [x] BusinessProfile page (Master Control Center)
- [x] All 6 modules updated to use profile prop

### Phase 3 - Enhanced UX ✅ (Today)
- [x] **Quick Setup Wizard** - Auto-generates tailored sample data based on concept type (fine_dining, casual, fast_casual)
  - Creates: team members, equipment, vendors, permits, menu items, budget items
- [x] **Add Task Dialog** - Functional form with title, status, priority, due date
- [x] **Add Team Member Dialog** - Form with name, role, email fields
- [x] **Empty States** - Clean UI when no data exists instead of placeholder data
- [x] **InlineEdit Component** - Reusable inline editing component
- [x] **Mobile Responsiveness** - CSS improvements for smaller screens
- [x] **Removed all placeholder/mock data** - Modules show only real data

## Dashboard Modules

1. **Command Center** - Project overview, phase tracking, tasks, budget, team
2. **Site Strategist** - Location analysis, demographics, AI lease analysis
3. **Ground Up** - Floor plans, permits, equipment planning
4. **Ops Launchpad** - Hiring, menu engineering, AI cost calculator, supply chain
5. **Expansion Toolkit** - Multi-unit dashboard, franchise scoring
6. **Lease Negotiation** - Clause tracking, AI analyzer

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, React Context
- **Backend:** FastAPI, MongoDB (Motor)
- **Auth:** Emergent Google OAuth
- **Payments:** Stripe
- **AI:** GPT-5.2 via Emergent LLM Key

## API Endpoints
- `/api/auth/google/*` - Authentication
- `/api/profile` - GET/PUT business profile
- `/api/profile/summary` - Dashboard summary
- `/api/tasks` - GET/POST tasks
- `/api/team` - GET/POST team members
- `/api/equipment` - GET/POST equipment
- `/api/vendors` - GET/POST vendors
- `/api/permits` - GET/POST permits
- `/api/menu-items` - GET/POST menu items
- `/api/budget` - GET/POST budget items
- `/api/subscriptions/*` - Stripe integration
- `/api/ai/analyze` - GPT-5.2 analysis

## Prioritized Backlog

### P0 (Critical)
- [ ] Task CRUD (update, delete, mark complete)
- [ ] Team member CRUD (update, delete)

### P1 (High Priority)
- [ ] Inline editing in all modules (not just profile page)
- [ ] AI-generated onboarding suggestions
- [ ] Financial report generation

### P2 (Medium Priority)
- [ ] Export business profile as PDF
- [ ] Email notifications for deadlines
- [ ] Task assignment to team members

### Future
- [ ] Multi-location comparison dashboard
- [ ] Financial projections module
- [ ] Vendor marketplace integration
- [ ] Mobile app version

## Test Results
- Backend: 100% pass rate
- Frontend: 100% pass rate
- Test reports: `/app/test_reports/iteration_3.json`
