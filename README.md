# memsync

Write your AI coding memory **once**, sync to **all 7 agents**. One markdown file, infinite consistency.

## Why

Every AI agent (Claude Code, Cursor, Copilot, Continue, Windsurf, Cline) has its own memory format. You're trapped:
- Edit memory in Claude Code → forget to sync to Cursor → Cursor acts on stale context
- Switch agents mid-project → lose all previous decisions and context
- Maintain 7 separate files → chaos, inconsistency, nothing syncs

**memsync** solves this: one canonical `.memory/memory.md`, syncs to all 7 agents automatically.

## Install

```bash
npm install -g @memsync/cli
# or
bun install -g @memsync/cli
```

## Quick Start

```bash
memsync init
# → creates .memory/memory.md scaffold

# Edit it with your project context, decisions, architecture notes

memsync sync
# → writes to CLAUDE.md, .cursor/rules.mdc, .github/copilot-instructions.md,
#   .continue/memory.md, .windsurfrules, .clinerules, AGENTS.md

memsync status
# → shows sync status of all 7 targets
```

## What Goes in `.memory/memory.md`

Store **project memories only** — context, decisions, architecture, observations about YOUR code:

```markdown
---
version: 1
project: my-app
---

# Architecture

- Backend: Node.js + Express
- DB: PostgreSQL with Prisma ORM
- Frontend: React 19 with Vite

# Key Decisions

## Why we use Postgres instead of MongoDB
- Strong ACID guarantees required for payment flows
- SQL queries easier to optimize for large datasets
- Team expertise skews SQL

## Why we skip TypeScript in tests
- Test code churn too high (types break often)
- Runtime errors caught by actual test execution
- Type safety less critical for test helpers

# Current Blockers

- S3 upload performance timeout at 500MB
- Need to switch to multipart upload

# API Structure

- POST /api/payments → Stripe webhook processor
- GET /api/user/:id → fetch user + balance

```

**Do NOT store** in memory:
- Linting rules, formatting preferences (those go in `.editorconfig`, `prettier.config.js`)
- Workflow procedures, how-tos (those are GitHub docs)
- Your personal notes (use a separate private file)

## Agent Format Support

| Agent | Target File | Format | MCP | Setup |
|-------|-------------|--------|-----|-------|
| **Claude Code** | `CLAUDE.md` | Plain markdown | ✓ | Automatic (reads `CLAUDE.md` as context) |
| **Cursor** | `.cursor/rules.mdc` | MDC (YAML + markdown) | ✓ | Via `.cursor/mcp.json` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Plain markdown | ✓ | VS Code settings |
| **Continue** | `.continue/memory.md` | Plain markdown | ✓ | Add as context provider in `.continue/config.json` |
| **Windsurf** | `.windsurfrules` | Plain markdown | ✓ | Via `.windsurf/mcp.json` |
| **Cline** | `.clinerules` | Plain markdown | ✓ | VS Code settings |
| **OpenAI Codex** | `AGENTS.md` | Plain markdown | ✓ | Via `~/.codex/config.toml` |

