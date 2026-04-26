import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const windsurf: Renderer = {
  id: 'windsurf',
  label: 'Windsurf (.windsurfrules)',
  targetPath: (root) => join(root, '.windsurfrules'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default windsurf
