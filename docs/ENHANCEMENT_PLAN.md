# SAT7 GATE – Enterprise Enhancement Plan

## Current State
- Next.js 16 + React 19 + TypeScript + Tailwind v4 + Supabase + Vercel
- Working auth, dashboard, register-entry, live-gate, employees, companies, users, reports
- RLS in place; admin-only user/company creation enforced via API routes

## Phase 1 — Hardening & Core UX
1. Shared permission middleware/helper for all API routes
2. Fix client/server auth consistency
3. Add missing person categories: contractor, supplier, delivery, rental_company
4. Improve empty states, loading, and error UX across pages
5. Add audit logging for sensitive actions

## Phase 2 — Advanced Visitor & Access Control
1. Visitor types and pass workflows
2. QR pass generation and validation
3. Scheduled visits and recurring access
4. Deny/unapproved visitor handling

## Phase 3 — Vehicle & LPR
1. Enhanced vehicle registry and history
2. LPR event ingestion and matching
3. Parking allocation and occupancy

## Phase 4 — Notifications & Reporting
1. Email notifications for approvals/denials
2. Advanced analytics and exports
3. Incident reporting and audit trails

## Phase 5 — Hardware & Integrations
1. Barrier/gate controller integration stubs
2. Camera/LPR provider adapters
3. Access control system sync

## Execution Order
- Start with Phase 1, items 1–3
- Deliver small deployable increments
- Keep existing routes working; extend rather than replace
