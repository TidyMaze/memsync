import { describe, it, expect, beforeEach } from 'vitest'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { runInit } from './init.js'

describe('init', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `memsync-init-${randomBytes(4).toString('hex')}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  it('creates .memory/memory.md with scaffold', async () => {
    await runInit(tmpDir)

    const content = readFileSync(join(tmpDir, '.memory', 'memory.md'), 'utf-8')
    expect(content).toContain('---')
    expect(content).toContain('# Project Memory')
    expect(content).toContain('version:')
    expect(content).toContain('project:')
  })

  it('aborts if file already exists', async () => {
    await runInit(tmpDir)

    // Try to init again
    await expect(runInit(tmpDir)).rejects.toThrow()
  })
})
