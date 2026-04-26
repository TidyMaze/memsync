import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const continueRenderer: Renderer = {
  id: 'continue',
  label: 'Continue (.continue/memory.md)',
  targetPath: (root) => join(root, '.continue', 'memory.md'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default continueRenderer
