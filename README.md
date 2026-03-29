# sTOobyDOo

A modern, MCP-enabled collaborative todo app designed for families and teams. Built with Next.js 16, Prisma, and libsql support for edge deployment on Vercel.

## ✨ What is sTOobyDOo?

sTOobyDOo is a **family-first task management app** with a twist - it's fully **MCP (Model Context Protocol) enabled**, meaning you can control it using AI assistants like Claude, ChatGPT, Cursor, and Windsurf.

### Key Features

- 👨‍👩‍👧‍👦 **Multi-User Families**: Create a family instance with multiple members, each having their own private lists
- 🤖 **AI-Ready (MCP)**: Control your tasks via natural language using any MCP-compatible AI assistant
- 📝 **Nested Tasks**: Support for two levels of subtasks for complex projects
- 🔔 **Smart Notifications**: Pushover push notifications + Resend email notifications
- 🌓 **Modern UI**: Clean, responsive design with dark mode support
- 🔒 **Secure**: Token-based MCP authentication with granular permissions

### MCP Capabilities

Connect your favorite AI assistant and manage tasks using natural language:

- "Add 'Buy milk' to the shopping list"
- "Show me all high priority tasks"
- "Mark the grocery shopping task as complete"
- "Create a new list called 'Vacation Planning'"
- "What tasks are due this week?"

## 🚀 Quick Start

### Deploy to Vercel (Production)

The fastest way to get sTOobyDOo running:

#### 1. Create a Turso Database (Free)

```bash
# Install Turso CLI
npm install -g @tursodatabase/turso

# Login to Turso
turso auth login

# Create database
turso db create stoobydoo

# Get connection details (save these for step 2)
turso db show stoobydoo        # Copy the "URL" (libsql://...)
turso db tokens create stoobydoo  # Copy the token
```

#### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Required Environment Variables:**

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `DATABASE_URL` | `libsql://stoobydoo-[user].turso.io` | From `turso db show` |
| `DATABASE_AUTH_TOKEN` | `eyJ...` | From `turso db tokens create` |
| `NEXTAUTH_SECRET` | Generate one... | `openssl rand -base64 32` |

#### 3. Complete Setup

1. Visit your deployed URL
2. Follow the setup wizard to create your family and admin account
3. Done! Start adding tasks

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd sTOobyDOo

# Install dependencies
npm install

# Set up environment variables for local development
cp .env.example .env.local

# Edit .env.local and set:
# DATABASE_URL="file:./dev.db"
# NEXTAUTH_SECRET="any-random-string-for-development"

# Generate Prisma client
npx prisma generate

# Create local database
npx prisma db push

# Run development server
npm run dev
```

Visit `http://localhost:3000` and complete the setup wizard.

### Local Development Notes

- Uses SQLite (`file:./dev.db`) for local development
- Hot reload enabled for fast development
- Database file is in `.gitignore` (not committed)

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Database** | Prisma ORM + libsql (Turso/SQLite) |
| **Auth** | NextAuth.js (Credentials Provider) |
| **Styling** | Tailwind CSS 4 + CSS Variables |
| **Theme** | next-themes (Dark/Light mode) |
| **Notifications** | Pushover, Resend |
| **AI Protocol** | Model Context Protocol (MCP) |

### Project Structure

```
sTOobyDOo/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes (REST + MCP)
│   ├── dashboard/         # Main dashboard page
│   ├── lists/             # List management
│   ├── login/             # Authentication
│   ├── settings/          # User & admin settings
│   └── setup/             # First-time setup wizard
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout.tsx        # App shell
│   └── task-item.tsx     # Task component
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── notifications.ts  # Pushover/Resend
│   └── utils.ts          # Helper functions
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── ensure-db.js      # Safe DB initialization
└── types/
    └── index.ts          # TypeScript types
```

---

## 🤖 MCP Configuration

### What is MCP?

MCP (Model Context Protocol) allows AI assistants to interact with your sTOobyDOo instance securely. Each user can create multiple MCP tokens with different permissions.

### Setting Up MCP

1. **Log in** to your sTOobyDOo instance
2. Go to **Settings → MCP Tokens**
3. Click **Create Token**
4. Give it a name (e.g., "Claude Desktop")
5. Copy the MCP URL

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stoobydoo": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "https://your-app.vercel.app/api/mcp?token=YOUR_TOKEN"
      ]
    }
  }
}
```

### Cursor IDE

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "stoobydoo": {
      "url": "https://your-app.vercel.app/api/mcp?token=YOUR_TOKEN"
    }
  }
}
```

### Available MCP Tools (18 Total)

#### List Management

| Tool | Permission Required | Description |
|------|---------------------|-------------|
| `get_lists` | None | Get all accessible lists with open task counts |
| `get_list` | None | Get a single list by ID |
| `get_list_tasks` | None | Get all tasks in a list (includes 2 levels of subtasks) |
| `create_list` | `canCreateLists` | Create a new list with name, description, and color |
| `update_list` | `canEditLists` | Update list name, description, or color |
| `delete_list` | `canDeleteLists` | Permanently delete a list and all its tasks |

