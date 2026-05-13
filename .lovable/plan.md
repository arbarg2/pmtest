All four focuses are big, so I'm splitting this into 4 small, shippable phases. We do Phase 1 first (visual foundation + landing), then you tell me to keep going.

## Phase 1 — Bolder visual system + landing polish (do now)

Foundation everything else builds on.

- New neon accent tokens in `index.css` + `tailwind.config.ts`:
  - `--neon-cyan` (#22d3ee-ish), `--neon-violet`, `--neon-lime` for risk states
  - `--gradient-aurora` (cyan → violet → magenta), `--gradient-mesh` (radial)
  - `--shadow-glow-{cyan,violet,danger}` with colored bloom
  - `--ring-neon` focus ring
- New utility classes: `.glow-cyan`, `.text-aurora`, `.border-glow`, `.bg-mesh`
- Motion primitives in `tailwind.config.ts`: `marquee`, `shimmer`, `float`, `glow-pulse`, `gradient-shift`
- Landing (`src/pages/Landing.tsx`):
  - Animated aurora mesh background behind hero
  - Headline gets gradient text + subtle letter-stagger animation
  - "Try it" search bar: neon focus glow, animated placeholder addresses cycling
  - Live ticker strip: scrolling marquee of recent public checks (verdict pills)
  - Feature cards lift with cyan border-glow on hover
  - Replaces stale section copy with punchier crypto-native lines

## Phase 2 — Redesign /safe (consumer hero) 

Make it feel viral and shareable.

- Giant centered input → instant verdict reveal animation (scale + glow burst)
- Verdict card becomes a shareable "trading card" (network logo, gradient by verdict, copy-link button)
- Mobile-first: thumb-reach CTA, sticky bottom share bar
- OG image generation per check (so Twitter/Telegram previews show the verdict)

## Phase 3 — Dashboard UX upgrade

- Tighter grid, sticky sub-header with risk score + quick actions
- Empty states with illustrations instead of plain text
- Skeleton loaders that pulse with neon shimmer
- Holly chat docked as a slide-over panel from the right
- Charts re-themed to neon palette

## Phase 4 — One killer new feature (pick one when we get there)

Candidates — we'll pick when Phase 3 is done:
- **Pre-send safety check browser extension hook** (works alongside MetaMask popups)
- **Telegram bot**: paste address, get verdict in DM
- **Watchlist feed page**: real-time ticker of risk-score changes across all watched wallets
- **Wallet connect → instant Health Score** (one-click for retail)

## Technical Notes

- All color additions go through `index.css` HSL tokens — no raw hex in components
- Animations use Tailwind keyframes + `framer-motion` (already installed) for hero/verdict reveal
- Aurora background = pure CSS (no canvas, no perf hit)
- Marquee ticker uses CSS animation, pauses on hover
- Phase 1 touches: `src/index.css`, `tailwind.config.ts`, `src/pages/Landing.tsx`. No backend, no schema, no breaking changes.

Approve and I'll ship Phase 1.
