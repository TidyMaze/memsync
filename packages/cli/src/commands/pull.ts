import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import { readGitConfig, getCacheDir } from '../git/config.js'
import { isInitialized, getSlugFromCwd, pull, copyOut } from '../git/cache.js'

export async function runPull(cwd: string): Promise<void> {
  const config = await readGitConfig()
  if (!config.remoteUrl) {
    console.log(pc.dim('No remote configured. Run: memsync remote add <url>'))
    return
  }

  if (!isInitialized()) {
    console.log(pc.dim('Cache not initialized. Run: memsync remote add <url>'))
    return
  }

  const result = await pull()
  if (!result.ok) {
    if (result.offline) {
      console.log(pc.yellow('⊘') + ' Offline — skipped pull')
      return
    }
    if (result.stderr?.includes("couldn't find remote ref") || result.stderr?.includes('no such ref was fetched')) {
      return
    }
    if (result.stderr?.includes('Not possible to fast-forward')) {
      console.error(
        pc.red('Diverged branches.') +
          ' Cannot fast-forward.\n' +
          pc.dim('  Resolve manually or run: memsync push --force'),
      )
      return
    }
    console.error(pc.red('Pull failed:') + '\n' + result.stderr)
    return
  }

  let slug = await getSlugFromCwd(cwd)
  const localExists = existsSync(join(cwd, '.memory', 'memory.md'))
  if (!localExists) {
    const cacheDir = getCacheDir()
    const projects = readdirSync(cacheDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '.git')
      .map((d) => d.name)
    if (projects.length === 1) slug = projects[0]
    else if (projects.length > 1) {
      console.error(
        pc.red('Multiple projects in cache:') +
          ' ' +
          projects.join(', ') +
          '\n' +
          pc.dim('  Run `memsync init` first and set the project name in frontmatter'),
      )
      return
    }
  }
  await copyOut(cwd, slug)
  console.log(pc.green('↓') + ' Pulled from remote')
}