All 7 agents support **MCP** for dynamic memory queries (see [MCP Setup](#mcp-setup) below).

## Scope Directives

Target memory to specific agents using scope comments:

### Block Scope

```markdown
<!-- @scope:claude,cursor -->

# Architecture Notes

Only Claude Code and Cursor see this section.

<!-- @endscope -->
```

### Inline Scope (in headings)

```markdown
## Backend Setup <!-- @scope:!copilot -->

Everyone except Copilot sees this.
```

### Negation Syntax

- `<!-- @scope:!agent -->` = exclude agent
- `<!-- @scope:x,!y -->` = include x, exclude y

Agents with no directive → included everywhere.

## Setup per Agent

### Claude Code

1. `memsync sync` creates `CLAUDE.md`
2. Claude Code automatically reads it as context in this project

No config needed.

### Cursor

After `memsync sync`:

1. Create `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "memory": {
      "command": "memsync",
      "args": ["mcp"]
    }
  }
}
```

2. Or use Cursor's built-in `.cursor/rules.mdc` sync (auto-updated by memsync)

### GitHub Copilot

After `memsync sync`:

1. VS Code `settings.json`:
```json
{
  "github.copilot.mcp.servers": {
    "memory": {
      "command": "memsync",
      "args": ["mcp"]
    }
  }
}
```

2. Copilot reads `.github/copilot-instructions.md` by default

### Continue

After `memsync sync`:

1. `.continue/config.json`:
```json
{
  "contextProviders": [
    {
      "name": "file",
      "params": { "filepath": ".continue/memory.md" }
    }
  ],
  "mcpServers": [
    {
      "name": "memory",
      "command": "memsync",
      "args": ["mcp"]
    }
  ]
}
```

### Windsurf

After `memsync sync`:

1. `.windsurf/mcp.json`:
```json
{
  "mcpServers": {
    "memory": {
      "command": "memsync",
      "args": ["mcp"]
    }
  }
}
```

### Cline

After `memsync sync`:

1. VS Code `settings.json`:
```json
{
  "cline.mcpServers": {
    "memory": {
      "command": "memsync",
      "args": ["mcp"]
    }
  }
}
```

### OpenAI Codex

After `memsync sync`:

1. `~/.codex/config.toml`:
```toml
[mcp.servers.memory]
command = "memsync"
args = ["mcp"]
```

## Commands

### `memsync init`

Create `.memory/memory.md` scaffold with example sections.

```bash
memsync init
```

Aborts if file already exists.

### `memsync sync`

Render `.memory/memory.md` to all 7 agent formats. Updates `.memory/state.json` with content hashes.

```bash
memsync sync              # normal sync
memsync sync --dry-run    # preview without writing
memsync sync --force      # override hand-edited files
memsync sync --only=claude,cursor  # sync only these agents
```

Output:
```
CLAUDE.md              written  (sha a1b2c3d4e5f6...)
.cursor/rules.mdc      unchanged
.github/copilot...     SKIPPED  hand-edited (use --force to override)
...
Done. 2 written, 1 unchanged, 1 skipped.
```

### `memsync status`

Show sync status of all targets. Detects hand-edits, stale content, missing files.

```bash
memsync status

✓ CLAUDE.md                    in sync
✓ .cursor/rules.mdc            in sync
~ .github/copilot-...          stale (source changed, run `memsync sync`)
! .windsurfrules               hand-edited (use `memsync sync --force` to overwrite)
✗ AGENTS.md                    missing (run `memsync sync`)
```

## MCP Setup

All 7 agents support MCP. Once configured, agents can dynamically query memory without re-syncing:

```bash
memsync mcp
```

Starts an MCP server on stdio with 4 tools:

| Tool | Input | Output |
|------|-------|--------|
| `memory.read` | `{ section?: string }` | markdown (whole file or one section) |
| `memory.search` | `{ query: string, limit?: number }` | search results via ripgrep |
| `memory.list_targets` | `{}` | list of all sync targets + status |
| `memory.sync` | `{ dry?: boolean }` | run sync from MCP |

**Example** — Claude Code queries memory dynamically:

Agent: "I need context on your database schema"
Claude Code: (calls `memory.read` with section="Database Schema")
Result: markdown from `.memory/memory.md` returned in real-time

## Drift Detection

memsync tracks file hashes in `.memory/state.json`:

```json
{
  "version": 1,
  "targets": {
    "CLAUDE.md": { "sha": "a1b2c3...", "writtenAt": "2026-04-23T10:00:00Z" },
    ".cursor/rules.mdc": { "sha": "d4e5f6...", "writtenAt": "2026-04-23T10:00:00Z" }
  }
}
```

When you run `memsync sync`:
- Compares on-disk SHA with `.memory/state.json` SHA
- Match → safe to overwrite (was written by memsync)
- Mismatch → file was hand-edited → skip (print SKIPPED)
- Use `--force` to override hand-edits

This prevents overwriting agent-specific tweaks while ensuring you don't accidentally use stale memory.

## License

MIT — use freely, modify, redistribute.

## Contributing

Found a bug? Want to add an agent?

1. Fork [anthropics/memsync](https://github.com/anthropics/memsync)
2. Create branch: `git checkout -b fix/my-issue`
3. Commit: `git commit -am 'Fix X'`
4. Push: `git push origin fix/my-issue`
5. Open PR

## Acknowledgments

Built with:
- [Bun](https://bun.sh) — TypeScript runtime
- [Remark](https://github.com/remarkjs/remark) — markdown parser
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP SDK
- [Biome](https://biomejs.dev) — linter + formatter

---

**Questions?** See the [full docs](./docs) or open an issue.
