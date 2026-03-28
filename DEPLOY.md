# Zero-Config Deployment Guide

This app is configured to **automatically set up the database** during the first deployment. No manual database migration needed!

## Quick Deploy (3 Steps)

### Step 1: Create Turso Database

```bash
# Install Turso CLI
npm install -g @tursodatabase/turso

# Login
turso auth login

# Create database
turso db create stoobydoo

# Get these values for the next step:
turso db show stoobydoo      # Copy the "URL"
turso db tokens create stoobydoo  # Copy the token
```

### Step 2: Deploy to Vercel

Click the button below and enter the values from Step 1:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Required Environment Variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `libsql://your-db.turso.io` (from `turso db show`) |
| `DATABASE_AUTH_TOKEN` | Token from `turso db tokens create` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate |

### Step 3: Complete Setup

1. Visit your deployed URL
2. Fill out the setup wizard (family name, admin account)
3. Done! Start using the app

---

## How It Works

The build process automatically runs:

```bash
prisma generate && prisma db push --accept-data-loss && next build
```

This means:
- ✅ Database schema is created automatically
- ✅ Tables are initialized on first deploy
- ✅ No manual migration needed
- ✅ Works with fresh Turso databases

---

## Alternative: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (interactive)
vercel

# Or deploy to production directly
vercel --prod
```

Then set environment variables in the Vercel dashboard.

---

## Environment Variables Explained

### `DATABASE_URL`
Your Turso database connection URL.

**Format:** `libsql://[database-name]-[username].turso.io`

**Get it:** `turso db show stoobydoo`

### `DATABASE_AUTH_TOKEN`
Authentication token for your Turso database.

**Get it:** `turso db tokens create stoobydoo`

### `NEXTAUTH_SECRET`
Random string used to encrypt JWT tokens.

**Generate:**
```bash
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

---

## Troubleshooting

### "Database does not exist"

Make sure you created the database:
```bash
turso db list
```

If not, create it:
```bash
turso db create stoobydoo
```

### "Unauthorized" during build

Check your auth token:
```bash
turso db tokens list stoobydoo
```

Create a new one if needed:
```bash
turso db tokens create stoobydoo
```

Then update the `DATABASE_AUTH_TOKEN` in Vercel.

### Build fails with database error

Make sure both `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are set in Vercel's environment variables.

### First request is slow

Turso databases sleep after inactivity. The first request wakes it up (takes 5-10 seconds). Subsequent requests are fast.

---

## Local Development (Optional)

If you want to run locally first:

```bash
# Use SQLite for local dev
echo 'DATABASE_URL="file:./dev.db"' > .env.local
echo 'NEXTAUTH_SECRET="dev-secret-change-in-production"' >> .env.local

# Install and run
npm install
npm run dev
```

Then visit `http://localhost:3000`

---

## Switching from Local to Production

If you started with SQLite locally and want to move to Turso:

1. Create Turso database (Step 1 above)
2. Deploy to Vercel with Turso credentials (Step 2)
3. The new database will be auto-initialized
4. Complete the setup wizard on the deployed version

That's it! No data migration needed for a fresh deployment.
