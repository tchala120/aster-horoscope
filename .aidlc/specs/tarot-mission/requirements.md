# Requirements — tarot-mission

## Summary
- **Total stories**: 17 (16 MVP + 1 deferred) across 7 functional areas
- **Priority distribution**: 13 High, 2 Medium, 1 Low, 1 Deferred
- **User types**: Seeker — **account-based (login required)**; all state persists server-side via the API
- **Key entities**: Seeker (account), Daily State, Tarot Card, Spread, Mission (from Aster feature catalog), Reward (Aster reward type), Share Event
- **Integrations**: Existing Aster platform reward catalog (display-only reference), Aster feature set (mission source), native share / social share targets
- **PIVOT NOTE (supersedes D1-2 / localStorage decisions)**: localStorage is **removed**. Persistence is **server-side via the Server (API & Auth) unit**; identity is **username/password auth (login required)** — no anonymous guest play. Server state is authoritative (anti-abuse). US-017 is no longer deferred — it is folded into the core server model. MVP persistence uses an in-memory repository behind the API pending the Prisma/Postgres adapter.
- **Core flows**:
  1. Seeker opens app → sees today's spread (or locked state if already drawn)
  2. Seeker picks a card → gets a difficulty-tiered mission → accepts or rejects (re-pick from same spread)
  3. Seeker completes mission (self-attested within the time window) → reveal
  4. Reveal rolls a probabilistic reward (gain / no gain); if gained, a random reward type is shown
  5. Seeker shares the result → earns a capped share bonus

## Scope Notes (from D1)
- **Identity & persistence (REVISED)**: **Login required** (username/password). All mechanical state is persisted **server-side** and served via the API; the **server is the single source of truth** (authoritative daily-limit, draw, and mission lifecycle). No localStorage, no guest play. See US-001, US-002, US-017.
- **Reward semantics**: Reward is probabilistic (gain or no gain) and, when gained, a random reward **type** drawn from the existing Aster catalog: **ASTR** (token), **Discount**, **Physical coupon**, **Artwork** (NFT / ASA / AAB). These reward types are already implemented on the Aster platform; this app only **displays** the granted result. Minting, crediting, and fulfillment are out of scope.
- **Difficulty**: Easy / Medium / Hard set only the mission's time window (Easy = within 1 day, Medium = 2-3 days, Hard = 1 week). Difficulty does NOT affect reward.
- **Mission catalog**: Static curated catalog derived from existing Aster features (see "Mission Catalog" section). Difficulty tiers are assigned per feature.

---

## Functional Area 1: Identity & Daily State

### US-001: Account-based access (login required)
- **As a** Seeker, **I want** to register and log in, **so that** my progress is saved to my account.
- **Priority**: High
- **Source**: D1-2 (revised — pivot to server + auth)
- **Acceptance Criteria**:
  - WHEN a visitor registers with a username and password, THEN the system shall create an account (password hashed) and establish an authenticated session.
  - WHEN a Seeker logs in with valid credentials, THEN the system shall establish a session (httpOnly cookie); IF credentials are invalid, THEN the system shall reject with an auth error.
  - WHILE unauthenticated, IF a Seeker requests any game action (state, draw, mission), THEN the system shall respond 401 and the UI shall prompt login.
  - The system shall NOT use browser localStorage for game state; all state is server-side.
  - The system shall NOT maintain a persistent reward wallet; reward outcomes are displayed only (crediting handled externally).

### US-002: Server-authoritative daily state and reset
- **As a** Seeker, **I want** my daily availability to reset each day, **so that** I get a fresh draw.
- **Priority**: High
- **Source**: D1-5, D1-11
- **Acceptance Criteria**:
  - The system shall persist each Seeker's daily state (last draw date, spread, active mission + deadline, last completion date, last share-bonus date) server-side, keyed to their account.
  - The system shall determine draw availability from the **server clock** and persisted state (server-authoritative); the client shall not be trusted for the daily limit.
  - WHEN a new day boundary is reached (app-wide fixed timezone, UTC) AND the Seeker has no active mission, THEN the API shall make a new draw available.
  - WHEN a Seeker completes a mission, THEN the server shall persist the completion date against the account.

### US-017: Server persistence of progress (folded into MVP)
- **As a** Seeker, **I want** my progress saved to my account, **so that** it persists across devices and sessions.
- **Priority**: High (no longer deferred — this is now the core persistence model).
- **Source**: D1-2 (revised)
- **Acceptance Criteria**:
  - WHEN a Seeker's state changes (draw, pick, accept/reject, completion), THEN the system shall persist it server-side against their account.
  - WHEN a Seeker signs in on any device, THEN the system shall load their current state from the server.
  - The persistence layer shall be behind a repository interface (in-memory now; Prisma/PostgreSQL adapter later) so the storage backend can change without affecting the API contract.

