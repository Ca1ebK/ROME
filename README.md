# ROME

A mobile-first workforce management system built with Next.js, Material UI, and Supabase. ROME was created as a simpler, more intuitive, and modern alternative to warehouse tracking software. My co-founder Liam used to work at a Scholastic warehouse where they used Kronos—this project was inspired by that experience. Features kiosk-based clock-in/out, personal worker dashboards, time-off requests, and manager approvals.

## Live Demo

Try it out: https://rome-chi.vercel.app/

### Test Accounts

| PIN | Name | Role |
|-----|------|------|
| `123456` | John Smith | Worker |
| `345678` | James Wilson | Manager |
| `000000` | Admin Mode | Create workers |

### How to Test

1. Kiosk (`/kiosk`) — Enter a PIN to clock in/out or log production
2. Login (`/login`) — Enter a PIN, then use the verification code popup to sign in
3. Dashboard (`/dashboard`) — View hours, punch history, and request time off
4. Manager (`/manager`) — Approve/deny requests, manage workers (use James Wilson)

## Features

- Kiosk Mode — Shared terminal for PIN-based clock in/out and production logging
- Worker Dashboard — Weekly hours, punch history, time-off requests
- Manager Dashboard — Approve/deny time-off, manage team members
- Multi-Factor Auth — PIN + email verification + optional WebAuthn passkeys
- Light/Dark/System Themes — Material Design 3 with adaptive color tokens
- PWA Ready — Installable as a standalone app on mobile devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Material UI v7, Tailwind CSS, Emotion |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | PIN + Email Verification + WebAuthn Passkeys |
| Email | Resend |
| Deployment | Vercel |

## Getting Started

```bash
git clone https://github.com/your-username/ROME.git
cd ROME
cp env.example .env.local   # Add your Supabase keys
npm install
npm run dev
```
