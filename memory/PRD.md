# Restaurateur Pro - Product Requirements Document

## Overview
Restaurateur Pro is a comprehensive Restaurant SaaS platform designed to help entrepreneurs design, build, and scale their restaurant concepts.

## What's Been Implemented (March 2026)

### Authentication ✅
- **Email/Password Login** - Simple registration and login
- Removed Google OAuth (per user request)

### Core Features ✅
- 7-step onboarding questionnaire
- 6 dashboard modules (Command Center, Site Strategist, Ground Up, Ops Launchpad, Expansion Toolkit, Lease Negotiation)
- Stripe subscriptions ($14 Single / $18 Multi-Unit)
- Quick Setup Wizard
- Full Task/Team CRUD

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account (email, password, name)
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout

### Resources
- `/api/tasks` - CRUD
- `/api/team` - CRUD
- `/api/profile` - Business profile
- `/api/equipment`, `/api/vendors`, `/api/permits`, `/api/menu-items`, `/api/budget`
- `/api/subscriptions/*` - Stripe

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, MongoDB
- **Auth:** Email/Password + Secret Admin
- **Payments:** Stripe
- **AI:** Provider-configured language model via server-side environment key

## Test Credentials
- Email: test@example.com, Password: test123

## Backlog

### P1
- Equipment/Vendor/Permit CRUD in modules
- Menu item CRUD
- Financial report generation

### P2
- AI-generated suggestions
- Export profile as PDF
- Task assignment
