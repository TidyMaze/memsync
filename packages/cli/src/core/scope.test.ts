import { describe, it, expect } from 'vitest'
import { filterForRenderer } from './scope.js'
import type { MemoryDoc } from './types.js'

describe('scope', () => {
  const baseDoc: MemoryDoc = {
    frontmatter: {},
    sections: [
      { heading: 'No Scope', level: 1, content: 'All agents', scopes: [], negated: false },
      { heading: 'Cursor Only', level: 1, content: 'Cursor only', scopes: ['cursor'], negated: false },
      { heading: 'Not Windsurf', level: 1, content: 'Everyone but windsurf', scopes: ['windsurf'], negated: true },
      { heading: 'Multi Scope', level: 1, content: 'Claude or copilot', scopes: ['claude', 'copilot'], negated: false },
    ],
    raw: '',
  }

  it('keeps sections with no scope for all renderers', () => {
    const filtered = filterForRenderer(baseDoc, 'claude')
    expect(filtered.sections.some((s) => s.heading === 'No Scope')).toBe(true)
  })

  it('filters by include scope', () => {
    const filtered = filterForRenderer(baseDoc, 'cursor')
    expect(filtered.sections.some((s) => s.heading === 'Cursor Only')).toBe(true)
    expect(filtered.sections.some((s) => s.heading === 'No Scope')).toBe(true)
    expect(filtered.sections.some((s) => s.heading === 'Multi Scope')).toBe(false)
  })

  it('filters by negated scope', () => {
    const filtered = filterForRenderer(baseDoc, 'claude')
    expect(filtered.sections.some((s) => s.heading === 'Not Windsurf')).toBe(true)

    const filtered2 = filterForRenderer(baseDoc, 'windsurf')
    expect(filtered2.sections.some((s) => s.heading === 'Not Windsurf')).toBe(false)
  })

  it('respects multi-scope inclusion', () => {
    const filtered = filterForRenderer(baseDoc, 'claude')
    expect(filtered.sections.some((s) => s.heading === 'Multi Scope')).toBe(true)

    const filtered2 = filterForRenderer(baseDoc, 'agents')
    expect(filtered2.sections.some((s) => s.heading === 'Multi Scope')).toBe(false)
  })
})
