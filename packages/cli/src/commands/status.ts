import { join, relative } from 'node:path'
import { parseMemoryDoc } from '../core/parser.js'
import { filterForRenderer } from '../core/scope.js'
import { RENDERERS } from '../renderers/registry.js'
import { readFileSafe } from '../util/fs.js'
import { sha256 } from '../util/hash.js'
import { logHandEdited, logInSync, logMissing, logStale } from '../util/logger.js'
import { readState } from '../sync/state.js'
import { readGitConfig } from '../git/config.js'
import { isInitialized, getAheadBehind } from '../git/cache.js'
import pc from 'picocolors'

export async function runStatus(cwd: string): Promise<void> {
  const memoryPath = join(cwd, '.memory', 'memory.md')
  const memoryDir = join(cwd, '.memory')

  const raw = await readFileSafe(memoryPath)
  if (!raw) {
    console.error('No .memory/memory.md found. Run: memsync init')
    process.exit(1)
  }

  const doc = parseMemoryDoc(raw)
  const state = await readState(memoryDir)

  for (const renderer of RENDERERS) {
    const targetPath = renderer.targetPath(cwd)
    const relPath = relative(cwd, targetPath)
    const filtered = filterForRenderer(doc, renderer.id)
    const { content } = renderer.render(filtered, { rendererId: renderer.id, proEnabled: false })

    const newSha = sha256(content)
    const onDisk = await readFileSafe(targetPath)
    const knownSha = state.targets[relPath]?.sha

    if (onDisk === null) {
      logMissing(relPath)
      continue
    }

    const onDiskSha = sha256(onDisk)

    if (knownSha && onDiskSha !== knownSha) {
      logHandEdited(relPath)
      continue
    }

    if (onDiskSha !== newSha) {
      logStale(relPath)
      continue
    }

    logInSync(relPath)
  }

  const gitConfig = await readGitConfig()
  if (gitConfig.remoteUrl) {
    console.log('')
    console.log(`Remote: ${pc.cyan(gitConfig.remoteUrl)}`)
    if (isInitialized()) {
      const { ahead, behind } = getAheadBehind()
      if (ahead > 0 || behind > 0) {
        console.log(`  ${pc.yellow(`↑${ahead} ↓${behind}`)} commits ahead/behind`)
      } else {
        console.log(`  ${pc.green('✓')} up to date`)
      }
    } else {
      console.log(`  ${pc.dim('cache not initialized — run: memsync remote add <url>')}`)
    }
  }
}
