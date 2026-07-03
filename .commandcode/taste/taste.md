# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# scope
- The full PROMPT.md standard (design tokens, components, animations, layout, TypeScript strict, JSend API, git flow, infra, etc.) applies universally to ALL projects, not just repo-specific. Confidence: 0.95

# design-system
See [design-system/taste.md](design-system/taste.md)
# layout
- Use Pattern A (480px max-width) for landing/hero/auth pages, Pattern B (768px) for content/blog/docs, Pattern C (1024px with sidebar) for app/dashboard. Confidence: 0.95
- Use min-h-dvh (not min-h-screen); if content feels cramped adjust body padding, not max-width. Confidence: 0.95

# design-tokens
- Define tokens at :root: --bg (#0a0a0a), --surface (#111111), --border (rgba(255,255,255,0.08)), --white (#ffffff), --muted (rgba(255,255,255,0.45)), --accent (#e8e8e8), --mono-bg (rgba(255,255,255,0.06)), --mono-line (rgba(255,255,255,0.25)). Confidence: 0.95
- Map tokens to Tailwind config using var() references so classes like text-muted, bg-surface, border-border resolve to design tokens. Confidence: 0.95
- For shadcn/ui: map design tokens to shadcn CSS variables before using any component; never change colors in components.json or inside shadcn components directly. Confidence: 0.90

# typography
- Use clamp(1.8rem, 5vw, 2.6rem) for h1 with 700 weight and -0.03em letter-spacing. Confidence: 0.95
- Small text ≤9px: use positive letter-spacing + uppercase (badges: 9px/600/0.4em, footer: 8px/500/0.3em). Confidence: 0.95
- Button labels: 0.68rem, 600 weight, 0.13em letter-spacing, uppercase. Confidence: 0.95
- Monospace only for technical elements (tech tags, inline code), never for prose. Confidence: 0.95
- Use italic em for de-emphasis (font-style: normal + low opacity), not emphasis. Confidence: 0.80

# components
See [components/taste.md](components/taste.md)
# animation
- Use fade-up keyframe: opacity 0→1, translateY(8px→0), duration 0.7s, easing cubic-bezier(0.16, 1, 0.3, 1). Confidence: 0.95
- Use inline animation-delay for ≤5 staggered elements and JS data-stagger attribute pattern for ≥6 elements. Confidence: 0.95
- Always implement prefers-reduced-motion: set animation-duration and transition-duration to 0.01ms in reduce mode. Confidence: 0.95
- In Framer Motion: use useReducedMotion() hook with TRANSITION { duration: 0.7, ease: [0.16, 1, 0.3, 1] } and FADE_UP { opacity: 0, y: 8 } to { opacity: 1, y: 0 } variants. Confidence: 0.95

# typescript
- Always use TypeScript with strict mode enabled; JavaScript (.js/.jsx) is forbidden for application logic. Confidence: 0.95
- Avoid any; use unknown with type guards instead. File extensions must be .ts or .tsx. Confidence: 0.90

# code-style
- Use Prettier with semi:true, trailingComma:"all", singleQuote:true, printWidth:100, tabWidth:2, useTabs:false, prettier-plugin-tailwindcss. Confidence: 0.95
- Use ESLint with next/core-web-vitals + prettier (last in extends), @typescript-eslint/no-unused-vars rule (error, argsIgnorePattern: "^_"), and react/jsx-sort-props (callbacksLast, shorthandFirst, ignoreCase, reservedFirst). Confidence: 0.95
- Use clsx + tailwind-merge with cn() utility (mandatory for conditional class logic). Confidence: 0.95
- Use cva (class-variance-authority) for components with variants; only reference existing Tailwind config tokens, never hard-code colors in cva(). Confidence: 0.95

# naming-conventions
- Use camelCase for variables/functions, PascalCase for React components/files, kebab-case for feature folders, UPPER_SNAKE_CASE for constants/env vars. Confidence: 0.95

# api
- Use JSend API response format: { status: "success", data: ... } for success, { status: "error", message, code, errors } for errors. Confidence: 0.95
- Use standard HTTP codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal. Confidence: 0.95
- Validation errors return errors array with { field, message } objects. Confidence: 0.90
- Use centralized Axios client with request interceptor (Bearer token) and response interceptor (401 handling, error extraction). Confidence: 0.90
- Use date-fns for date formatting; never use raw Date for display formatting. Confidence: 0.90

# git
- Use conventional commits format: feat/fix/chore/docs/style/refactor/perf/test with optional scope. Confidence: 0.95
- Use branching strategy: main (protected), feat/<name>, fix/<name>, chore/<name>, hotfix/<name> with squash-and-merge. Confidence: 0.95
- Protect main: require PR, status checks, up-to-date branches, dismiss stale approvals, auto-delete head branches. Confidence: 0.95
- Rebase before PRs, never force-push to shared branches, never push directly to main. Confidence: 0.95
- Configure git global: pull.rebase true, rebase.autoStash true, fetch.prune true. Confidence: 0.90

# infrastructure
See [infrastructure/taste.md](infrastructure/taste.md)
# accessibility
- Muted text minimum opacity 0.45 for readable text (WCAG AA compliant); 0.35 only for decorative elements; ≤0.16 for footer/watermarks only. Confidence: 0.95
- Never remove focus outline; customize with focus-visible: outline: 2px solid white, outline-offset: 3px. Confidence: 0.95
- Use semantic HTML: button for actions, a for navigation; one h1 per page; every form input has a connected label; decorative img gets alt="", informative img gets descriptive alt. Confidence: 0.95
- Customize ::selection: background rgba(255,255,255,0.15), color white. Confidence: 0.90

# workflow
- When applying universal standards to a project, write filtered (project-relevant only) standards to agents.md in the project root. Confidence: 0.70
