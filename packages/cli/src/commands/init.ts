import { existsSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import { writeFileSafe, readFileSafe } from '../util/fs.js'

const SCAFFOLD = `---
version: 1
project: my-project
---

# Project Memory

Core instructions for all AI coding agents working on this project.

## Tech Stack

- Language: TypeScript
- Runtime: Bun
- Testing: Vitest

## Conventions

- Use single quotes
- No semicolons
- Prefer \`const\` over \`let\`

<!-- @scope:cursor -->
## Cursor-specific

Use Composer for large refactors across multiple files.
<!-- @endscope -->
`

async function addToGitignore(cwd: string): Promise<void> {
  const gitignorePath = join(cwd, '.gitignore')
  const existing = (await readFileSafe(gitignorePath)) ?? ''
  const lines = existing.split('\n')
  if (lines.some((l) => l.trim() === '.memory/')) return
  const updated = existing.trimEnd() + (existing ? '\n' : '') + '.memory/\n'
  await writeFileSafe(gitignorePath, updated)
  console.log(pc.dim('  Added .memory/ to .gitignore'))
}

export async function runInit(cwd: string): Promise<void> {
  const memoryPath = join(cwd, '.memory', 'memory.md')

  if (existsSync(memoryPath)) {
    console.error(pc.red('Error:') + ' .memory/memory.md already exists')
    process.exit(1)
  }

  await writeFileSafe(memoryPath, SCAFFOLD)
  console.log(pc.green('✓') + ' Created .memory/memory.md')
  console.log(pc.dim('  Edit it, then run: memsync sync'))

  if (existsSync(join(cwd, '.git'))) {
    await addToGitignore(cwd)
  }
}
