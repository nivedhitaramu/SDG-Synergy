# SDG Synergy

A fullstack sustainability networking platform where users and organizations connect based on UN Sustainable Development Goals (SDGs) alignment.

## Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter (routing) + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based (express-session + bcrypt) — NOT Replit Auth
- **Email**: Brevo SMTP via nodemailer (primary), Resend API (fallback), Gmail SMTP (fallback)

## Features
- Profile-based matching with % SDG alignment scores
- Exactly 3 SDG selection per user during registration
- India-specific city autocomplete (37 cities)
- Email OTP verification on registration
- Project collaboration
- SDG Explorer page
- Edit profile (email, location, org type, SDGs)

## Email OTP Setup
Three email providers are supported (tried in order):
1. **Resend** — set `RESEND_API_KEY` (free tier only sends to account owner email)
2. **Brevo SMTP** — set `BREVO_LOGIN` + `BREVO_SMTP_KEY` + `SENDER_EMAIL` (sends to any email, 300/day free)
3. **Gmail SMTP** — set `SMTP_USER` + `SMTP_PASS` (requires Gmail App Password)

When no email service is configured, the OTP is returned in the API response and shown in the UI for development.

## Required Secrets
| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | Express session signing |
| `RESEND_API_KEY` | Resend email API (optional) |
| `BREVO_LOGIN` | Brevo SMTP username |
| `BREVO_SMTP_KEY` | Brevo SMTP password/key |
| `SENDER_EMAIL` | Verified sender email for Brevo |

## Key Files
- `shared/schema.ts` — DB schema (users, projects, matches)
- `shared/routes.ts` — API contract + Zod schemas
- `server/routes.ts` — All API handlers + OTP/email logic
- `server/storage.ts` — DB operations
- `client/src/pages/auth-page.tsx` — Multi-step register + OTP flow
- `client/src/pages/profile.tsx` — Profile view + edit
- `client/src/lib/sdgs.ts` — SDG data (SDG_DATA + SDG_GOALS alias)
- `client/src/hooks/use-auth.tsx` — Auth context

## Seed Accounts
- `green@ngo.org` / `password` (emailVerified: true)
- `farming@biz.com` / `password` (emailVerified: true)

## Auth Rules
- Password: minimum 8 characters
- Must select exactly 3 SDGs
- Email must be verified via OTP before login is allowed
