# vultr-blade-mcp

Vultr GPU cloud MCP server implementing `virtualmachine-v1` service contract.

## Structure

```
src/
├── index.ts              # Entry point (stdio/HTTP dual transport)
├── server.ts             # McpServer creation, tool registration
├── constants.ts          # Defaults, env var names
├── services/
│   ├── vultr.ts          # API client, key validation
│   └── auth.ts           # Bearer token middleware
├── schemas/              # Zod input schemas
├── formatters/           # Token-efficient response formatters
├── tools/                # Tool registration (one file per domain)
└── utils/                # Error handling, pagination, write-gate
```

## Build

```bash
npm ci
npm run build     # tsc → dist/
npm test          # vitest
npm run dev       # tsx watch
```

## Environment

```bash
VULTR_API_KEY=...           # Required — Vultr API key
VULTR_WRITE_ENABLED=true    # Required for write operations
MCP_API_TOKEN=...           # Optional — bearer auth for HTTP transport
TRANSPORT=stdio|http        # Default: stdio
PORT=8780                   # HTTP transport port
```

## Conventions

- Follow cloudflare-blade-mcp patterns: Zod schemas, formatters, dual write-gate
- All write tools require `confirm: true` AND `VULTR_WRITE_ENABLED=true`
- Formatters strip ~60% of API response for token efficiency
- Never log or expose API keys in error messages
