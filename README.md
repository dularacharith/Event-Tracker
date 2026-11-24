# CampaignFlow — Private Social Campaign Tracker

**CampaignFlow** is a private, invite-only web application built for a 3–4 person social media team to create and schedule campaign activities, assign reviewers, attach proof of work (screenshots or external links), and have a different teammate record a **Passed** or **Failed** verdict with an immutable snapshot history and append-only audit trail.

---

## Key Features & Business Rules

1. **Invite-Only Team Workspace**
   - **One Shared Workspace** with two roles: **Admin** and **Member**.
   - **First Admin Bootstrap**: The first admin is configured once using `FIRST_ADMIN_EMAIL` and a matching verified Google sign-in. Visitors are never promoted automatically.
   - **Strict Invites**: Admins create and share single-use, revocable invite links that expire (e.g. 7 days) and **only work for the intended verified Google email address**.
   - Signing in with Google alone grants zero access. Active workspace membership and permissions are validated on every protected route and file access.

2. **Scheduling & Review Workflow**
   - **Status Lifecycle**: `Draft` → `Scheduled` → `In Progress` → `Awaiting Review` → `Passed` or `Failed`.
   - **Scheduling Rules**: Scheduling requires an owner, an eligible reviewer (an active teammate who is neither creator nor owner), pass criteria, and a review deadline strictly after the scheduled time.
   - **Evidence Requirement**: To submit for review, the owner must attach at least one piece of evidence (screenshot or external link).
   - **Reviewer Decisions**: Only the assigned reviewer can decide, only while `Awaiting Review`. Both **Passed** and **Failed** require a written reason.
   - **Atomic Concurrency**: Decisions and status history are saved in the same interactive database transaction; stale or duplicate submissions are rejected.
   - **Rescheduling Preserves History**: When failed work is rescheduled, previous verdicts, reasons, criteria snapshots, and evidence snapshots are preserved intact.

3. **Private File Storage (Vercel Blob)**
   - Uploads accept PNG, JPEG, or WebP up to 3 MB.
   - Files are validated on the server (mime type, magic bytes, size) and stored privately.
   - Files are served **only through an authenticated route** (`/api/files/[id]`) that validates active workspace membership.

4. **Productivity Screens**
   - **My Work**: Activities I own, reviews assigned to me, and overdue work.
   - **Calendar**: Week and month views formatted in the user's timezone; click any day to schedule an activity. Stored in UTC.
   - **Activities**: Filterable list and status board with explicit action buttons.
   - **Activity Detail**: Brief, criteria, evidence gallery, comments, review actions, and history snapshots.
   - **Team & Profile**: Teammate roster, single-use invite generator, and profile editor.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zod.
- **Database**: Neon Postgres (pooled connection supporting interactive transactions via `pg.Pool`) + Drizzle ORM.
- **Authentication**: Better Auth with Google OAuth & database-backed sessions.
- **Storage**: Private `@vercel/blob` storage (with local disk fallback for dev/testing).
- **Testing**: Vitest with `@electric-sql/pglite` (pure in-memory Postgres).

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22)
- npm or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in:
- `FIRST_ADMIN_EMAIL`: The Google email address of your initial admin.
- `BETTER_AUTH_SECRET`: Generate a random string (`openssl rand -base64 32`).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.

### 4. Running Migrations
When using a live Postgres database (e.g. Neon):
```bash
npm run db:migrate
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

> **Note for Development & Offline Testing:**
> In development mode (`process.env.NODE_ENV !== 'production'`), a **Dev Account Switcher** pill appears in the bottom right corner of the screen. You can switch between **Admin Alice** (`admin@company.com`), **Owner Alice** (`alice@company.com`), and **Reviewer Bob** (`bob@company.com`) to test the multi-person review workflow interactively without needing Google credentials!

---

## Deployment to Vercel Step-by-Step

### Step 1: Import Repository into Vercel
1. Push your repository to GitHub or GitLab.
2. In the Vercel Dashboard, click **Add New...** → **Project**.
3. Select your repository and choose **Next.js** as the Framework Preset.

### Step 2: Connect Neon Postgres via Vercel Marketplace
1. In the Vercel Project Dashboard, navigate to the **Storage** tab.
2. Click **Connect Database** and choose **Neon**.
3. Select your region and click **Connect**.
4. Vercel will automatically inject:
   - `DATABASE_URL` (pooled connection string)
   - `POSTGRES_URL`

### Step 3: Connect Private Vercel Blob
1. In the **Storage** tab, click **Create Database / Store** → **Blob**.
2. Name your store `campaignflow-blob`.
3. Set the access mode to **Private**.
4. Click **Create**. Vercel will automatically populate `BLOB_READ_WRITE_TOKEN`.

### Step 4: Configure Google OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** with Application type **Web application**.
3. Add Authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `https://your-project.vercel.app` (for production)
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-project.vercel.app/api/auth/callback/google`
5. In your Vercel Project settings, add the following Environment Variables:
   - `GOOGLE_CLIENT_ID`: Your client ID from Google
   - `GOOGLE_CLIENT_SECRET`: Your client secret from Google
   - `BETTER_AUTH_SECRET`: Random 32+ character string
   - `BETTER_AUTH_URL`: `https://your-project.vercel.app`
   - `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
   - `FIRST_ADMIN_EMAIL`: Your Google email address (e.g. `teamlead@yourdomain.com`)

### Step 5: Apply Database Migrations (Release Step)
SQL migration files are committed in the `drizzle/` directory. To apply them to your Neon database:
```bash
DATABASE_URL="<your_neon_database_url>" npm run db:migrate
```
You can also run this step in GitHub Actions or Vercel Build scripts.

### Step 6: Sign In as the First Admin
1. Open `https://your-project.vercel.app`.
2. Click **Continue with Google** and sign in with the email configured in `FIRST_ADMIN_EMAIL`.
3. The application will detect the first admin, initialize the shared workspace, and enroll your account as **Admin**.
4. Navigate to the **Team** tab to generate single-use invite links for your teammates.

---

## Verification & Test Commands

Run the full automated test suite (runs true in-memory PostgreSQL via PGlite):
```bash
npm test
```

Run TypeScript compiler type checks:
```bash
npm run typecheck
```

Run production build:
```bash
npm run build
```

---

## Repository Structure

```
├── drizzle/                     # Committed SQL migrations and schema journal
├── scripts/
│   └── migrate.mjs              # Standalone migration release runner
├── src/
│   ├── app/                     # Next.js App Router pages and API routes
│   │   ├── activities/          # Activity board, filterable list & detail
│   │   ├── calendar/            # Calendar week and month views
│   │   ├── campaigns/           # Campaign initiative management
│   │   ├── my-work/             # Owned activities, reviews assigned, overdue
│   │   ├── team/                # Teammate roster and invite manager
│   │   ├── profile/             # Profile settings & avatar upload
│   │   ├── invite/[token]/      # Invite acceptance screen with email match validation
│   │   ├── unauthorized/        # Invite-only access gate
│   │   └── api/                 # Secure API routes (upload, files, activities, auth, etc.)
│   ├── components/              # Reusable UI components (Navbar, UserAvatar, etc.)
│   ├── db/                      # Drizzle ORM schema & client configuration
│   ├── lib/                     # Business logic, Better Auth, and private storage services
│   └── types/                   # TypeScript definitions
├── tests/                       # Vitest integration & security test suites
├── .env.example                 # Example configuration for production & development
└── package.json
```
