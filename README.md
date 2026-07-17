# PayRemind — Payment Reminder System

A lightweight monorepo for tracking invoices and sending payment reminder emails via [Resend](https://resend.com). The app uses an Express API backed by PostgreSQL, with JWT authentication protecting invoice operations and a BullMQ worker for background email delivery.

## Project structure

```
/client   → React + Vite + Tailwind (port 5173)
/server   → Express + Resend proxy (port 3000)
```

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- A [Resend](https://resend.com) API key

## Setup

### Quick start (both apps)

From the repo root:

```bash
npm run install:all
npm run dev
```

This starts the API on **http://localhost:3000** and the client on **http://localhost:5173**.

### Manual setup

#### 1. Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env — see Environment variables below
# Make sure DATABASE_URL, JWT_SECRET, REDIS_URL, and Resend credentials are configured
npm run dev
```

On startup, the server logs whether a valid `RESEND_API_KEY` is loaded (placeholders like `dummy_key` are rejected).

#### 2. Client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api/*` to `http://localhost:3000`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string used by the server. |
| `JWT_SECRET` | Secret key for signing JWT tokens used by authenticated invoice routes. |
| `REDIS_URL` | Redis connection string used by BullMQ for the email queue. |
| `RESEND_API_KEY` | Your Resend API key from [resend.com/api-keys](https://resend.com/api-keys) (server only). Must start with `re_` — not a placeholder. |
| `RESEND_FROM_EMAIL` | Verified sender (default: `onboarding@resend.dev`) |
| `REMINDER_TO_EMAIL` | **Sandbox recipient** — on the Resend free tier, all reminder emails are sent to this verified address instead of each invoice’s `clientEmail` |

**Resend free tier:** You can only send to addresses you have verified. Set `REMINDER_TO_EMAIL` to your own verified inbox (e.g. your Gmail) while testing. The server logs the intended client recipient in the terminal for debugging.

## Features

### Dashboard

- **Currency tabs** — Switch between **USD ($)** and **INR (₹)**; the table and summary cards filter to the active currency.
- **Summary cards** — Per-currency monetary totals:
  - **Total Outstanding** (unpaid amounts) with count subtext, e.g. `from 2 unpaid invoices`
  - **Total Overdue** (past-due unpaid amounts) with count subtext, e.g. `across 1 overdue invoice`
  - **Total Paid** (collected amounts) with count subtext, e.g. `from 1 paid invoice`
- **Total invoice badge** — Header shows `Total Invoices: X` for the active currency.
- **Responsive summary grid** — 1 column on mobile, 2 columns from `md` (768px), 3 columns from `min-[1150px]`; the Total Paid card spans full width on medium screens.

### Invoice table

- Search and status filter
- Sortable amount and due-date columns (desktop)
- **Mobile card layout** (`< md`) — Stacked cards with field labels; standard table from 768px upward
- Click-to-cycle status badges
- Auto-**Overdue** status for unpaid invoices past due date
- Create / edit invoice modal (USD or INR)
- **Send Reminder** → `POST /api/send-reminder` → appends timestamp to `reminderHistory`

### API / email

 - Express API backed by PostgreSQL with normalized relational tables for invoices and reminder history
- JWT authentication with bcrypt password hashing secures API access and invoice mutation routes
- Swagger auto-generates interactive OpenAPI docs via `swagger-jsdoc` and `swagger-ui-express`
- `POST /api/send-reminder` is rate-limited and enqueues a BullMQ job to Redis for asynchronous email delivery
- Email payloads are sanitized using a custom `escapeHtml` utility before rendering backend HTML templates
- Request payloads are validated server-side with Zod middleware, rejecting invalid invoices before database writes
- Resend email errors are caught and surfaced cleanly; responses return `{ error: "..." }` with appropriate HTTP status codes
- Frontend toasts display API error messages when available

## Data layer

The server now persists invoices in PostgreSQL, including a normalized reminder history relationship rather than flat client-side arrays.

- Invoices are stored in PostgreSQL and fetched through the Express API
- Reminder history is modeled as a separate relational table with foreign keys
- All invoice writes are validated before database insertion using Zod

The client still renders data locally, but the backend is responsible for durable storage and normalized relational modeling.

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| root | `npm run install:all` | Install root, server, and client dependencies |
| root | `npm run dev` | Run server + client concurrently |
| `server` | `npm run dev` | Express with file watch |
| `server` | `npm start` | Production start |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Production build |

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| `ERR_CONNECTION_REFUSED` on :5173 | Start the client: `cd client && npm run dev` |
| `API Key is invalid` | Replace placeholder `RESEND_API_KEY` in `server/.env` with a real `re_…` key from Resend; restart the server |
| `RESEND_API_KEY is missing or still a placeholder` | Same as above — server rejects `dummy_key` and similar values |
| Reminder fails for client emails | Expected on free tier — set `REMINDER_TO_EMAIL` to your verified address |
| Request failed (500) | Read the red toast message and the server terminal for the full Resend error |

## License

MIT — Binary Automates take-home assignment.