---

## Functional Area 2: Daily Draw

### US-003: Generate daily spread
- **As a** Seeker, **I want** to see a spread of random tarot cards once per day, **so that** I can choose one.
- **Priority**: High
- **Source**: D1-5
- **Acceptance Criteria**:
  - WHEN a Seeker with no active mission requests today's draw and has not drawn today, THEN the system shall generate a spread of 10 randomly selected tarot cards and record the draw as used for the day.
  - WHILE a spread exists for the current day, IF the Seeker reloads or returns, THEN the system shall display the same spread (cards are not re-randomized within the same day).
  - The system shall present card backs (face-down) until a card is picked.

### US-004: Enforce one draw per day
- **As a** Seeker, **I want** to be limited to one draw per day, **so that** the ritual stays meaningful.
- **Priority**: High
- **Source**: D1-5, D1-11
- **Acceptance Criteria**:
  - IF a Seeker has already generated a spread today, THEN the system shall not generate a new spread until the next day boundary, ELSE it shall allow a new draw.
  - WHILE the daily draw is used, IF the Seeker requests a new spread, THEN the system shall display a "come back tomorrow" locked state with the time until the next draw.

### US-005: Draw availability blocked by active mission
- **As a** Seeker, **I want** to focus on one mission, **so that** I'm not overwhelmed.
- **Priority**: High
- **Source**: D1-6
- **Acceptance Criteria**:
  - WHILE a Seeker has an active (accepted, not completed, not expired) mission, IF they request a new draw, THEN the system shall block the draw and show the active mission instead.
  - WHEN an active mission is completed or expires, THEN the system shall allow a new draw on the next available draw day.

---

## Functional Area 3: Card Pick & Mission Assignment

### US-006: Pick a card
- **As a** Seeker, **I want** to pick one card from the spread, **so that** I receive a mission.
- **Priority**: High
- **Source**: D1-5
- **Acceptance Criteria**:
  - WHEN a Seeker selects one card from the spread, THEN the system shall reveal that card and assign a mission associated with it.
  - IF a Seeker attempts to pick more than one card from the same spread simultaneously, THEN the system shall accept only the first pick.

### US-007: Assign difficulty-tiered mission
- **As a** Seeker, **I want** the picked card to give me a mission with a clear difficulty and deadline, **so that** I know what to do and by when.
- **Priority**: High
- **Source**: D1-3, difficulty definition
- **Acceptance Criteria**:
  - WHEN a card is picked, THEN the system shall assign a mission from the curated catalog with a difficulty of Easy, Medium, or Hard.
  - WHEN a mission is assigned, THEN the system shall display the mission description, its difficulty, and the time window (Easy = within 1 day, Medium = 2-3 days, Hard = 1 week).
  - The system shall tie each mission to a feature of the existing Aster platform as defined in the Mission Catalog section, using that feature's assigned difficulty tier.

---

## Functional Area 4: Mission Lifecycle (Accept / Reject / Expiry)

### US-008: Accept a mission
- **As a** Seeker, **I want** to accept the assigned mission, **so that** I can start working on it.
- **Priority**: High
- **Source**: D1-5, D1-6
- **Acceptance Criteria**:
  - WHEN a Seeker accepts a mission, THEN the system shall mark it active, start its deadline timer based on difficulty, and set it as the Seeker's single active mission.
  - WHILE a mission is active, the system shall display the remaining time until the deadline.

### US-009: Reject and re-pick from the same spread
- **As a** Seeker, **I want** to reject a mission and pick a different card, **so that** I can get a mission I prefer.
- **Priority**: High
- **Source**: D1-5
- **Acceptance Criteria**:
  - WHEN a Seeker rejects an assigned (not yet accepted) mission, THEN the system shall return them to the SAME spread with the remaining unpicked cards available.
  - IF all cards in the spread have been rejected, THEN the system shall present a locked "come back tomorrow" state, ELSE it shall allow picking a remaining card.
  - The system shall not generate a new spread as a result of rejection.

### US-010: Mission expiry
- **As a** Seeker, **I want** clear handling when I miss a deadline, **so that** I understand the outcome.
- **Priority**: High
- **Source**: D1-7
- **Acceptance Criteria**:
  - WHEN an active mission's deadline passes without completion, THEN the system shall mark it expired and grant no reward.
  - WHEN a mission expires, THEN the system shall allow the Seeker to draw again on the next available draw day.

