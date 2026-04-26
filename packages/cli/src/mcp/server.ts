import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { parseMemoryDoc } from '../core/parser.js'
import { getRenderer } from '../renderers/registry.js'
import { runSyncEngine } from '../sync/engine.js'
import type { MemoryDoc } from '../core/types.js'

const server = new Server(
  {
    name: 'memsync-memory',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

let cachedDoc: MemoryDoc | null = null
let lastMtime: number = 0

function getCwd(): string {
  try {
    return execSync('pwd', { encoding: 'utf-8' }).trim()
  } catch {
    return process.cwd()
  }
}

function readAndCacheDoc(): MemoryDoc {
  const cwd = getCwd()
  const memPath = join(cwd, '.memory', 'memory.md')
  try {
    const stat = execSync(`stat -f %m "${memPath}" 2>/dev/null || stat -c %Y "${memPath}"`, {
      encoding: 'utf-8',
    }).trim()
    const mtime = parseInt(stat, 10)
    if (cachedDoc && mtime === lastMtime) return cachedDoc
    lastMtime = mtime

    const content = readFileSync(memPath, 'utf-8')
    cachedDoc = parseMemoryDoc(content)
    return cachedDoc
  } catch {
    throw new Error('Could not read .memory/memory.md')
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'memory.read',
      description: 'Read project memory or a specific section',
      inputSchema: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            description: 'Optional section heading to read (e.g. "Tech Stack")',
          },
        },
      },
    },
    {
      name: 'memory.search',
      description: 'Search project memory using regex',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Regex pattern to search for' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'memory.list_targets',
      description: 'List all sync targets and their status',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'memory.sync',
      description: 'Run memory sync across all agents',
      inputSchema: {
        type: 'object',
        properties: {
          dry: { type: 'boolean', description: 'Dry run (no writes)' },
        },
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const cwd = getCwd()

  switch (request.params.name) {
    case 'memory.read': {
      const doc = readAndCacheDoc()
      const { section } = request.params.arguments as { section?: string }
      if (section) {
        const sec = doc.sections.find((s) => s.heading === section)
        if (!sec) return { content: [{ type: 'text', text: `Section "${section}" not found` }] }
        return { content: [{ type: 'text', text: `# ${sec.heading}\n\n${sec.content}` }] }
      }
      const body = doc.sections
        .map((s) => `${'#'.repeat(s.level)} ${s.heading}\n\n${s.content}`)
        .join('\n\n')
      return { content: [{ type: 'text', text: body }] }
    }

    case 'memory.search': {
      const { query, limit = 10 } = request.params.arguments as { query: string; limit?: number }
      const memPath = join(cwd, '.memory', 'memory.md')
      try {
        const results = execSync(
          `rg --json -n -e "${query.replace(/"/g, '\\"')}" "${memPath}" 2>/dev/null`,
          { encoding: 'utf-8' }
        )
          .split('\n')
          .filter((line) => line.trim())
          .slice(0, limit)
          .map((line) => {
            const match = JSON.parse(line)
            if (match.type === 'match') {
              return `Line ${match.data.line_number}: ${match.data.lines.text}`
            }
            return null
          })
          .filter(Boolean)
          .join('\n')

        return { content: [{ type: 'text', text: results || 'No matches found' }] }
      } catch {
        return { content: [{ type: 'text', text: 'Search error or no matches' }] }
      }
    }

    case 'memory.list_targets': {
      const results = getRenderer('claude')
        ? [
            { id: 'claude', path: 'CLAUDE.md' },
            { id: 'agents', path: 'AGENTS.md' },
            { id: 'cursor', path: '.cursor/rules.mdc' },
            { id: 'copilot', path: '.github/copilot-instructions.md' },
            { id: 'continue', path: '.continue/memory.md' },
            { id: 'windsurf', path: '.windsurfrules' },
            { id: 'cline', path: '.clinerules' },
          ]
        : []
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      }
    }

    case 'memory.sync': {
      const { dry = false } = request.params.arguments as { dry?: boolean }
      try {
        const result = await runSyncEngine(cwd, { dryRun: dry })
        const text = `Written: ${result.written}, Unchanged: ${result.unchanged}, Skipped: ${result.skipped}`
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return { content: [{ type: 'text', text: `Sync error: ${String(err)}` }] }
      }
    }

    default:
      return { content: [{ type: 'text', text: 'Unknown tool' }] }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
