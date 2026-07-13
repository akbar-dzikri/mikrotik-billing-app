# MikroTik Billing App

A self-hosted billing and hotspot management dashboard for MikroTik routers. Built with Next.js 16, PostgreSQL, Tailwind CSS, and daisyUI.

## Architecture

| Layer           | Mechanism                                                     |
| --------------- | ------------------------------------------------------------- |
| **App Auth**    | BetterAuth (email/password, session cookie)                   |
| **Router Auth** | AES-256-GCM encrypted in DB, decrypted server-side at runtime |

Router credentials never touch the browser — all MikroTik API calls happen server-side.

## Tech Stack

| Layer             | Choice                                  |
| ----------------- | --------------------------------------- |
| Framework         | Next.js 16+ (App Router)                |
| Language          | TypeScript                              |
| Database          | PostgreSQL                              |
| ORM               | Drizzle ORM                             |
| App Auth          | BetterAuth (email/password)             |
| Router API Client | `node-routeros` (RouterOS API protocol) |
| Encryption        | Node.js `crypto` — AES-256-GCM          |
| TLS Strategy      | Trust-on-first-use (TOFU)               |
| UI                | Tailwind CSS 4 + daisyUI 5 (dark theme) |
| Validation        | Zod                                     |
| Package Manager   | pnpm                                    |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- pnpm

### Setup

```bash
git clone git@github.com:akbar-dzikri/mikrotik-billing-app.git
cd mikrotik-billing-app

# Install dependencies
pnpm install

# Copy environment template and fill in values
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/billing"

# BetterAuth
BETTER_AUTH_SECRET=""               # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# Router credential encryption (AES-256)
ROUTER_ENCRYPTION_KEY=""            # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Migrations

```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The first request redirects to `/login`.

## Project Structure

```
app/
├── (auth)/login/                   # BetterAuth sign-in page
├── (dashboard)/                    # Authenticated dashboard shell
│   ├── layout.tsx                  # Sidebar + auth guard
│   └── page.tsx                    # Dashboard home
├── api/
│   ├── auth/[...all]/              # BetterAuth API handler
│   ├── routers/                    # Router CRUD + connection test
│   ├── plans/                      # Plan CRUD
│   └── customers/                  # Customer CRUD + online/disconnect/recharge
├── globals.css                     # Tailwind + daisyUI dark theme
└── layout.tsx                      # Root layout

lib/
├── auth.ts                         # BetterAuth server config
├── auth-client.ts                  # BetterAuth React client
├── crypto.ts                       # AES-256-GCM encrypt/decrypt
├── tls-fingerprint.ts              # TOFU certificate fingerprinting
├── mikrotik-client.ts              # RouterOS API connection manager + pool
├── db.ts                           # Drizzle client singleton
├── cn.ts                           # clsx + tailwind-merge utility
└── devices/
    ├── types.ts                    # DeviceHandler interface
    ├── resolver.ts                 # Device type → handler mapping
    └── mikrotik-hotspot.ts         # Hotspot device handler

db/schema/
├── enums.ts                        # PostgreSQL enums
├── tables.ts                       # 11 tables (auth + business)
├── relations.ts                    # Drizzle relations
└── index.ts                        # Re-exports
```

## API Endpoints

All endpoints use [JSend](https://github.com/omniti-labs/jsend) response format and require BetterAuth session authentication.

### Routers

| Method   | Path                     | Description                                          |
| -------- | ------------------------ | ---------------------------------------------------- |
| `GET`    | `/api/routers`           | List all routers                                     |
| `POST`   | `/api/routers`           | Add router (encrypts password, captures fingerprint) |
| `GET`    | `/api/routers/[id]`      | Get single router                                    |
| `PUT`    | `/api/routers/[id]`      | Update router                                        |
| `DELETE` | `/api/routers/[id]`      | Delete router                                        |
| `POST`   | `/api/routers/[id]/test` | Test router connection                               |

### Plans

| Method   | Path              | Description                           |
| -------- | ----------------- | ------------------------------------- |
| `GET`    | `/api/plans`      | List plans (with router name)         |
| `POST`   | `/api/plans`      | Create plan (syncs to router profile) |
| `GET`    | `/api/plans/[id]` | Get single plan                       |
| `PUT`    | `/api/plans/[id]` | Update plan (syncs to router)         |
| `DELETE` | `/api/plans/[id]` | Delete plan (removes router profile)  |

### Customers

| Method   | Path                             | Description                           |
| -------- | -------------------------------- | ------------------------------------- |
| `GET`    | `/api/customers`                 | List customers                        |
| `POST`   | `/api/customers`                 | Create customer (syncs to router)     |
| `GET`    | `/api/customers/[id]`            | Get single customer                   |
| `DELETE` | `/api/customers/[id]`            | Remove customer (removes from router) |
| `GET`    | `/api/customers/[id]/online`     | Check online status                   |
| `POST`   | `/api/customers/[id]/disconnect` | Force disconnect from router          |
| `POST`   | `/api/customers/recharge`        | Recharge with new plan                |

## Design Decisions

- **RouterOS API over REST** — TLS on port 8729 works out of the box with auto-generated certs.
- **AES-256-GCM** — Authenticated encryption; detects tampering.
- **Trust-on-first-use** — Zero manual certificate management. MITM protection without CA involvement.
- **Server-side only** — Router credentials never touch the browser.
- **Drizzle over Prisma** — Lightweight, SQL-like API, no code generation.
- **daisyUI over shadcn/ui** — Class-based components, dark theme by default, faster iteration.

## Documentation

Full implementation plan: [docs/auth-implementation.md](docs/auth-implementation.md)
