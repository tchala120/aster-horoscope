# Requirements Decisions (D1)

## Context Summary
- **Product**: Daily tarot-card ritual over an existing horoscope platform. User draws a random spread once per day, picks a card, receives a difficulty-tiered mission, accepts or rejects it, completes it to reveal a tarot result, and earns a reward. Sharing the result grants bonus rewards.
- **Type**: Greenfield, production-ready, responsive web app.
- **Difficulty tiers**: Easy (within a day), Medium (2-3 days), Hard (1 week).
- **Recommendations from context**: Personas No, Units No, NFR Yes.

---

## Decision Questions

### D1-1: MVP Scope
**Question**: What is the scope for the first production release?
- 1) Core loop only — daily draw → pick → mission → accept/reject → complete → reveal → reward **(Recommended)**
- 2) Core loop + sharing with bonus rewards
- 3) Core loop + sharing + reward redemption/store
- 4) Other (please specify): _______

**Answer**: 4. Core loop only — daily draw → pick → mission → accept/reject → complete → reveal → random reward (gain or not) → random reward if user gained

---

### D1-2: User Identity & Accounts
**Question**: How are users identified so "one draw per day" and reward balances persist?
- 2) Account-based (sign up / log in), integrated with the existing platform's identity **(Recommended)**
- 1) Anonymous device/session only (no login)
- 3) Optional login — anonymous play, sign in to save progress
- 4) Other (please specify): _______

**Answer**: 3 (revised) — localStorage-first for both guest and authenticated users; authenticated users additionally sync full state to the backend API (API is source of truth on conflict). Guests are local-only.

---

### D1-3: Mission Catalog Source
**Question**: Where do the missions (tied to existing-website features) come from?
- 1) Provided as a static curated catalog we define now (list of feature-based missions) **(Recommended)**
- 2) Pulled dynamically from the existing platform via API/integration
- 3) Admin-managed catalog editable via a simple back office
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-4: Mission Completion Verification
**Question**: How is a mission marked "done"?
- 1) Self-attested — user taps "I did it" **(Recommended for MVP)**
- 2) Verified against real activity on the existing platform (event/API check)
- 3) Hybrid — self-attest now, verification added later
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-5: Daily Draw & Re-draw Rules
**Question**: How should the once-per-day rule and rejection work?
- 1) One draw per day; rejecting a mission lets you re-pick from the SAME spread, but no new spread until tomorrow **(Recommended)**
- 2) One draw per day; rejecting ends the day (must return tomorrow)
- 3) Limited re-draws per day (e.g., up to 3 spreads), then locked
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-6: Active Mission Limit
**Question**: Can a user have more than one mission active at a time (since Medium/Hard span multiple days)?
- 1) One active mission at a time — no new draw until current mission is completed or expires **(Recommended)**
- 2) One draw per day regardless, allowing multiple overlapping active missions
- 3) Other (please specify): _______

**Answer**: 1

---

### D1-7: Mission Expiry Behavior
**Question**: What happens when a mission's time window (Easy=1 day, Medium=2-3 days, Hard=1 week) elapses without completion?
- 1) Mission expires, no reward, user can draw again next day **(Recommended)**
- 2) Mission expires but grants a small consolation reward
- 3) Grace period / one-time extension allowed
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-8: Reward Model
**Question**: What do rewards represent?
- 1) Points/coins accumulated in a balance (spend later) **(Recommended)**
- 2) Badges / collectible tarot cards (achievement-based)
- 3) Real perks tied to existing platform (discounts, unlocks)
- 4) Other (please specify): _______

**Answer**: Token, Badge for Discount, Asset, NFT, Physical coupon (All of these are already implemented just want to show a result after reveal)

---

### D1-9: Reward Scaling & Share Bonus
**Question**: How do rewards scale and how does the share bonus apply?
- 1) Fixed reward per difficulty (Easy < Medium < Hard); share adds a flat percentage bonus **(Recommended)**
- 2) Fixed per difficulty; share unlocks a separate one-time bonus reward
- 3) Variable/random reward within a difficulty band; share doubles it
- 4) Other (please specify): _______

**Answer**: 4. Random, the difficulty not matter to reward.

---

### D1-10: Sharing Mechanism
**Question**: How do users share results and how is the bonus attributed?
- 1) Shareable link/image to social + native share sheet; bonus on share action **(Recommended)**
- 2) Referral-based — bonus only when a friend opens the shared link / signs up
- 3) Both — bonus on share, extra bonus on referral conversion
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-11: Anti-Abuse Priority
**Question**: How strict should protection be against gaming the daily limit and share rewards?
- 1) Server-authoritative daily state + basic share-bonus caps (e.g., once per day) **(Recommended)**
- 2) Minimal — trust the client for MVP
- 3) Strict — rate limiting, fraud checks, referral verification
- 4) Other (please specify): _______

**Answer**: 1

---

### D1-12: Personas
**Question**: Should we generate detailed personas? (Context recommends No — one primary user type.)
- 1) No — single primary user type is enough **(Recommended)**
- 2) Yes — model distinct personas (e.g., casual seeker vs. sharer/power user)

**Answer**: 1

---

### D1-13: Team Size
**Question**: How many developers will work on this project?
- 1) Solo (1 developer)
- 2) Small team (2-3)
- 3) Medium team (4-8)
- 4) Large team (9+)

**Answer**: 2

---

## Decisions Summary
- D1-1 MVP Scope: Core loop + sharing. Reveal yields a probabilistic reward (gain or no gain); if gained, a random reward is shown.
- D1-2 User Identity: Guest or authenticated. localStorage-first for all; authenticated users sync full state to backend API (API = source of truth on conflict). Guests are local-only.
- D1-3 Mission Catalog Source: Static curated catalog defined during requirements/design (feature-based missions).
- D1-4 Completion Verification: Self-attested ("I did it").
- D1-5 Draw & Re-draw Rules: One draw/day; rejecting re-picks from the SAME spread; no new spread until next day.
- D1-6 Active Mission Limit: One active mission at a time.
- D1-7 Mission Expiry: Expires with no reward; user can draw again next day.
- D1-8 Reward Model: Displays results referencing existing reward types (Token, Badge/Discount, Asset, NFT, Physical coupon) already implemented externally. Minting/fulfillment out of scope.
- D1-9 Reward Scaling & Share Bonus: Random reward, independent of difficulty. Difficulty only sets the mission time window.
- D1-10 Sharing Mechanism: Shareable link/image + native share sheet; bonus reward on share action.
- D1-11 Anti-Abuse Priority: Server-authoritative daily state + basic share-bonus caps (once/day).
- D1-12 Personas: No — single primary user type.
- D1-13 Team Size: Small team (2-3).

---

**Instructions**: Fill in your answers above and respond with "done"
