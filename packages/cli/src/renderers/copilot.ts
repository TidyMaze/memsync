import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const copilot: Renderer = {
  id: 'copilot',
  label: 'GitHub Copilot (.github/copilot-instructions.md)',
  targetPath: (root) => join(root, '.github', 'copilot-instructions.md'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default copilot
