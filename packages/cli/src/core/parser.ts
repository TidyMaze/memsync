import matter from 'gray-matter'
import type { MemoryDoc, MemoryFrontmatter, MemorySection } from './types.js'

const SCOPE_OPEN_RE = /^<!--\s*@scope:(.*?)\s*-->$/
const SCOPE_CLOSE_RE = /^<!--\s*@endscope\s*-->$/
const INLINE_SCOPE_RE = /\s*<!--\s*@scope:(.*?)\s*-->$/

export function parseMemoryDoc(raw: string): MemoryDoc {
  const { data: frontmatter, content } = matter(raw)

  const lines = content.split('\n')
  const sections: MemorySection[] = []

  let blockScopes: string[] = []
  let blockNegated = false
  let currentSection: MemorySection | null = null
  let currentLines: string[] = []

  function flush() {
    if (currentSection) {
      currentSection.content = currentLines.join('\n').trim()
      sections.push(currentSection)
      currentSection = null
      currentLines = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (SCOPE_CLOSE_RE.test(trimmed)) {
      blockScopes = []
      blockNegated = false
      continue
    }

    const scopeMatch = SCOPE_OPEN_RE.exec(trimmed)
    if (scopeMatch) {
      const raw = scopeMatch[1].trim()
      blockNegated = raw.startsWith('!')
      blockScopes = raw.replace(/^!/, '').split(',').map(s => s.trim()).filter(Boolean)
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      flush()
      const level = headingMatch[1].length
      let heading = headingMatch[2]
      let scopes = [...blockScopes]
      let negated = blockNegated

      const inlineMatch = INLINE_SCOPE_RE.exec(heading)
      if (inlineMatch) {
        heading = heading.replace(INLINE_SCOPE_RE, '').trim()
        const inlineRaw = inlineMatch[1].trim()
        negated = inlineRaw.startsWith('!')
        scopes = inlineRaw.replace(/^!/, '').split(',').map(s => s.trim()).filter(Boolean)
      }

      currentSection = { heading, level, content: '', scopes, negated }
      currentLines = []
      continue
    }

    if (currentSection) currentLines.push(line)
  }

  flush()

  return { frontmatter: frontmatter as MemoryFrontmatter, sections, raw }
}
