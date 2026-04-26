import { hostname } from 'node:os'
import { join } from 'node:path'
import pc from 'picocolors'
import { readGitConfig } from '../git/config.js'
import { isInitialized, getSlugFromCwd, copyIn, push } from '../git/cache.js'
import { readFileSafe } from '../util/fs.js'

export async function runPush(cwd: string, opts: { message?: string } = {}): Promise<void> {
  const config = await readGitConfig()
  if (!config.remoteUrl) {
    console.log(pc.dim('No remote configured. Run: memsync remote add <url>'))
    return
  }

  if (!isInitialized()) {
    console.log(pc.dim('Cache not initialized. Run: memsync remote add <url>'))
    return
  }

  const raw = await readFileSafe(join(cwd, '.memory', 'memory.md'))
  if (!raw) {
    console.error('No .memory/memory.md found.')
    return
  }

  const slug = await getSlugFromCwd(cwd)
  await copyIn(cwd, slug)

  const host = hostname()
  const date = new Date().toISOString()
  const message = opts.message ?? `sync: ${host} ${date}`

  const result = await push(message)
  if (!result.ok) {
    if (result.offline) {
      console.log(pc.yellow('⊘') + ' Offline — skipped push')
      return
    }
    console.error(pc.red('Push failed:') + '\n' + result.stderr)
    return
  }

  if (result.stdout === 'nothing to commit') {
    console.log(pc.dim('↑ Nothing to push (no changes)'))
  } else {
    console.log(pc.green('↑') + ' Pushed to remote')
  }
}
