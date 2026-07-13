---
inclusion: always
---

# Design Tokens — Solar Design System

The tarot-mission website follows the **Solar Design System**. These tokens are the single source of truth for color, typography, opacity, and gradients across all units. Implement them as CSS variables + a Tailwind theme extension in the Foundation UI shell.

> **Source note**: Tokens were provided as design screenshots. Confirmed values below are transcribed exactly; full per-shade hex scales (each family 50→950) should be imported from the Solar token export (Figma/JSON) to guarantee exact intermediate values. Where a value is not yet confirmed from the export, it is marked `⟨from export⟩`.

## Color Palettes

Every color family uses a **50 → 950** scale (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).

### Base
| Token | Hex |
|-------|-----|
| `white` | `#FFFFFF` |
| `black` | `#000000` |

### Families (scale 50–950)
- `grey` — neutral UI (backgrounds, borders, text)
- `aster-teal` — **brand** (primary). `500 ≈ #33CCAD`
- `aster-sky` — **brand** (secondary/accent). `500 ≈ #33A1CC`
- `aster-purple`
- `aster-orange`
- `green` (success)
- `blue` (info)
- `yellow` (warning)
- `red` (error/danger)

Confirmed anchors:
| Token | Hex |
|-------|-----|
| `aster-teal-500` | `#33CCAD` |
| `aster-sky-500` | `#33A1CC` |

Remaining shades per family: `⟨from export⟩`.

**Semantic mapping** (recommended usage):
- Primary / brand → `aster-teal`
- Accent → `aster-sky`
- Neutral surfaces & text → `grey`
- Success → `green`, Info → `blue`, Warning → `yellow`, Danger → `red`
- App base is a dark theme (near-black `grey-950`/`black` surfaces, light `grey-50`/`white` text)

## Alpha / Opacity Scale

Opacity steps applied to a base color to make translucent surfaces/overlays:

`4%, 8%, 16%, 24%, 32%, 40%, 48%, 56%, 64%, 72%, 80%, 88%`

Provided alpha ramps: `black/α`, `white/α`, `teal/α`, `sky/α`.

Usage examples: `white/8` for subtle borders on dark surfaces, `black/40` for scrims/overlays, `teal/16` for brand-tinted hover states.

## Gradients

| Token | Stops | Angles |
|-------|-------|--------|
| `grey-gradient` | `grey-800 → grey-600` | 45deg / 90deg / 180deg |
| `brand-gradient` | `#33CCAD → #33A1CC` (aster-teal → aster-sky) | 45deg / 90deg / 180deg |

- Use `brand-gradient` for primary hero surfaces, CTAs, and the daily-draw highlight.
- Use `grey-gradient` for card/panel backgrounds on the dark theme.

## Typography

- **Font family**: Poppins (fallback: system sans-serif). Weights: **Regular 400, Semibold 600, Bold 700**.
- **Base**: `1rem = 16px`.

### Type Scale
| Token | Size | Suggested line-height | Typical use |
|-------|------|-----------------------|-------------|
| `display-lg` | 62px (3.875rem) | ~72px | Hero titles |
| `display-md` | 48px (3rem) | ~58px | Section heroes |
| `display-sm` | 40px (2.5rem) | ~48px | Large headings |
| `heading-lg` | 32px (2rem) | ~40px | Page headings |
| `heading-md` | 24px (1.5rem) | ~32px | Card / modal titles |
| `heading-sm` | 20px (1.25rem) | ~28px | Sub-headings |
| `text-lg` | 18px (1.125rem) | ~28px | Lead body |
| `text-md` | 16px (1rem) | ~24px | Body (default) |
| `text-sm` | 14px (0.875rem) | ~20px | Secondary / captions |

Variants per size: Regular / Semibold / Bold (and Semibold-underline where used).

## Implementation Guidance
- Define tokens as CSS custom properties in `src/app/globals.css` and mirror them in `tailwind.config.ts` `theme.extend` (colors, opacity, backgroundImage for gradients, fontFamily, fontSize).
- Reference tokens via Tailwind classes (e.g., `bg-aster-teal-500`, `text-grey-50`, `bg-brand-gradient`, `border-white/8`) — avoid hardcoded hex in components.
- Load Poppins via `next/font/google` for performance.
- Full color scales must be filled from the Solar token export before UI implementation; keep token names stable so components don't change when exact hexes land.
