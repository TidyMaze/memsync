import type { Renderer } from '../core/types.js'
import agents from './agents.js'
import cline from './cline.js'
import claude from './claude.js'
import continueRenderer from './continue.js'
import copilot from './copilot.js'
import cursor from './cursor.js'
import windsurf from './windsurf.js'

export const RENDERERS: Renderer[] = [
  claude,
  agents,
  cursor,
  copilot,
  continueRenderer,
  windsurf,
  cline,
]

export function getRenderer(id: string): Renderer | undefined {
  return RENDERERS.find(r => r.id === id)
}
