import { join, relative } from 'node:path'
import { parseMemoryDoc } from '../core/parser.js'
import { filterForRenderer } from '../core/scope.js'
import type { Renderer, SyncOptions } from '../core/types.js'
import { RENDERERS } from '../renderers/registry.js'
import { readFileSafe, writeFileSafe } from '../util/fs.js'
import { sha256 } from '../util/hash.js'
import { logSkipped, logUnchanged, logWritten } from '../util/logger.js'
import { readState, writeState } from './state.js'

export interface SyncResult {
  written: number
  unchanged: number
  skipped: number
}

export async function runSyncEngine(root: string, opts: SyncOptions = {}): Promise<SyncResult> {
  const memoryPath = join(root, '.memory', 'memory.md')
  const memoryDir = join(root, '.memory')

  const raw = await readFileSafe(memoryPath)
  if (!raw) {
    console.error(`No .memory/memory.md found. Run: memsync init`)
    process.exit(1)
  }

  const doc = parseMemoryDoc(raw)
  const state = await readState(memoryDir)

  const renderers: Renderer[] = opts.only
    ? RENDERERS.filter(r => opts.only!.includes(r.id))
    : RENDERERS

  const result: SyncResult = { written: 0, unchanged: 0, skipped: 0 }

  for (const renderer of renderers) {
    const targetPath = renderer.targetPath(root)
    const relPath = relative(root, targetPath)
    const filtered = filterForRenderer(doc, renderer.id)
    const { content, warnings } = renderer.render(filtered, { rendererId: renderer.id, proEnabled: false })

    if (warnings.length > 0) warnings.forEach(w => console.warn(`  warn: ${w}`))

    const newSha = sha256(content)
    const onDisk = await readFileSafe(targetPath)
    const knownSha = state.targets[relPath]?.sha

    if (onDisk !== null) {
      const onDiskSha = sha256(onDisk)

      if (onDiskSha === newSha) {
        logUnchanged(relPath)
        result.unchanged++
        continue
      }

      // File was hand-edited if on-disk sha differs from what we last wrote
      if (knownSha && onDiskSha !== knownSha && !opts.force) {
        logSkipped(relPath, 'hand-edited (--force to override)')
        result.skipped++
        continue
      }
    }

    if (!opts.dryRun) {
      await writeFileSafe(targetPath, content)
      state.targets[relPath] = { sha: newSha, writtenAt: new Date().toISOString() }
    }

    logWritten(relPath, newSha)
    result.written++
  }

  if (!opts.dryRun) {
    await writeState(memoryDir, state)
  }

  return result
}
