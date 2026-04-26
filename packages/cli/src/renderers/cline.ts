import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const cline: Renderer = {
  id: 'cline',
  label: 'Cline (.clinerules)',
  targetPath: (root) => join(root, '.clinerules'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default cline
