# ShadiSphere — Premium Pakistani Wedding Venue & Booking Demo

A client-facing sales demo for the Pakistani marriage hall / marquee / banquet / lawn industry.
**Demo only** — no production backend, payments, or real reservations. All venues, prices,
availability, bookings and testimonials are fictional sample data.

## Run locally

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # production build into dist/
```

## What is inside

- **Customer site**: Home, Venues (+ filters & detail pages), Menus & Packages, Smart Cost
  Calculator, Availability Calendar, Date Finder (10-day forward search + multi-event planner),
  Quotation & WhatsApp inquiry, About.
- **Owner dashboard** (`#/dashboard`): KPI overview, venue editing, menu/package price editing,
  booking management (conflict-safe), inquiry pipeline, configurable promotions, demo reset.
- **One shared demo state** (`src/state/store.tsx`) persisted to localStorage — edits in the
  dashboard update the customer site instantly; "Reset demo data" restores the seed.
- **Engines**: `src/lib/calc.ts` (deterministic pricing, no double-charging, 15% discount cap),
  `src/lib/availability.ts` (slot statuses from demo bookings only),
  `src/lib/recommend.ts` (rule-based date/venue recommendations).

## Demo notes for presenters

- Availability calendar is labeled *"Demo availability — not a live reservation system."*
- WhatsApp handoff opens `wa.me` with a prefilled message; set the demo number in
  Dashboard → Settings (defaults to empty — the app will tell you).
- Print-friendly quotation via the browser print dialog (PDF via "Save as PDF").
