import { join } from 'node:path'
import { readFileSafe, writeFileSafe } from '../util/fs.js'

export interface TargetState {
  sha: string
  writtenAt: string
}

export interface SyncState {
  version: number
  targets: Record<string, TargetState>
}

export function statePath(memoryDir: string): string {
  return join(memoryDir, 'state.json')
}

export async function readState(memoryDir: string): Promise<SyncState> {
  const raw = await readFileSafe(statePath(memoryDir))
  if (!raw) return { version: 1, targets: {} }
  try {
    return JSON.parse(raw) as SyncState
  } catch {
    return { version: 1, targets: {} }
  }
}

export async function writeState(memoryDir: string, state: SyncState): Promise<void> {
  await writeFileSafe(statePath(memoryDir), JSON.stringify(state, null, 2) + '\n')
}
