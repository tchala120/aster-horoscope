---
inclusion: always
---

# Product

## Summary
- **Product**: A daily tarot-card ritual that turns horoscope engagement into a game of missions and rewards.
- **Users**: Horoscope seekers (end users) of an existing horoscope platform.
- **Type + Scope**: Greenfield — new standalone, production-ready responsive web application.

## Overview
Users visit once a day to draw a spread of random tarot cards and pick one. The chosen card assigns a horoscope mission with a difficulty tier. The user can accept the mission or reject it to draw again — but only one draw is allowed per day. Missions are grounded in features of the existing horoscope website. Completing a mission reveals the tarot result and grants a reward scaled to mission difficulty. Users can share their result to earn additional rewards.

## Problem Statement
Horoscope engagement is often passive and one-off. There is no daily hook that pulls users back, rewards deeper interaction with existing features, or encourages organic sharing. This product adds a gamified daily ritual that drives retention, feature discovery, and referral-style growth.

## Target Users
- **Horoscope seeker (primary)**: Wants a fun, meaningful daily ritual. Goal — draw a card, get a mission worth doing, complete it, and enjoy the reveal and reward.
- **Sharer (behavioral sub-type)**: Enjoys posting their tarot result to friends/social. Goal — earn bonus rewards by sharing.

## Key Features
- **Daily Draw**: Randomly generated tarot spread, limited to one draw per day per user.
- **Card Pick & Mission Assignment**: Picking a card assigns a difficulty-tiered mission.
- **Accept / Reject**: Accept the mission or reject to re-draw (subject to the daily limit).
- **Difficulty Tiers**: Easy (within a day), Medium (2-3 days), Hard (1 week) — each with a time window.
- **Mission Completion & Reveal**: On completion, reveal the tarot result (artwork + meaning).
- **Reward Engine**: Rewards scale with difficulty; bonus reward for sharing.
- **Sharing**: Shareable result with attribution/referral to earn more reward.

## Domain Language
| Term | Definition | Example |
|------|------------|---------|
| Draw | The once-daily generation of a random tarot spread | "Today's draw showed 3 cards" |
| Card Pick | Selecting one card from the spread | User picks The Star |
| Mission | A task tied to an existing-site feature, assigned by the picked card | "Read your weekly love horoscope" |
| Difficulty | Time window / effort tier of a mission | Easy / Medium / Hard |
| Reveal | Showing the tarot result after mission completion | "The Star revealed: renewed hope" |
| Reward | A probabilistic (gain/no gain), random-type result shown after reveal, referencing existing Aster reward types | ASTR (token), Discount, Physical coupon, Artwork (NFT/ASA/AAB) |
| Share Bonus | Extra reward earned by sharing a result, capped once per day | Bonus reward on share |

## Success Criteria
- Daily return rate (users completing a draw per day): to be defined during requirements.
- Mission acceptance and completion rates: to be defined during requirements.
- Share rate and share-driven new users: to be defined during requirements.

## Constraints & Assumptions
- **Constraints**: Must be production-ready and fully responsive (mobile, tablet, desktop). Must enforce the one-draw-per-day rule reliably and resist client-side tampering. Should be accessible.
- **Assumptions**:
  - An existing horoscope website exists; its features form the mission catalog (catalog to be provided/defined in requirements).
  - Login required (username/password). All state is persisted server-side and served via the API; the server is the single source of truth. No localStorage, no guest play.
  - Mission completion is self-attested ("I did it").
  - Reward types (ASTR token, Discount, Physical coupon, Artwork [NFT/ASA/AAB]) are already implemented on the Aster platform; this app only displays the granted result. Minting/fulfillment is out of scope.
  - Missions map to 10 existing Aster features (Expert Speaker, Teaching Assistant, Active Participant, Daily Engagement, Weekly Contribution, Helpful Reviewer, Survey Champion, Marketplace Poster, Marketplace Trader, Asset Collector). The Lot of Luck feature is excluded.
  - Difficulty (Easy/Medium/Hard) sets only the mission time window; it does not affect reward.

## Project Type
- **Type**: Greenfield
- **Scope**: New standalone product
