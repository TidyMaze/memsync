import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const claude: Renderer = {
  id: 'claude',
  label: 'Claude Code (CLAUDE.md)',
  targetPath: (root) => join(root, 'CLAUDE.md'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default claude
