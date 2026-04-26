import pc from 'picocolors'
import { readGitConfig, writeGitConfig } from '../git/config.js'
import { cloneRemote } from '../git/cache.js'

export async function runRemoteAdd(url: string): Promise<void> {
  const config = await readGitConfig()
  config.remoteUrl = url

  console.log(pc.dim(`Cloning ${url}...`))
  const result = await cloneRemote(url)

  if (!result.ok) {
    if (result.offline) {
      await writeGitConfig(config)
      console.log(pc.yellow('⊘') + ' Offline — remote URL saved. Clone will run on next push.')
      return
    }
    console.error(pc.red('Error:') + ' Failed to clone remote\n' + result.stderr)
    process.exit(1)
  }

  await writeGitConfig(config)
  console.log(pc.green('✓') + ` Remote configured: ${url}`)
  console.log(pc.dim('  Run: memsync sync (auto-push/pull enabled by default)'))
}

export async function runRemoteShow(): Promise<void> {
  const config = await readGitConfig()
  if (!config.remoteUrl) {
    console.log(pc.dim('No remote configured. Run: memsync remote add <url>'))
    return
  }
  console.log(`Remote:    ${pc.cyan(config.remoteUrl)}`)
  console.log(`Auto-push: ${config.autoPush ? pc.green('on') : pc.dim('off')}`)
  console.log(`Auto-pull: ${config.autoPull ? pc.green('on') : pc.dim('off')}`)
}

export async function runRemoteRemove(): Promise<void> {
  const config = await readGitConfig()
  if (!config.remoteUrl) {
    console.log(pc.dim('No remote configured.'))
    return
  }
  const url = config.remoteUrl
  delete config.remoteUrl
  await writeGitConfig(config)
  console.log(pc.green('✓') + ` Remote removed: ${url}`)
  console.log(pc.dim('  Local files unchanged. Cache kept at ~/.memsync/cache/'))
}
