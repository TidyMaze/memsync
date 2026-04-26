import { describe, it, expect } from 'vitest'
import { parseMemoryDoc } from './parser.js'

describe('parser', () => {
  it('extracts frontmatter', () => {
    const doc = parseMemoryDoc(`---
version: 1
project: test
---

# Title

Body`)
    expect(doc.frontmatter.version).toBe(1)
    expect(doc.frontmatter.project).toBe('test')
  })

  it('splits sections on headings', () => {
    const doc = parseMemoryDoc(`# First

Content 1

## Second

Content 2`)
    expect(doc.sections).toHaveLength(2)
    expect(doc.sections[0].heading).toBe('First')
    expect(doc.sections[0].level).toBe(1)
    expect(doc.sections[1].heading).toBe('Second')
    expect(doc.sections[1].level).toBe(2)
  })

  it('detects block scope directives', () => {
    const doc = parseMemoryDoc(`<!-- @scope:cursor,claude -->

# Scoped Section

Content

<!-- @endscope -->

# Unscoped

More`)
    expect(doc.sections[0].scopes).toEqual(['cursor', 'claude'])
    expect(doc.sections[1].scopes).toEqual([])
  })

  it('detects inline scope directives', () => {
    const doc = parseMemoryDoc(`## Title <!-- @scope:!windsurf -->

Content`)
    expect(doc.sections[0].scopes).toEqual(['windsurf'])
    expect(doc.sections[0].negated).toBe(true)
  })

  it('handles empty file', () => {
    const doc = parseMemoryDoc('')
    expect(doc.sections).toHaveLength(0)
  })

  it('handles no frontmatter', () => {
    const doc = parseMemoryDoc(`# Title

Body`)
    expect(Object.keys(doc.frontmatter)).toHaveLength(0)
    expect(doc.sections).toHaveLength(1)
  })
})
