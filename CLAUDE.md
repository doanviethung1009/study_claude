# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/path/to/file.test.ts

# Reset database
npm run db:reset
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already baked into the npm scripts) due to Node.js compatibility shims.

Set `ANTHROPIC_API_KEY` in `.env` to use Claude for generation. Without it, a mock provider returns static code instead.

## Code Style

Use comments sparingly. Only comment complex or non-obvious code.

## Architecture

### High-Level Flow

The app is a two-panel UI: a chat on the left and a live preview/code editor on the right. The user describes a React component; Claude generates it via tool calls that write to an in-memory virtual file system; the preview iframe hot-reloads automatically.

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` is a pure in-memory FS (no disk I/O). It holds all generated component files. The VFS is serialized to/from JSON for persistence in the database (`Project.data` column stores it as a JSON string).

`src/lib/contexts/file-system-context.tsx` — React context wrapping the VFS. Components call `useFileSystem()` to read/write files. `handleToolCall()` translates AI tool invocations (`str_replace_editor`, `file_manager`) directly into VFS mutations, which then trigger the preview to refresh via `refreshTrigger`.

### AI Integration

`src/app/api/chat/route.ts` — streaming POST endpoint using Vercel AI SDK (`streamText`). It:
1. Prepends the system prompt (`src/lib/prompts/generation.tsx`) with prompt caching.
2. Reconstructs the VFS from client-sent `files`.
3. Provides two tools to the model: `str_replace_editor` (create/edit files via str_replace or insert) and `file_manager` (rename/delete files).
4. On finish, saves messages + VFS snapshot to the DB if the user is authenticated.

`src/lib/tools/` — tool builders that operate on the VFS instance.

`src/lib/provider.ts` — returns the configured language model; falls back to a mock when no API key is set.

### Preview

`src/lib/transform/jsx-transformer.ts` — takes the VFS file map and:
1. Transpiles each `.js/.jsx/.ts/.tsx` file with Babel standalone.
2. Creates blob URLs for each transformed file.
3. Builds an ES module import map (resolves local imports and third-party packages via `esm.sh`).
4. Returns full preview HTML that loads React 19 and renders the component in an `<iframe>`.

`src/components/preview/PreviewFrame.tsx` — re-runs the transform pipeline whenever `refreshTrigger` changes, then sets `iframe.srcdoc`.

### Auth & Persistence

`src/lib/auth.ts` (server-only) — JWT sessions via `jose`, stored in an `httpOnly` cookie (`auth-token`). Sessions expire in 7 days.

`src/middleware.ts` — protects routes as needed.

`prisma/schema.prisma` — SQLite database with two models: `User` and `Project`. The `Project` model stores `messages` (JSON array) and `data` (serialized VFS).

Prisma client is generated to `src/generated/prisma/` (not the default location).

`src/lib/anon-work-tracker.ts` — `sessionStorage`-based tracker so anonymous users can save work before signing up.

### Key Contexts

- `FileSystemProvider` — wraps the whole app; owns the VFS instance and exposes file operations + `handleToolCall`.
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) — manages Vercel AI SDK `useChat` state, wires AI tool call results back into `handleToolCall`.

### Routing

- `/` — new session (server component, checks auth, renders `MainContent`).
- `/[projectId]` — loads a saved project from DB and passes it to `MainContent`.