#### Task Queries

| Tool | Permission Required | Description |
|------|---------------------|-------------|
| `get_task` | None | Get full details of a task including subtasks |
| `get_all_open_tasks` | None | Get all incomplete tasks across lists |
| `get_archived_tasks` | None | Get archived tasks (optionally filter by list) |
| `search_tasks` | None | Search tasks by title or description |

#### Task Management

| Tool | Permission Required | Description |
|------|---------------------|-------------|
| `create_task` | `canCreateTasks` | Create a task with optional parent (supports 2-level nesting) |
| `complete_task` | `canCompleteTasks` | Mark a task as completed |
| `uncomplete_task` | `canEditTasks` | Mark a completed task as incomplete |
| `update_task` | `canEditTasks` | Update title, description, priority, or due date |
| `delete_task` | `canDeleteTasks` | Permanently delete a task |
| `archive_task` | `canEditTasks` | Archive a completed task (soft delete) |
| `unarchive_task` | `canEditTasks` | Restore an archived task to active |

#### Task Features

- **Nested Subtasks**: Create up to 2 levels of subtasks (task → subtask → sub-subtask)
- **Descriptions**: Add detailed descriptions to any task
- **Due Dates**: Set due dates in ISO 8601 format
- **Priority Levels**: low, medium, high
- **List Access Control**: Restrict tokens to specific lists

#### Working with Subtasks via MCP

Subtasks are fully supported through MCP. Here's how to work with them:

**Creating a Subtask:**
```json
{
  "listId": "list-uuid",
  "title": "Buy milk",
  "parentId": "parent-task-uuid"
}
```
- Use `create_task` with a `parentId` to create a subtask
- Maximum nesting: 2 levels deep (task → subtask → sub-subtask)

**Managing Subtasks:**
- All task operations work on subtasks using their ID
- Use `get_task` with a parent task ID to see its subtasks
- `complete_task`, `update_task`, `delete_task` all work with subtask IDs

**Example Workflow:**
1. Create main task: `create_task` → returns task ID
2. Create subtask: `create_task` with `parentId` set to main task ID
3. Complete subtask: `complete_task` with subtask ID
4. When all subtasks complete, complete main task

### Default MCP Token Permissions

When creating a new MCP token, these are the default permissions:

| Permission | Default | Description |
|------------|---------|-------------|
| `canCreateTasks` | ✅ true | Create new tasks |
| `canCompleteTasks` | ✅ true | Mark tasks as complete |
| `canEditTasks` | ✅ true | Edit task details |
| `canDeleteTasks` | ❌ false | Permanently delete tasks |
| `canCreateLists` | ❌ false | Create new lists |
| `canEditLists` | ❌ false | Edit list details |
| `canDeleteLists` | ❌ false | Delete lists |
| `allowAllLists` | ✅ true | Access to all lists (or select specific ones) |

---

## 📋 Environment Variables

### Required for All Deployments

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `file:./dev.db` or `libsql://db.turso.io` |
| `DATABASE_AUTH_TOKEN` | Auth token for remote DB | `eyJhbGci...` (required for Turso) |
| `NEXTAUTH_SECRET` | JWT encryption secret | Random 32+ char string |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (auto-detected on Vercel) |
| `PUSHOVER_APP_TOKEN` | Pushover app token |
| `PUSHOVER_USER_KEY` | Default Pushover user key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | From email address |

---

## 🔒 Data Safety

**Your data is safe during redeploys.** The app uses a smart initialization script (`scripts/ensure-db.js`) that:

- ✅ Only creates tables on **first deploy**
- ✅ **Skips database changes** on subsequent redeploys
- ✅ **Never deletes** existing data automatically

See [DATA_SAFETY.md](DATA_SAFETY.md) for complete details.

---

## 📝 Database Options

sTOobyDOo supports any libsql-compatible database:

| Provider | Use Case | URL Format |
|----------|----------|------------|
| **SQLite** | Local development | `file:./dev.db` |
| **Turso** | Production (recommended) | `libsql://db.turso.io` |
| **Bunny Database** | Production | `libsql://db.bunny.net` |

---

## 🧪 Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Push schema changes
npm run db:push:force    # Push with data loss flag
npm run db:studio        # Open Prisma Studio

# Build
npm run build            # Production build
npm run build:vercel     # Vercel build (with DB check)
```

---

## 🐛 Troubleshooting

### "Database connection failed"

- Verify `DATABASE_URL` is correct
- For Turso: ensure `DATABASE_AUTH_TOKEN` is set
- Check Turso database exists: `turso db list`

### "Unauthorized" during build

- `DATABASE_AUTH_TOKEN` is required for remote libsql URLs
- Token may have expired - create a new one

### First request is slow

Turso databases sleep after inactivity. First request wakes it up (5-10 seconds).

### Setup wizard keeps showing

This means no family exists yet. Complete the wizard to create the initial family.

---

## 📄 License

MIT License - feel free to use this for personal or commercial projects!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 💬 Support

- Create an issue for bugs or feature requests
- Check existing issues before creating new ones

---

**Built with ❤️ for families who get things done together.**
