import { execFileSync } from 'node:child_process'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import { existsSync, mkdirSync } from 'node:fs'
import { readFileSafe, writeFileSafe } from '../util/fs.js'
import { sha256 } from '../util/hash.js'
import { parseMemoryDoc } from '../core/parser.js'
import { getCacheDir } from './config.js'

export interface GitResult {
  ok: boolean
  stdout?: string
  stderr?: string
  offline?: boolean
}

const OFFLINE_PATTERNS = [
  'Could not resolve host',
  'Connection refused',
  'Network unreachable',
  'timeout',
  'timed out',
  'No route to host',
]

function isOfflineError(stderr: string): boolean {
  return OFFLINE_PATTERNS.some((p) => stderr.includes(p))
}

async function git(args: string[], opts?: { cwd?: string }): Promise<GitResult> {
  const cwd = opts?.cwd ?? getCacheDir()
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return { ok: true, stdout }
  } catch (err: any) {
    const stderr = err.stderr?.toString?.() ?? err.message ?? ''
    if (isOfflineError(stderr)) return { ok: false, offline: true, stderr }
    return { ok: false, stderr }
  }
}

export function isInitialized(): boolean {
  return existsSync(join(getCacheDir(), '.git'))
}

export async function cloneRemote(url: string): Promise<GitResult> {
  const cacheDir = getCacheDir()
  if (existsSync(join(cacheDir, '.git'))) {
    return git(['remote', 'set-url', 'origin', url])
  }
  const parent = join(homedir(), '.memsync')
  mkdirSync(parent, { recursive: true })
  try {
    execFileSync('git', ['clone', url, 'cache'], {
      cwd: parent,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true }
  } catch (err: any) {
    const stderr = err.stderr?.toString?.() ?? err.message ?? ''
    if (isOfflineError(stderr)) return { ok: false, offline: true, stderr }
    return { ok: false, stderr }
  }
}

export async function pull(): Promise<GitResult> {
  return git(['pull', '--ff-only', 'origin'])
}

export async function push(message: string): Promise<GitResult> {
  await git(['add', '.'])

  const status = await git(['status', '--porcelain'])
  if (status.ok && !status.stdout) {
    return { ok: true, stdout: 'nothing to commit' }
  }

  const commit = await git(['commit', '-m', message])
  if (!commit.ok) {
    if (commit.stderr?.includes('nothing to commit')) return { ok: true, stdout: 'nothing to commit' }
    return commit
  }

  return git(['push', 'origin'])
}

export function getSlug(cwd: string, projectName?: string): string {
  const raw = projectName ?? basename(cwd)
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'default'
  )
}

export async function getSlugFromCwd(cwd: string): Promise<string> {
  const raw = await readFileSafe(join(cwd, '.memory', 'memory.md'))
  const doc = raw ? parseMemoryDoc(raw) : null
  return getSlug(cwd, doc?.frontmatter.project)
}

export async function copyIn(cwd: string, slug: string): Promise<void> {
  const src = join(cwd, '.memory', 'memory.md')
  const dst = join(getCacheDir(), slug, 'memory.md')
  const content = await readFileSafe(src)
  if (content !== null) await writeFileSafe(dst, content)
}

export async function copyOut(cwd: string, slug: string): Promise<void> {
  const src = join(getCacheDir(), slug, 'memory.md')
  const dst = join(cwd, '.memory', 'memory.md')
  const content = await readFileSafe(src)
  if (content !== null) await writeFileSafe(dst, content)
}

export async function hasLocalChanges(cwd: string, slug: string): Promise<boolean> {
  const localPath = join(cwd, '.memory', 'memory.md')
  const cachePath = join(getCacheDir(), slug, 'memory.md')
  const local = await readFileSafe(localPath)
  const cache = await readFileSafe(cachePath)
  if (local === null) return false
  if (cache === null) return true
  return sha256(local) !== sha256(cache)
}

export function getAheadBehind(): { ahead: number; behind: number } {
  return { ahead: 0, behind: 0 }
}
