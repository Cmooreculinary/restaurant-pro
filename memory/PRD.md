# Restaurateur Pro - Product Requirements Document

## Overview
Restaurateur Pro is a comprehensive Restaurant SaaS platform designed to help entrepreneurs design, build, and scale their restaurant concepts. It features an AI-powered suite (GPT-5.2), Google authentication, Stripe subscriptions, and an interactive dashboard with 6 operational modules.

## Core User Personas
1. **First-time Restaurateurs** - Need guidance through the entire process from concept to opening
2. **Multi-unit Operators** - Expanding existing concepts to new locations
3. **Franchise Developers** - Scaling their brand with replicable systems

## Core Requirements

### Authentication & Onboarding
- [x] Emergent-managed Google OAuth integration
- [x] 7-step onboarding questionnaire (Concept, Location, Financial, Operational, Menu, Team, Branding)
- [x] Business Profile as single source of truth for the entire platform
- [x] Onboarding progress persistence and resume capability

### Subscription Plans
- [x] Single Unit Plan ($14/month) - 1 restaurant project, core modules
- [x] Multi-Unit Plan ($18/month) - Unlimited projects, expansion toolkit, franchise tools
- [x] Stripe integration with price IDs configured

### Dashboard Modules
All modules now consume profile data from `BusinessProfileContext`:

1. **Command Center** - [x] Project overview, phase tracking, tasks, budget health, team
2. **Site Strategist** - [x] Location analysis, demographics, AI-powered lease analysis  
3. **Ground Up** - [x] Floor plans, permit tracking, equipment planning
4. **Ops Launchpad** - [x] Hiring pipeline, menu engineering, AI cost calculator, supply chain
5. **Expansion Toolkit** - [x] Multi-unit dashboard, franchise readiness scoring, replication checklist
6. **Lease Negotiation** - [x] Clause tracking, AI clause analyzer, negotiation phase tracking

### AI Features (GPT-5.2 via Emergent LLM Key)
- [x] Lease analysis
- [x] Menu cost calculator
- [x] Site evaluation
- [x] Business consulting

## Technical Architecture

### Frontend
- React with Tailwind CSS
- Shadcn/UI components
- React Context for state management
- React Router for navigation

### Backend
- FastAPI with async/await
- MongoDB (Motor) for data persistence
- Session-based authentication with cookies
- Stripe for payments

### Key Files
- `/app/frontend/src/context/BusinessProfileContext.jsx` - Centralized profile state
- `/app/frontend/src/pages/Onboarding.jsx` - 7-step questionnaire
- `/app/frontend/src/pages/BusinessProfile.jsx` - Master control center
- `/app/frontend/src/pages/Dashboard.jsx` - Main dashboard with module tabs
- `/app/backend/server.py` - All API endpoints

## Data Models

### Business Profile
```json
{
  "profile_id": "string",
  "user_id": "string",
  "concept": { "restaurant_name", "concept_type", "cuisine_types", "tagline", "description" },
  "location": { "address", "city", "state", "square_footage", "seating_capacity" },
  "financial": { "total_budget", "target_revenue_monthly", "target_food_cost_percent" },
  "operational": { "target_open_date", "service_types", "pos_system" },
  "menu": { "price_range", "dietary_options", "beverage_program" },
  "team": { "owner_name", "key_positions_needed", "total_staff_needed" },
  "branding": { "brand_voice", "target_demographic", "target_age_range" },
  "onboarding_completed": "boolean",
  "onboarding_step": "number"
}
```

## What's Been Implemented (March 2026)

### Phase 1 - Foundation (COMPLETE)
- [x] FastAPI backend with MongoDB
- [x] React/Tailwind frontend
- [x] Emergent Google Auth integration
- [x] 6 dashboard modules created
- [x] Stripe subscriptions ($14/$18)
- [x] Landing page with OG tags

### Phase 2 - Business Profile Integration (COMPLETE)
- [x] BusinessProfileContext created
- [x] 7-step onboarding questionnaire
- [x] BusinessProfile page (Master Control Center)
- [x] All 6 modules updated to use profile prop
- [x] Backend endpoints for CRUD operations
- [x] Profile summary endpoint for dashboards

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Inline editing capabilities in dashboard modules
- [ ] QA sweep: mobile responsiveness

### P1 (High Priority)
- [ ] Remove placeholder data in modules (use empty states)
- [ ] Add "Add" buttons functionality in all modules
- [ ] Task CRUD functionality in Command Center

### P2 (Medium Priority)
- [ ] AI-generated onboarding suggestions
- [ ] Export business profile as PDF
- [ ] Email notifications

### Future
- [ ] Multi-location comparison dashboard
- [ ] Financial projections module
- [ ] Vendor marketplace integration
- [ ] Mobile app version
