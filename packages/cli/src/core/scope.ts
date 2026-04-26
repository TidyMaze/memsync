import type { MemoryDoc, MemorySection } from './types.js'

export function filterForRenderer(doc: MemoryDoc, rendererId: string): MemoryDoc {
  const sections = doc.sections.filter(s => keepSection(s, rendererId))
  return { ...doc, sections }
}

function keepSection(section: MemorySection, rendererId: string): boolean {
  if (section.scopes.length === 0) return true
  if (!section.negated) return section.scopes.includes(rendererId)
  return !section.scopes.includes(rendererId)
}

export function docToMarkdown(doc: MemoryDoc): string {
  const fmKeys = Object.keys(doc.frontmatter)
  let out = ''

  if (fmKeys.length > 0) {
    const lines = fmKeys.map(k => {
      const v = (doc.frontmatter as Record<string, unknown>)[k]
      if (Array.isArray(v)) return `${k}:\n${v.map(i => `  - ${i}`).join('\n')}`
      if (typeof v === 'object' && v !== null) return `${k}:\n${Object.entries(v).map(([kk, vv]) => `  ${kk}: ${vv}`).join('\n')}`
      return `${k}: ${v}`
    })
    out += `---\n${lines.join('\n')}\n---\n\n`
  }

  out += doc.sections
    .map(s => `${'#'.repeat(s.level)} ${s.heading}\n\n${s.content}`)
    .join('\n\n')

  return out.trim() + '\n'
}

export function docToMarkdownBody(doc: MemoryDoc): string {
  return doc.sections
    .map(s => `${'#'.repeat(s.level)} ${s.heading}\n\n${s.content}`)
    .join('\n\n')
    .trim() + '\n'
}
