# Vultr Blade MCP

A GPU-focused MCP server for Vultr cloud infrastructure. 12 tools for VM lifecycle, GPU provisioning, and cloud-init deployment — with token-efficient defaults and dual safety gates on every write operation.

Implements the [`virtualmachine-v1`](https://github.com/groupthink-dev/stallari-pack-spec) service contract.

## Why another Vultr MCP?

| | mcp-vultr | **This** |
|---|---|---|
| **Scope** | 27 service modules (DNS, K8s, VPC, LB...) | GPU VM lifecycle only |
| **Tools** | 335+ | 12 (targeted) |
| **Token cost** | Full Vultr API responses | ~60% stripped via formatters |
| **Write safety** | None | Dual gate: env var + per-call `confirm` |
| **GPU focus** | General-purpose | Plans default to GPU type, VRAM + pricing promoted |
| **Transport** | stdio only | stdio + Streamable HTTP |

**[mcp-vultr](https://github.com/rsp2k/mcp-vultr)** covers the full Vultr platform — DNS, Kubernetes, VPCs, load balancers, block storage, and more. It's comprehensive, but 335+ tool registrations flood the context window before the model reasons about a single VM.

**This MCP** is designed for agentic platforms that need:
- **GPU provisioning, not platform administration** — spin up A100s with cloud-init, tear them down when the job finishes.
- **Token discipline** — formatters strip Vultr's verbose API responses to essential fields. A plan listing shows GPU type, VRAM, count, and hourly price — not 40 fields of metadata.
- **Safe writes** — every destructive operation requires `VULTR_WRITE_ENABLED=true` AND `confirm: true` in the tool call. Creating instances incurs GPU compute charges immediately; accidental invocations are expensive.
- **Flexible deployment** — stdio for local clients, Streamable HTTP for remote access behind tunnels.

## Why "Blade MCP"?

The `-blade-mcp` suffix identifies this as part of the [Blade MCP](https://github.com/groupthink-dev) family — a collection of purpose-built MCP servers that share a common design philosophy:

- **Service contracts** — each blade implements a declared contract (`virtualmachine-v1`, `edge-platform-v1`, etc.) so agentic platforms can swap providers without rewriting prompts.
- **Token efficiency** — formatters strip verbose API responses by default. Full detail on request.
- **Dual write gates** — environment variable + per-call confirmation on all destructive operations.
- **Dual transport** — stdio for local use, Streamable HTTP for remote and always-on deployment.

Other blades in the family: [cloudflare-blade-mcp](https://github.com/groupthink-dev/cloudflare-blade-mcp) (53 tools), [caldav-blade-mcp](https://github.com/groupthink-dev/caldav-blade-mcp) (13 tools), [fastmail-blade-mcp](https://github.com/groupthink-dev/fastmail-blade-mcp) (20 tools), and more.

## Quick Start

### Install

```bash
git clone https://github.com/groupthink-dev/vultr-blade-mcp.git
cd vultr-blade-mcp
npm install && npm run build
```

### Configure

```bash
# Required — create at my.vultr.com/settings/#settingsapi
export VULTR_API_KEY="your-api-key"

# Required for write operations (create, delete, start, stop, reboot)
export VULTR_WRITE_ENABLED="true"
```

### Run

```bash
# stdio (default — for Claude Code, Claude Desktop)
node dist/index.js

# HTTP transport (for remote access, tunnels)
TRANSPORT=http MCP_API_TOKEN=your-secret node dist/index.js
```

### Claude Code / Claude Desktop

```json
{
  "mcpServers": {
    "vultr": {
      "command": "node",
      "args": ["/path/to/vultr-blade-mcp/dist/index.js"],
      "env": {
        "VULTR_API_KEY": "your-api-key",
        "VULTR_WRITE_ENABLED": "false"
      }
    }
  }
}
```

## Tools (12)

### Instances (3 tools)

| Tool | Description | Token Cost |
|------|-------------|-----------|
| `vultr_vm_list` | List all instances with status, region, GPU, cost | Medium |
| `vultr_vm_get` | Get full details for a single instance | Low |
| `vultr_vm_status` | Get power state and health (lightweight) | Low |

### VM Lifecycle (5 tools)

| Tool | Description | Token Cost |
|------|-------------|-----------|
| `vultr_vm_create` | Create instance with GPU + cloud-init user_data (**confirm required**) | Low |
| `vultr_vm_delete` | Permanently destroy an instance (**confirm required**) | Low |
| `vultr_vm_start` | Start a stopped instance (**confirm required**) | Low |
| `vultr_vm_stop` | Stop (halt) a running instance (**confirm required**) | Low |
| `vultr_vm_reboot` | Reboot a running instance (**confirm required**) | Low |

### Reference Data (4 tools)

| Tool | Description | Token Cost |
|------|-------------|-----------|
| `vultr_vm_list_plans` | List plans with GPU specs + pricing (default: GPU only) | Medium |
| `vultr_vm_list_regions` | List available datacentres | Low |
| `vultr_vm_list_images` | List OS images (default: Linux) | Low |
| `vultr_vm_ssh_keys` | List SSH keys for injection | Low |

## GPU Provisioning Flow

```
1. vultr_vm_list_plans (type=vcg)     → Find GPU plan + pricing
2. vultr_vm_list_regions              → Pick region with availability
3. vultr_vm_list_images               → Get Ubuntu 24.04 os_id
4. vultr_vm_ssh_keys                  → Get SSH key IDs
5. vultr_vm_create                    → Create with cloud-init user_data
   {plan, region, os_id, user_data}      (installs Docker, NVIDIA toolkit,
                                          pulls OCI image, starts worker)
6. vultr_vm_status                    → Poll until server_status=ok
7. ... work completes ...
8. vultr_vm_delete                    → Tear down
```

## Token Efficiency

All read tools return **compact output** by default — only the fields needed for decision-making.

| Resource | Fields returned | Fields stripped | Savings |
|----------|----------------|----------------|---------|
| Instances | 12 (id, label, status, power, region, plan, IP, cost) | ~28 | ~70% |
| Plans | GPU specs promoted (type, VRAM, count) + pricing | metadata bloat | ~60% |
| Regions | 5 (id, city, country, continent, options) | ~15 | ~75% |
| SSH keys | id, name, date only | key material | ~80% |

Responses are capped at 4000 characters with pagination guidance on truncation.

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Environment gate** | `VULTR_WRITE_ENABLED=true` required for any mutation |
| **Per-call gate** | All write tools require `confirm: true` (Zod `z.literal(true)`) |
| **Dual confirmation** | Both gates must pass — neither alone is sufficient |
| **Bearer auth** | Optional `MCP_API_TOKEN` for HTTP transport (timing-safe comparison) |
| **No credential leakage** | API keys never appear in tool responses or error messages |
| **Cost awareness** | `vultr_vm_create` response includes hourly rate — GPU instances incur charges immediately |

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VULTR_API_KEY` | Yes | — | [API key](https://my.vultr.com/settings/#settingsapi) |
| `VULTR_WRITE_ENABLED` | For writes | `false` | Enable create/delete/start/stop/reboot |
| `MCP_API_TOKEN` | No | — | Bearer token for HTTP auth |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `8780` | HTTP server port |

## Architecture

```
src/
├── index.ts              — Entry point: stdio / HTTP transport selection
├── server.ts             — MCP server factory, registers all 12 tools
├── constants.ts          — Defaults, env var names
├── tools/
│   ├── instances.ts      — vultr_vm_list, vultr_vm_get, vultr_vm_status
│   ├── lifecycle.ts      — vultr_vm_create, delete, start, stop, reboot
│   ├── plans.ts          — vultr_vm_list_plans
│   ├── regions.ts        — vultr_vm_list_regions
│   ├── images.ts         — vultr_vm_list_images
│   └── ssh-keys.ts       — vultr_vm_ssh_keys
├── schemas/              — Zod validation schemas per domain
├── formatters/           — Token-efficient output formatters
├── services/
│   ├── vultr.ts          — API client, key validation
│   └── auth.ts           — Bearer token middleware for HTTP transport
└── utils/
    ├── pagination.ts     — Pagination meta, truncation
    └── errors.ts         — Vultr API error → actionable message mapping
```

**Dependencies:** `@modelcontextprotocol/sdk`, `zod`. No Vultr SDK — direct REST calls for control over response shaping.

## Development

```bash
npm install              # install dependencies
npm run dev              # stdio with hot-reload
npm run dev:http         # HTTP with hot-reload on :8780
npm test                 # run tests (vitest, 29 tests)
npm run typecheck        # type-check only
npm run build            # compile to dist/
```

## Stallari Marketplace

This MCP implements the `virtualmachine-v1` service contract (12/16 operations — all 5 required, 2 recommended, 5 gated). It serves as the reference implementation for GPU cloud provider blades.

See the [plugin manifest](https://github.com/groupthink-dev/stallari-plugins/blob/main/plugins/tools/vultr-blade-mcp.json) for the full Stallari catalog entry.

## License

MIT
