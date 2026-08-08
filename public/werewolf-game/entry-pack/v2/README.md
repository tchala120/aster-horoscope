# Werewolves of Aster Village — Entry Pack v2

Reusable raster artwork for a future component-driven room-list experience. This
directory is asset-only and is not wired into the application UI.

| File | Dimensions | Alpha | Intended usage |
| --- | ---: | :---: | --- |
| `moonlit-village-background.png` | 1672 × 941 | No | Opaque full-screen entry backdrop; use cover-style cropping with a readable content overlay. |
| `werewolves-logo-lockup.png` | 1536 × 1024 | Yes | Transparent title/crest lockup. Preserve aspect ratio and accessible DOM heading text. |
| `room-icons-atlas.png` | 2172 × 724 | Yes | Five transparent room emblems arranged horizontally for deterministic room-row icon mapping. |
| `carved-buttons-atlas.png` | 2172 × 724 | Yes | Four transparent carved button treatments arranged horizontally (Create, Join, Resume, Checking). Overlay real semantic button controls/text rather than relying on baked labels. |
| `village-ledger-frame.png` | 1693 × 929 | Yes | Transparent ornamental frame around a live DOM room ledger; do not use it as a static UI screenshot. |

The four transparent files were processed from flat green keyed sources with the
installed imagegen chroma-key helper using border auto-key sampling, a soft matte,
and despill (`transparent-threshold 12`, `opaque-threshold 220`). All four corners
are fully transparent and the opaque backdrop remains RGB without an alpha channel.
