import { $ } from 'bun'
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'

await $`bun build src/index.ts --outfile dist/memsync.js --target=node --minify`

const out = 'dist/memsync.js'
const code = readFileSync(out, 'utf-8')
const shebang = '#!/usr/bin/env node\n'
if (!code.startsWith('#!')) writeFileSync(out, shebang + code)
chmodSync(out, 0o755)

console.log('Built: dist/memsync.js')