---

## Functional Area 5: Mission Completion & Reveal

### US-011: Self-attested completion
- **As a** Seeker, **I want** to mark my mission as done, **so that** I can reveal my result.
- **Priority**: High
- **Source**: D1-4
- **Acceptance Criteria**:
  - WHILE a mission is active and within its time window, WHEN the Seeker taps "I did it", THEN the system shall mark the mission completed and proceed to reveal.

### US-012: Reveal tarot result
- **As a** Seeker, **I want** to see my tarot result after completing the mission, **so that** I enjoy the payoff.
- **Priority**: High
- **Source**: original concept
- **Acceptance Criteria**:
  - WHEN a mission is completed, THEN the system shall reveal the tarot result for the picked card, including its artwork and meaning.
  - The system shall present the reveal before showing any reward outcome.

---

## Functional Area 6: Reward Engine

### US-013: Probabilistic random reward
- **As a** Seeker, **I want** a chance at a reward when I complete a mission, **so that** completion feels rewarding.
- **Priority**: High
- **Source**: D1-1, D1-8, D1-9
- **Acceptance Criteria**:
  - WHEN a reveal occurs, THEN the system shall perform a reward roll that results in either "gain" or "no gain" based on a configured probability.
  - IF the roll results in "gain", THEN the system shall select a random reward type from the existing Aster catalog (ASTR, Discount, Physical coupon, Artwork [NFT/ASA/AAB]) and display it, ELSE it shall display a "no reward this time" outcome.
  - The system shall determine the reward independently of mission difficulty.
  - The system shall record the reward outcome against the Seeker's session for that mission.

### US-014: Display-only reward result
- **As a** Seeker, **I want** to see which reward I earned, **so that** I know what I got.
- **Priority**: Medium
- **Source**: D1-8
- **Acceptance Criteria**:
  - WHEN a reward is granted, THEN the system shall display the reward type (ASTR, Discount, Physical coupon, or Artwork) and its visual representation referencing the Aster reward catalog.
  - The system shall treat reward minting, crediting, and fulfillment as external (out of scope); it shall only display the outcome.
  - IF the reward catalog reference for a granted type is unavailable, THEN the system shall display a generic reward confirmation, ELSE it shall display the specific reward visual.

---

## Functional Area 7: Sharing & Share Bonus

### US-015: Share result for a bonus (Optional)
- **As a** Seeker, **I want** to share my tarot result, **so that** I can earn a bonus reward.
- **Priority**: Medium
- **Source**: D1-10, D1-11
- **Acceptance Criteria**:
  - WHERE sharing is available, WHEN a Seeker shares their result via a shareable link/image or the native share sheet, THEN the system shall record a share event and grant a share bonus reward.
  - IF a Seeker has already earned a share bonus today, THEN the system shall not grant another share bonus that day, ELSE it shall grant it (cap: once per day).
  - The system shall generate a shareable artifact (link and/or image) representing the tarot result.

### US-016: Shareable artifact content (Optional)
- **As a** Seeker, **I want** my shared result to look good, **so that** it's appealing to others.
- **Priority**: Low
- **Source**: D1-10
- **Acceptance Criteria**:
  - WHEN a shareable artifact is generated, THEN the system shall include the tarot card, its meaning, and product attribution.
  - The system shall not include the Seeker's personal identifiers in the shareable artifact (anonymous).

---

## Mission Catalog (from Aster features)

Each mission maps to an existing Aster feature. Difficulty sets only the time window (Easy = within 1 day, Medium = 2-3 days, Hard = 1 week). **Proposed tiers below — adjust as needed.**

| # | Aster Feature | Mission Action | Proposed Difficulty | Notes |
|---|---------------|----------------|---------------------|-------|
| 1 | Active Participant | Attend a knowledge-sharing session | Easy | Single-day attendance |
| 2 | Daily Engagement | Attend the daily jogging feature | Easy | Same-day activity |
| 3 | Helpful Reviewer | Submit feedback for a knowledge-sharing session | Easy | Quick action |
| 4 | Survey Champion | Submit a survey | Easy | Quick action |
| 5 | Marketplace Trader | Buy a product on the marketplace | Easy | Depends on availability |
| 6 | Teaching Assistant | Be a TA for a knowledge-sharing session | Medium | Requires a scheduled session |
| 7 | Weekly Contribution | Answer the weekly quiz (Friday) | Medium | Tied to weekly cadence |
| 8 | Marketplace Poster | Sell a product on the marketplace | Medium | Listing + effort |
| 9 | Expert Speaker | Become a speaker of a knowledge-sharing session | Hard | Requires prep + scheduling |
| 10 | Asset Collector | Hold assets (NFT / ASA / AAB) in wallet | Hard | Acquisition may take time |

