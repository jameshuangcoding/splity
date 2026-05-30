# Splity — Post-MVP Roadmap

Work intentionally deferred until **after** the MVP ships. The MVP scope lives in `CHECKLIST.md`; known limitations in shipped code live in `KNOWN_ISSUES.md`.

---

## Accounts, History & Persistence

> Deferred from the MVP (was "Phase 9 — Persistence"). These items only pay off together — persistence with no reader, and accounts with nothing gated on them, deliver no user-facing value alone. Pick them up as one epic.

**Why deferred:** In the MVP nothing consumes a saved bill — there's no check history, no "my bills" list, and no share links (all post-MVP). The end-to-end flow (Home → Send → CSV export → new bill) is complete without persistence, and CSV export already covers record-keeping for a no-account tool. The Phase 1 API stubs (`POST /api/bills`, `GET /api/bills/[id]`) remain as tested scaffolding to build on.

- [ ] `POST /api/bills` — saves bill (receipt + items + people + assignments) via Prisma → Supabase
- [ ] `GET /api/bills/[id]` — retrieves a saved bill by ID
- [ ] Trigger `POST /api/bills` on transition from Summary → Send (handle save failure gracefully — don't block the UI)
- [ ] Store returned bill `id` in Zustand (for share links)
- [ ] Auth: `/login` and `/signup` functional via Supabase Auth; sessions persist
- [ ] Link saved bills to the authenticated user (account-linking is a data migration on existing saved bills)
- [ ] Check history / "my bills" list UI — the reader that gives persistence its purpose
- [ ] Share links for a bill (depends on bill `id` + retrieval)
- [ ] **Tests:** full save payload; retrieval; save-on-transition; failure handling; auth flow; 80%+ coverage

---

## Cross-platform Venmo deep link

> See `KNOWN_ISSUES.md` for the full breakdown. The MVP Venmo button works reliably only on iOS with the app installed.

- [ ] iOS → navigate with `window.location.href = url` instead of `window.open`
- [ ] Android → `intent://paycharge?...#Intent;scheme=venmo;package=com.venmo;S.browser_fallback_url=…;end`
- [ ] Desktop → detect and skip the scheme; degrade to Copy (or open `https://venmo.com`)
- [ ] Prefill `recipients=` once Venmo handles are captured per person
