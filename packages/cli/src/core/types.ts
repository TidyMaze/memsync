export interface MemoryFrontmatter {
  version?: number
  project?: string
  scopes?: string[]
  updated?: string
  budget?: Record<string, number>
}

export interface MemorySection {
  heading: string
  level: number
  content: string
  scopes: string[]
  negated: boolean
}

export interface MemoryDoc {
  frontmatter: MemoryFrontmatter
  sections: MemorySection[]
  raw: string
}

export interface RenderCtx {
  rendererId: string
  proEnabled: boolean
}

export interface RenderResult {
  content: string
  warnings: string[]
}

export interface Renderer {
  id: string
  label: string
  targetPath: (root: string) => string
  mode: 'passthrough' | 'transform'
  render(doc: MemoryDoc, ctx: RenderCtx): RenderResult
}

export interface SyncOptions {
  dryRun?: boolean
  force?: boolean
  only?: string[]
  noPull?: boolean
  noPush?: boolean
}

export class ProRequiredError extends Error {
  constructor(
    public readonly feature: string,
    public readonly upgradeUrl: string,
  ) {
    super(`"${feature}" requires memsync Pro. Upgrade at ${upgradeUrl}`)
    this.name = 'ProRequiredError'
  }
}
