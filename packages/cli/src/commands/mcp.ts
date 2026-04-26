import('../mcp/server.js').catch((err) => {
  console.error('Failed to start MCP server:', err)
  process.exit(1)
})

export async function runMcp() {
  // Server starts in imported module main() function
}
