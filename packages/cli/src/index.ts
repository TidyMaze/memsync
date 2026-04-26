import { defineCommand, runMain } from 'citty'
import { runInit } from './commands/init.js'
import { runMcp } from './commands/mcp.js'
import { runStatus } from './commands/status.js'
import { runSync } from './commands/sync.js'
import { runPush } from './commands/push.js'
import { runPull } from './commands/pull.js'
import { runRemoteAdd, runRemoteShow, runRemoteRemove } from './commands/remote.js'

const main = defineCommand({
  meta: {
    name: 'memsync',
    description: 'Sync .memory/memory.md to all AI agent formats',
    version: '0.1.0',
  },
  subCommands: {
    init: defineCommand({
      meta: { description: 'Create .memory/memory.md scaffold' },
      async run() {
        await runInit(process.cwd())
      },
    }),
    sync: defineCommand({
      meta: { description: 'Sync memory to all agent formats' },
      args: {
        'dry-run': { type: 'boolean', description: 'Preview without writing' },
        force: { type: 'boolean', description: 'Override hand-edited files' },
        only: { type: 'string', description: 'Comma-separated renderer IDs' },
      },
      async run({ args }) {
        await runSync(process.cwd(), {
          dryRun: args['dry-run'],
          force: args.force,
          only: args.only?.split(','),
        })
      },
    }),
    status: defineCommand({
      meta: { description: 'Show sync status of all targets' },
      async run() {
        await runStatus(process.cwd())
      },
    }),
    mcp: defineCommand({
      meta: { description: 'Start MCP server for memory queries' },
      async run() {
        await runMcp()
      },
    }),
    push: defineCommand({
      meta: { description: 'Push memory to git remote' },
      args: {
        message: { type: 'string', description: 'Commit message' },
      },
      async run({ args }) {
        await runPush(process.cwd(), { message: args.message })
      },
    }),
    pull: defineCommand({
      meta: { description: 'Pull memory from git remote' },
      async run() {
        await runPull(process.cwd())
      },
    }),
    remote: defineCommand({
      meta: { description: 'Manage git remote for cross-device sync' },
      subCommands: {
        add: defineCommand({
          meta: { description: 'Add a git remote URL' },
          args: {
            url: { type: 'positional', description: 'Remote git URL', required: true },
          },
          async run({ args }) {
            await runRemoteAdd(args.url)
          },
        }),
        show: defineCommand({
          meta: { description: 'Show git remote config' },
          async run() {
            await runRemoteShow()
          },
        }),
        remove: defineCommand({
          meta: { description: 'Remove git remote' },
          async run() {
            await runRemoteRemove()
          },
        }),
      },
    }),
  },
})

runMain(main)