**Catalog size**: 10 missions (5 Easy / 3 Medium / 2 Hard). The **Lot of Luck** feature (both Participant and Winner missions) was removed per user decision.

## Story Summary

| ID | Title | Area | Priority | Dependencies |
|----|-------|------|----------|--------------|
| US-001 | Anonymous session identity | Identity & Daily State | High | — |
| US-002 | Daily state persistence and reset | Identity & Daily State | High | US-001 |
| US-017 | Authenticated cloud sync (deferred, post-MVP) | Identity & Daily State | Deferred | US-001, US-002 |
| US-003 | Generate daily spread | Daily Draw | High | US-001, US-002 |
| US-004 | Enforce one draw per day | Daily Draw | High | US-003 |
| US-005 | Draw blocked by active mission | Daily Draw | High | US-003, US-008 |
| US-006 | Pick a card | Card Pick & Mission | High | US-003 |
| US-007 | Assign difficulty-tiered mission | Card Pick & Mission | High | US-006 |
| US-008 | Accept a mission | Mission Lifecycle | High | US-007 |
| US-009 | Reject and re-pick same spread | Mission Lifecycle | High | US-007 |
| US-010 | Mission expiry | Mission Lifecycle | High | US-008 |
| US-011 | Self-attested completion | Completion & Reveal | High | US-008 |
| US-012 | Reveal tarot result | Completion & Reveal | High | US-011 |
| US-013 | Probabilistic random reward | Reward Engine | High | US-012 |
| US-014 | Display-only reward result | Reward Engine | Medium | US-013 |
| US-015 | Share result for a bonus (Optional / post-MVP) | Sharing & Share Bonus | Medium | US-012, US-013 |
| US-016 | Shareable artifact content (Optional / post-MVP) | Sharing & Share Bonus | Low | US-015 |

## Non-functional Notes (cross-cutting; detailed in NFR phase)
- **Responsive design**: Full mobile/tablet/desktop support; touch-friendly card interactions.
- **Security / anti-abuse**: localStorage-first means guest state is client-controlled and can be reset (known, accepted limitation). Authenticated Seekers get server-side enforcement via API sync (source of truth). Reward rolls and share-bonus caps (once/day) should be validated server-side for authenticated users. Guests are best-effort.
- **Performance**: Fast draw/reveal interactions; snappy animations for card flip and reveal.
- **Accessibility**: Keyboard navigable card selection; sufficient contrast; alt text for tarot artwork.
- **Reliability**: Daily state and active-mission timers must survive reloads and reconnects.
- **Privacy**: Anonymous by default; no PII in shareable artifacts.

## External References
| Source | Stories derived | What was used |
|--------|-----------------|---------------|
| Aster reward catalog (ASTR, Discount, Physical coupon, Artwork) | US-013, US-014 | Reward type names for display-only outcomes |
| Native share / social targets | US-015, US-016 | Share mechanism and artifact generation |
| Aster feature set (12 features) | US-007, Mission Catalog | Basis for the mission catalog and difficulty tiers |

## List existing Aster features on our platform

1. "Expert Speaker" - Become a speaker of knowledge sharing session
2. "Teaching Assistant" - Become a TA of knowledge sharing session
3. "Active Participant" - Attend to knowledge sharing session
4. "Daily Engagement" - Attend to daily jogging feature
5. "Weekly Contribution" - Answer weekly quiz on Friday
6. "Helpful Reviewer" - Submit feedback of knowledge sharing session
7. "Survey Champion" - Submit survey
8. "Marketplace Poster" - Sell a product on marketplace
9. "Marketplace Trader" - Buy products on marketplace
10. "Asset Collector" - Holding assets (NFT, ASA (Arise Soul Accessory), AAB (Arise Achievement Badge)) in wallet address

> Removed from the mission catalog per decision: "Lot of Luck Participant" and "Lot of Luck Winner" (the Lot of Luck feature).

## List existing Aster reward types

1. ASTR - Token-based for aster
2. Discount - Use on reward redemption feature
3. Physical coupon - Starbuck card, Central voucher
4. Artwork - NFT, ASA, AAB
