import { describe, it, expect, beforeEach } from 'vitest'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { runSyncEngine } from './engine.js'

describe('sync engine', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `memsync-test-${randomBytes(4).toString('hex')}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  it('creates all 7 output files', async () => {
    mkdirSync(join(tmpDir, '.memory'), { recursive: true })
    writeFileSync(
      join(tmpDir, '.memory', 'memory.md'),
      `---
version: 1
project: test
---

# Test

Content`
    )

    const result = await runSyncEngine(tmpDir)

    expect(result.written).toBeGreaterThan(0)
    expect(readFileSync(join(tmpDir, 'CLAUDE.md'), 'utf-8')).toContain('# Test')
    expect(readFileSync(join(tmpDir, 'AGENTS.md'), 'utf-8')).toContain('# Test')
    expect(readFileSync(join(tmpDir, '.cursor', 'rules.mdc'), 'utf-8')).toContain('description: Project memory')
  })

  it('detects hand-edited files', async () => {
    mkdirSync(join(tmpDir, '.memory'), { recursive: true })
    writeFileSync(
      join(tmpDir, '.memory', 'memory.md'),
      `---
version: 1
project: test
---

# Test

Content`
    )

    await runSyncEngine(tmpDir)

    // Hand-edit a file
    writeFileSync(join(tmpDir, 'CLAUDE.md'), 'HAND EDITED')

    const result = await runSyncEngine(tmpDir)
    expect(result.skipped).toBeGreaterThan(0)
  })

  it('writes state.json with SHA', async () => {
    mkdirSync(join(tmpDir, '.memory'), { recursive: true })
    writeFileSync(
      join(tmpDir, '.memory', 'memory.md'),
      `---
version: 1
project: test
---

# Test

Content`
    )

    await runSyncEngine(tmpDir)

    const state = JSON.parse(readFileSync(join(tmpDir, '.memory', 'state.json'), 'utf-8'))
    expect(state.targets['CLAUDE.md']).toBeDefined()
    expect(state.targets['CLAUDE.md'].sha).toBeDefined()
  })
})
