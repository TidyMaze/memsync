import pc from 'picocolors'

const PAD = 42

export function logWritten(target: string, sha: string): void {
  console.log(`  ${pc.green('written')}    ${target.padEnd(PAD)} (sha ${sha})`)
}

export function logUnchanged(target: string): void {
  console.log(`  ${pc.dim('unchanged')}  ${target}`)
}

export function logSkipped(target: string, reason: string): void {
  console.log(`  ${pc.yellow('SKIPPED')}    ${target.padEnd(PAD)} ${pc.dim(reason)}`)
}

export function logInSync(target: string): void {
  console.log(`  ${pc.green('✓')} in sync    ${target}`)
}

export function logStale(target: string): void {
  console.log(`  ${pc.yellow('~')} stale      ${target}`)
}

export function logHandEdited(target: string): void {
  console.log(`  ${pc.yellow('!')} hand-edited ${target}`)
}

export function logMissing(target: string): void {
  console.log(`  ${pc.red('✗')} missing    ${target}`)
}
