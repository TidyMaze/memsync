import pc from 'picocolors'
import type { SyncOptions } from '../core/types.js'
import { runSyncEngine } from '../sync/engine.js'
import { readGitConfig } from '../git/config.js'
import { isInitialized, hasLocalChanges, getSlugFromCwd } from '../git/cache.js'
import { runPull } from './pull.js'
import { runPush } from './push.js'

export async function runSync(cwd: string, opts: SyncOptions = {}): Promise<void> {
  if (opts.dryRun) console.log(pc.dim('Dry run — no files will be written\n'))

  if (!opts.noPull && !opts.dryRun) {
    const config = await readGitConfig()
    if (config.remoteUrl && config.autoPull && isInitialized()) {
      const slug = await getSlugFromCwd(cwd)
      const localChanged = await hasLocalChanges(cwd, slug)
      if (!localChanged) {
        await runPull(cwd)
      } else {
        console.log(pc.dim('⊘ Local edits detected — skipped pull (will push)'))
      }
    }
  }

  const result = await runSyncEngine(cwd, opts)

  console.log(
    `\n${pc.bold('Done.')} ${result.written} written, ${result.unchanged} unchanged, ${result.skipped} skipped.`,
  )

  if (!opts.noPush && !opts.dryRun) {
    const config = await readGitConfig()
    if (config.remoteUrl && config.autoPush && isInitialized()) {
      await runPush(cwd)
    }
  }
}
