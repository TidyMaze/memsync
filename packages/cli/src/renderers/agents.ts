import { join } from 'node:path'
import { docToMarkdownBody } from '../core/scope.js'
import type { Renderer } from '../core/types.js'

const agents: Renderer = {
  id: 'agents',
  label: 'OpenAI Codex (AGENTS.md)',
  targetPath: (root) => join(root, 'AGENTS.md'),
  mode: 'passthrough',
  render(doc) {
    return { content: docToMarkdownBody(doc), warnings: [] }
  },
}

export default agents
