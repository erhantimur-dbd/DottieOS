# Dottie OS

> *"Dot the i's and T's with Dottie OS for childminders and nurseries."*

A comprehensive, full-stack childcare management system designed for UK childminders and nurseries. Dottie OS centralizes all admin, compliance, and parent communication in one platform, eliminating app-switching and maintaining a complete audit trail.

## 🎯 Key Features

### Daily Updates (Flagship Feature)
- **Write once, send automatically**: Staff create daily notes inside Dottie OS
- **Mandatory approval workflow**: Supervisors must approve before sending
- **Scheduled delivery**: Automatic sending at configured time (default 17:00)
- **Multi-channel**: Email or WhatsApp per guardian's preference
- **Complete audit trail**: Every message logged with timestamps and recipients
- **Auto-task creation**: Approval tasks automatically generated for supervisors

### Core Modules

1. **Dashboard** - Real-time metrics and quick actions
2. **Children & Guardians** - Comprehensive profiles with medical/dietary needs
3. **Attendance Registers** - Daily check-in/out tracking
4. **Payments Tracker** - Invoice management with chase list
5. **Consents & Documents** - Template-based consent tracking
6. **Incident/Accident Log** - Detailed incident recording
7. **Tasks System** - Auto-generated and manual task management
8. **Evidence Vault** - Inspection readiness tracking
9. **Daily Updates** - Staff notes → Approval → Automatic sending
10. **Settings** - Organisation and user management
11. **Audit Log** - Organisation-wide activity trail (admin-only)

## 🏗️ Technical Stack

- **Framework**: Next.js 16 (App Router, Server Actions) + TypeScript
- **Database**: PostgreSQL + Prisma 7 (via the `@prisma/adapter-pg` driver adapter)
- **Authentication**: NextAuth.js v5 (JWT), with edge-safe middleware RBAC
- **UI**: Tailwind CSS v4 + shadcn/ui + recharts
- **Styling**: Black & white high-contrast design

### Implemented capabilities

- **Full CRUD** on every module via type-safe Server Actions — each action is
  organisation-scoped, zod-validated, RBAC-checked, and writes to the audit trail.
- **Working Daily Updates pipeline**: save notes → compile email/WhatsApp → submit
  for approval (auto-creates a task) → supervisor approve → send to guardians.
- **Pluggable messaging** (`src/lib/messaging`): email/WhatsApp adapters are
  *simulated* by default (every send is recorded in `OutboundMessageLog` as a real
  audit trail). Set `RESEND_API_KEY` / `TWILIO_*` to enable real delivery — no call
  sites change.
- **Scheduled sending**: a `CRON_SECRET`-guarded cron route
  (`/api/cron/send-daily-updates`) delivers approved updates at each org's configured
  time (registered in `vercel.json`).
- **Audit Log** (admin-only) recording who changed what, with filters.
- **CSV export** of attendance registers and payment reports.
- **Dashboard charts** (attendance trend + outstanding payments) and a **global
  search** across children, guardians, tasks, and incidents.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string

# Set up database
npx prisma generate
npx prisma migrate dev
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

```
Admin: admin@demo.com / admin123
Supervisor: supervisor@demo.com / admin123
Staff: staff1@demo.com / admin123
```

### Demo Data

The seed script creates:
- 8 children with varied scenarios
- 16 guardians (mix of email/WhatsApp preferences)
- Week of attendance records
- Payment invoices (3 overdue)
- Consent records (some missing/expired)
- Daily updates in various approval states
- Tasks including approval queue items

## 📋 Key Workflows

### Daily Updates Workflow

1. Staff creates daily notes for a child
2. System auto-creates approval task for supervisor
3. Supervisor reviews in Approval Queue
4. Supervisor approves update
5. System sends at scheduled time (17:00) via guardian preferences
6. Complete audit trail maintained

### Payment Chase

1. View overdue invoices in Chase List
2. Send reminder (logged with timestamp)
3. Mark as paid when received

## 🎨 Design System

- **Black & white** high-contrast theme
- **Readable typography** (no light grey on white)
- **Status badges**: Green (success), Orange (warning), Red (danger), Black (sent)

## 🔐 Security

- **Role-based access**: Owner, Admin, Supervisor, Staff
- **Multi-tenant**: All data scoped by organisation
- **JWT sessions**: Secure authentication
- **Password hashing**: bcrypt

## 📝 Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dottie_os"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="generate-with-openssl-rand-base64-32"   # Bearer token for the scheduled sender

# Optional — enable real message delivery (simulated/logged when unset)
# RESEND_API_KEY="..."        # Email
# TWILIO_ACCOUNT_SID="..."    # WhatsApp
# TWILIO_AUTH_TOKEN="..."
# TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

> **Prisma 7 note:** the database connection URL lives in `prisma.config.ts`
> (CLI) and is supplied to the client through the pg driver adapter at runtime —
> it is no longer set inside `schema.prisma`.

## 🧪 Database Commands

```bash
npx prisma studio        # View database
npx prisma migrate reset # Reset database
npm run db:seed          # Seed demo data
```

## 🚧 Production Deployment

```bash
npm run build
npm start
```

## 📄 License

Copyright © 2026 Dottie OS. All rights reserved.

---

**Built with ❤️ for UK childcare providers**
