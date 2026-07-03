# Agents.md — Billing App Standards

## Scope
The full PROMPT.md standard (design tokens, components, animations, layout, TypeScript strict, JSend API, git flow, infra, etc.) applies universally.

## Design System
- Dark theme with dot grid: `rgba(255,255,255,0.04)` 1px dots, 28px spacing, vignette pseudo-element overlay.
- Design tokens as CSS custom properties only; never hard-code color values.
- System font stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` for UI; monospace for technical elements only.
- `min-h-dvh` instead of `min-h-screen` for full-viewport height (avoids mobile address-bar issues).
- Always constrain content wrappers with `max-width`; never let text stretch to screen edge on ultra-wide.

## Layout
- Pattern A (480px max-width): landing/hero/auth pages.
- Pattern B (768px): content/blog/docs.
- Pattern C (1024px with sidebar): app/dashboard.

## Design Tokens (CSS Custom Properties)
Defined at `:root`:
- `--bg`: `#0a0a0a`
- `--surface`: `#111111`
- `--border`: `rgba(255,255,255,0.08)`
- `--white`: `#ffffff`
- `--muted`: `rgba(255,255,255,0.45)`
- `--accent`: `#e8e8e8`
- `--mono-bg`: `rgba(255,255,255,0.06)`
- `--mono-line`: `rgba(255,255,255,0.25)`

Map tokens to Tailwind v4 config using `var()` references so utilities like `text-muted`, `bg-surface`, `border-border` resolve to design tokens.

## Typography
- `h1`: `clamp(1.8rem, 5vw, 2.6rem)`, 700 weight, `-0.03em` letter-spacing.
- Small text ≤9px: positive letter-spacing + uppercase (badges: `9px/600/0.4em`, footer: `8px/500/0.3em`).
- Button labels: `0.68rem`, 600 weight, `0.13em` letter-spacing, uppercase.
- Monospace only for technical elements (tech tags, inline code), never for prose.
- De-emphasis via italic em with `font-style: normal` + low opacity (not emphasis).

## Components
- Only two button variants: primary (white bg, dark text) and secondary (transparent bg, white text) — space-between icon-right pattern.
- Badge: 24px line + uppercase label (`9px`, `0.4em` letter-spacing, muted color).
- Tech tag inline: monospace, `0.87em` relative size, `mono-bg` background, decorative `mono-line` underline with 3px offset.
- Divider: full-width 1px height `border` background, `mb-7`.
- Footer: 8px, 500 weight, `0.3em` letter-spacing, uppercase, `white/0.16` opacity, `border-t border-border`, space-between layout.
- Limit to 1 primary CTA per viewport; button labels must be action-oriented.
- Always give interactive elements a unique descriptive `id`.

## Animation
- Fade-up keyframe: `opacity 0→1`, `translateY(8px→0)`, duration `0.7s`, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
- Inline `animation-delay` for ≤5 staggered elements; JS `data-stagger` attribute pattern for ≥6.
- Always implement `prefers-reduced-motion`: set `animation-duration` and `transition-duration` to `0.01ms`.

## TypeScript
- TypeScript with strict mode enabled; `.js`/`.jsx` forbidden for application logic.
- Avoid `any`; use `unknown` with type guards. Extensions must be `.ts` or `.tsx`.

## Code Style
- Prettier: `semi: true`, `trailingComma: "all"`, `singleQuote: true`, `printWidth: 100`, `tabWidth: 2`.
- ESLint: next/core-web-vitals + prettier, `@typescript-eslint/no-unused-vars` (error, `argsIgnorePattern: "^_"`), `react/jsx-sort-props`.
- `clsx` + `tailwind-merge` with `cn()` utility for conditional class logic.
- `cva` (class-variance-authority) for components with variants; only reference design tokens, never hard-code colors.

## Naming Conventions
- `camelCase`: variables/functions.
- `PascalCase`: React components/files.
- `kebab-case`: feature folders.
- `UPPER_SNAKE_CASE`: constants/env vars.

## API
- JSend response format: `{ status: "success", data: ... }` / `{ status: "error", message, code, errors }`.
- HTTP codes: 200/201/204/400/401/403/404/409/500.
- Validation errors: `errors` array with `{ field, message }` objects.
- Centralized fetch/Axios client with Bearer token interceptor and 401 handling.
- Use `date-fns` for date formatting; never raw `Date` for display.

## Git
- Conventional commits: `feat/fix/chore/docs/style/refactor/perf/test` with optional scope.
- Branching: `main` (protected), `feat/<name>`, `fix/<name>`, `chore/<name>`, `hotfix/<name>` with squash-and-merge.
- Protect main: require PR, status checks, up-to-date branches.
- Rebase before PRs, never force-push to shared branches, never push directly to main.
- Git config: `pull.rebase true`, `rebase.autoStash true`, `fetch.prune true`.

## Infrastructure
- Multi-stage Dockerfile (Node.js/Next.js): deps → builder → runner, non-root user, standalone output.
- Docker Compose: services bound to `127.0.0.1` only (not `0.0.0.0`).
- VPS hardening: non-root user, SSH hardening (no root, no password auth), UFW, Fail2Ban, unattended-upgrades.
- CI pipeline: `lint → tsc --noEmit → test → build` on every PR to main.
- Store `.env.production` on server only; never push secrets.

## Accessibility
- Muted text: minimum opacity `0.45` (WCAG AA); `0.35` only for decorative; `≤0.16` for footer/watermarks only.
- Never remove focus outline; use `focus-visible: outline: 2px solid white, outline-offset: 3px`.
- Semantic HTML: `button` for actions, `a` for navigation; one `h1` per page; every form input has a connected label; decorative `img` gets `alt=""`.
- Customize `::selection`: background `rgba(255,255,255,0.15)`, color white.
