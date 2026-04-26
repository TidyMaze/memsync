import { describe, it, expect } from 'vitest'
import claude from './claude.js'
import type { MemoryDoc } from '../core/types.js'

describe('claude renderer', () => {
  const doc: MemoryDoc = {
    frontmatter: { version: 1, project: 'test' },
    sections: [
      { heading: 'Title', level: 1, content: 'Body content', scopes: [], negated: false },
    ],
    raw: '',
  }

  it('strips source frontmatter', () => {
    const result = claude.render(doc, { rendererId: 'claude', proEnabled: false })
    expect(result.content).toContain('# Title')
    expect(result.content).toContain('Body content')
    expect(result.content).not.toContain('version: 1')
  })

  it('targets correct path', () => {
    expect(claude.targetPath('/root')).toBe('/root/CLAUDE.md')
  })
})
