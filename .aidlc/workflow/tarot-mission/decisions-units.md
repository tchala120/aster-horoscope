# Decomposition Decisions (D2)

## Context Summary
- **Product**: Daily tarot-mission web app over the Aster platform. Guest/localStorage-first (MVP). Draw once/day → pick card → difficulty-tiered mission → accept/reject → self-attested completion → reveal → probabilistic random reward → optional share for bonus.
- **Type**: Greenfield, production-ready, responsive web app. Small team (2-3).
- **Requirements**: 16 MVP stories across 7 functional areas (US-017 auth sync deferred; sharing optional/post-MVP).
- **Reward types (display-only)**: ASTR, Discount, Physical coupon, Artwork (NFT/ASA/AAB).
- **Mission catalog**: 10 Aster features (5 Easy / 3 Medium / 2 Hard).
- **Note**: Context phase recommended a single design pass (Units = No); you chose to decompose. This gate proposes a lightweight decomposition that keeps everything in one deployable app.

---

## Decision Questions

### D2-1: Architecture Pattern
**Question**: What overall architecture should the units live in?
- 1) **Modular Monolith** — one deployable web app, internal modules with clear boundaries **(Recommended)**
- 2) Microservices — separately deployable services
- 3) Distributed — multiple apps/services across boundaries
- 4) Single Unit — no decomposition (revert to single design pass)

**Answer**: 1

---

### D2-2: Decomposition Strategy
**Question**: How should stories be grouped into units?
- 1) **Domain-Driven** — group by business domain (Session/Draw, Mission, Reward, Sharing) **(Recommended)**
- 2) User Journey-Based — group by the end-to-end flow steps
- 3) Layer-Based — group by technical layer (UI, logic, data)
- 4) Hybrid — combine strategies

**Answer**: 1

---

### D2-3: Proposed Units
**Question**: Do these proposed units and story assignments look right? (See the Unit Proposal table below.)
- 1) **Accept as proposed** — 4 units (Sharing deferred as optional) **(Recommended)**
- 2) Merge Reveal & Reward into a single unit with Sharing (3 units)
- 3) Fewer units — combine Session/Draw + Mission (2 units)
- 4) Custom (describe changes): _______

**Answer**: 1

---

### D2-4: Shared Kernel / Foundation
**Question**: Several units share the same core entities (SeekerState, Card, Mission, Reward) and the localStorage layer. Extract a shared foundation?
- 1) **Yes — foundation module** with shared domain types, localStorage persistence layer, mission-catalog data, tarot deck data, and the responsive UI shell/design system **(Recommended)**
- 2) No — let one unit own shared types and others import from it
- 3) No shared kernel — duplicate as needed

**Answer**: 1

---

### D2-5: Unit Interaction Style
**Question**: How do units interact at runtime?
- 1) **In-process** — direct function/module calls over a shared state module (fits modular monolith) **(Recommended)**
- 2) Event-driven — units publish/subscribe to domain events
- 3) API calls between units

**Answer**: 1

---

### D2-6: Development Sequence
**Question**: What build order do you want?
- 1) **Foundation → U1 Session/Draw → U2 Mission → U3 Reveal/Reward → U4 Sharing** (dependency order) **(Recommended)**
- 2) Vertical slice first (thin end-to-end), then flesh out each unit
- 3) Custom order: _______

**Answer**: 1

---

### D2-7: Sharing Unit (U4) Timing
**Question**: Sharing (US-015/US-016) is optional/post-MVP. When should U4 be built?
- 1) **Defer U4 to after MVP** — build Foundation + U1-U3 for MVP **(Recommended)**
- 2) Include U4 in the initial build
- 3) Drop sharing entirely

**Answer**: 1

---

## Unit Proposal (reference for D2-3)

| Unit | Name | Stories | Count | Depends On | MVP? |
|------|------|---------|-------|------------|------|
| **Foundation** | Shared core & UI shell | Shared types, localStorage layer, mission catalog data, tarot deck data, responsive design system | — | — | Yes |
| **U1** | Session & Daily Draw | US-001, US-002, US-003, US-004, US-005 | 5 | Foundation | Yes |
| **U2** | Mission Lifecycle | US-006, US-007, US-008, US-009, US-010, US-011 | 6 | U1 | Yes |
| **U3** | Reveal & Reward | US-012, US-013, US-014 | 3 | U2 | Yes |
| **U4** | Sharing & Share Bonus | US-015, US-016 | 2 | U3 | No (optional/post-MVP) |
| _deferred_ | Authenticated cloud sync | US-017 | 1 | U1, U2 | No (deferred) |

**Dependency graph** (linear, no cycles):
`Foundation → U1 → U2 → U3 → U4`

---

## Decisions Summary
- D2-1 Architecture Pattern: Modular Monolith (one deployable responsive web app, internal modules).
- D2-2 Decomposition Strategy: Domain-Driven.
- D2-3 Proposed Units: Accept as proposed — 4 domain units + shared Foundation; Sharing deferred as optional.
- D2-4 Shared Kernel / Foundation: Yes — Foundation module (shared domain types, localStorage persistence/state layer, mission-catalog data, tarot deck data, responsive UI shell/design system).
- D2-5 Unit Interaction Style: In-process — direct module calls over a shared state module.
- D2-6 Development Sequence: Foundation → U1 Session & Daily Draw → U2 Mission Lifecycle → U3 Reveal & Reward → U4 Sharing.
- D2-7 Sharing Unit Timing: Defer U4 to after MVP (build Foundation + U1-U3 for MVP).

---

**Instructions**: Fill in your answers above and respond with "done"
