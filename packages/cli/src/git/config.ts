import { join } from 'node:path'
import { homedir } from 'node:os'
import { readFileSafe, writeFileSafe } from '../util/fs.js'

export interface GitConfig {
  version: number
  remoteUrl?: string
  autoPush: boolean
  autoPull: boolean
}

const DEFAULT_CONFIG: GitConfig = {
  version: 1,
  autoPush: true,
  autoPull: true,
}

export function getConfigPath(): string {
  return join(homedir(), '.memsync', 'config.json')
}

export function getCacheDir(): string {
  return join(homedir(), '.memsync', 'cache')
}

export async function readGitConfig(): Promise<GitConfig> {
  const raw = await readFileSafe(getConfigPath())
  if (!raw) return { ...DEFAULT_CONFIG }
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export async function writeGitConfig(config: GitConfig): Promise<void> {
  await writeFileSafe(getConfigPath(), JSON.stringify(config, null, 2) + '\n')
}
