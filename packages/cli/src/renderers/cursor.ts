import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const cursor: Renderer = {
  id: 'cursor',
  label: 'Cursor (.cursor/rules.mdc)',
  targetPath: (root) => join(root, '.cursor', 'rules.mdc'),
  mode: 'transform',
  render(doc) {
    const body = docToMarkdownBody(doc)
    const content = `---\ndescription: Project memory\nglobs: "**"\nalwaysApply: true\n---\n\n${body}`
    return { content, warnings: [] }
  },
}

export default cursor
