# Vultr Blade MCP

A GPU-focused MCP server for Vultr cloud infrastructure. 50 tools for VM lifecycle, bare metal, serverless inference, DNS, firewall, snapshots, and billing — with token-efficient defaults and dual safety gates on every write operation.

Implements three service contracts: [`virtualisation-v1`](https://github.com/Groupthink-dev/stallari-pack-spec), [`serverless-v1`](https://github.com/Groupthink-dev/stallari-pack-spec), [`dns-authoritative-v1`](https://github.com/Groupthink-dev/stallari-pack-spec).

## Why another Vultr MCP?

| | mcp-vultr | **This** |
|---|---|---|
| **Scope** | 27 service modules (DNS, K8s, VPC, LB...) | GPU compute infrastructure |
| **Tools** | 335+ | 50 (targeted) |
| **Token cost** | Full Vultr API responses | ~60% stripped via formatters |
| **Write safety** | None | Dual gate: env var + per-call `confirm` |
| **GPU focus** | General-purpose | Plans default to GPU type, VRAM + pricing promoted |
| **Transport** | stdio only | stdio + Streamable HTTP |

**[mcp-vultr](https://github.com/rsp2k/mcp-vultr)** covers the full Vultr platform — DNS, Kubernetes, VPCs, load balancers, block storage, and more. It's comprehensive, but 335+ tool registrations flood the context window before the model reasons about a single VM.

**This MCP** is designed for agentic platforms that need:
- **GPU provisioning, not platform administration** — spin up A100s with cloud-init, tear them down when the job finishes.
- **Token discipline** — formatters strip ~60% of API response for token efficiency. A plan listing shows GPU type, VRAM, count, and hourly price — not 40 fields of metadata.
- **Safe writes** — every destructive operation requires `VULTR_WRITE_ENABLED=true` AND `confirm: true` in the tool call. Creating instances incurs GPU compute charges immediately; accidental invocations are expensive.
- **Flexible deployment** — stdio for local clients, Streamable HTTP for remote access behind tunnels.

## Why "Blade MCP"?

The `-blade-mcp` suffix identifies this as part of the [Blade MCP](https://github.com/groupthink-dev) family — a collection of purpose-built MCP servers that share a common design philosophy:

- **Service contracts** — each blade implements a declared contract (`virtualisation-v1`, `serverless-v1`, `dns-authoritative-v1`, etc.) so agentic platforms can swap providers without rewriting prompts.
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

# Required for write operations (create, delete, start, stop, reboot, etc.)
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

## Tools (50)

### Instances (11 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_vm_list` | List all instances with status, region, GPU, cost | |
| `vultr_vm_get` | Get full details for a single instance | |
| `vultr_vm_status` | Get power state and health (lightweight) | |
| `vultr_vm_bandwidth` | Get bandwidth usage (incoming/outgoing) | |
| `vultr_vm_create` | Create instance with GPU + cloud-init | **confirm** |
| `vultr_vm_delete` | Permanently destroy an instance | **confirm** |
| `vultr_vm_start` | Start a stopped instance | **confirm** |
| `vultr_vm_stop` | Stop (halt) a running instance | **confirm** |
| `vultr_vm_reboot` | Reboot a running instance | **confirm** |
| `vultr_vm_update` | Update instance properties (label, plan, tags, firewall) | **confirm** |
| `vultr_vm_set_reverse_dns` | Set reverse DNS (PTR) for an IPv4 address | **confirm** |

### Bare Metal (9 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_bm_list` | List all bare metal instances | |
| `vultr_bm_get` | Get full details for a bare metal instance | |
| `vultr_bm_bandwidth` | Get bandwidth usage | |
| `vultr_bm_list_plans` | List available bare metal plans with pricing | |
| `vultr_bm_create` | Create bare metal instance | **confirm** |
| `vultr_bm_delete` | Permanently destroy a bare metal instance | **confirm** |
| `vultr_bm_start` | Start a stopped bare metal instance | **confirm** |
| `vultr_bm_stop` | Stop (halt) a running bare metal instance | **confirm** |
| `vultr_bm_reboot` | Reboot a running bare metal instance | **confirm** |

### Serverless Inference (5 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_inference_list` | List all inference subscriptions | |
| `vultr_inference_get` | Get details for an inference subscription | |
| `vultr_inference_usage` | Get token usage statistics | |
| `vultr_inference_create` | Create an inference subscription | **confirm** |
| `vultr_inference_delete` | Delete an inference subscription | **confirm** |

### DNS (5 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_dns_list_domains` | List all DNS domains | |
| `vultr_dns_list_records` | List all records for a domain | |
| `vultr_dns_create_record` | Create a DNS record | **confirm** |
| `vultr_dns_update_record` | Update a DNS record | **confirm** |
| `vultr_dns_delete_record` | Delete a DNS record | **confirm** |

### Firewall (6 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_fw_list_groups` | List all firewall groups | |
| `vultr_fw_get_group` | Get details for a firewall group | |
| `vultr_fw_list_rules` | List all rules in a firewall group | |
| `vultr_fw_create_group` | Create a firewall group | **confirm** |
| `vultr_fw_delete_group` | Delete a firewall group | **confirm** |
| `vultr_fw_create_rule` | Create a firewall rule | **confirm** |

### Snapshots (4 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_snap_list` | List all snapshots | |
| `vultr_snap_get` | Get details for a snapshot | |
| `vultr_snap_create` | Create a snapshot from an instance | **confirm** |
| `vultr_snap_delete` | Delete a snapshot | **confirm** |

### Startup Scripts (4 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_script_list` | List all startup scripts | |
| `vultr_script_get` | Get details for a startup script | |
| `vultr_script_create` | Create a startup script | **confirm** |
| `vultr_script_delete` | Delete a startup script | **confirm** |

### Reference Data (4 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_vm_list_plans` | List plans with GPU specs + pricing (default: GPU only) | |
| `vultr_vm_list_regions` | List available datacentres | |
| `vultr_vm_list_images` | List OS images (default: Linux) | |
| `vultr_vm_ssh_keys` | List SSH keys for injection | |

### Account (2 tools)

| Tool | Description | Write |
|------|-------------|-------|
| `vultr_account_info` | Get account info, balance, pending charges | |
| `vultr_billing_history` | Get billing history with charges and payments | |

## GPU Provisioning Flow

```
1. vultr_vm_list_plans (type=vcg)     → Find GPU plan + pricing
2. vultr_vm_list_regions              → Pick region with availability
3. vultr_vm_list_images               → Get Ubuntu 24.04 os_id
4. vultr_vm_ssh_keys                  → Get SSH key IDs
5. vultr_vm_create                    → Create with cloud-init user_data
   {plan, region, os_id, user_data,      (installs Docker, NVIDIA toolkit,
    script_id, firewall_group_id}         pulls OCI image, starts worker)
6. vultr_vm_status                    → Poll until server_status=ok
7. ... work completes ...
8. vultr_snap_create                  → Snapshot before teardown (optional)
9. vultr_vm_delete                    → Tear down
```

## Token Efficiency

All read tools return **compact output** by default — only the fields needed for decision-making.

| Resource | Fields returned | Fields stripped | Savings |
|----------|----------------|----------------|---------|
| Instances | 12 (id, label, status, power, region, plan, IP, cost) | ~28 | ~70% |
| Plans | GPU specs promoted (type, VRAM, count) + pricing | metadata bloat | ~60% |
| Regions | 5 (id, city, country, continent, options) | ~15 | ~75% |
| SSH keys | id, name, date only | key material | ~80% |
| Bare metal | 15 (id, label, status, region, plan, CPU, RAM, IP, cost) | ~25 | ~60% |
| Inference | id, label, status, masked key | full key, internal | ~70% |
| DNS records | 6 (id, type, name, data, TTL, priority) | metadata | ~50% |
| Firewall | id, description, counts | metadata | ~60% |
| Snapshots | 7 (id, description, status, size, os_id, date) | metadata | ~50% |
| Account | 6 (name, email, balance, charges, payment) | ACLs, internal | ~60% |

Responses are capped at 4000 characters with pagination guidance on truncation.

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Environment gate** | `VULTR_WRITE_ENABLED=true` required for any mutation |
| **Per-call gate** | All write tools require `confirm: true` (Zod `z.literal(true)`) |
| **Dual confirmation** | Both gates must pass — neither alone is sufficient |
| **Bearer auth** | Optional `MCP_API_TOKEN` for HTTP transport (timing-safe comparison) |
| **No credential leakage** | API keys never appear in tool responses or error messages |
| **Inference key masking** | Inference subscription API keys are masked in responses |
| **Cost awareness** | `vultr_vm_create` and `vultr_bm_create` responses include pricing — GPU/bare metal instances incur charges immediately |

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `VULTR_API_KEY` | Yes | — | [API key](https://my.vultr.com/settings/#settingsapi) |
| `VULTR_WRITE_ENABLED` | For writes | `false` | Enable create/delete/start/stop/reboot/update |
| `MCP_API_TOKEN` | No | — | Bearer token for HTTP auth |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `8780` | HTTP server port |

## Architecture

```
src/
├── index.ts              — Entry point: stdio / HTTP transport selection
├── server.ts             — MCP server factory, registers all 50 tools
├── constants.ts          — Defaults, env var names
├── tools/
│   ├── instances-read.ts — vultr_vm_list, get, status, bandwidth
│   ├── instances-write.ts— vultr_vm_create, delete, start, stop, reboot, update, set_reverse_dns
│   ├── plans.ts          — vultr_vm_list_plans, list_regions
│   ├── images.ts         — vultr_vm_list_images
│   ├── ssh-keys.ts       — vultr_vm_ssh_keys
│   ├── baremetal-read.ts — vultr_bm_list, get, bandwidth
│   ├── baremetal-write.ts— vultr_bm_create, delete, start, stop, reboot
│   ├── baremetal-plans.ts— vultr_bm_list_plans
│   ├── inference.ts      — vultr_inference_list, get, create, delete, usage
│   ├── dns.ts            — vultr_dns_list_domains, list_records, create, update, delete
│   ├── firewall.ts       — vultr_fw_list_groups, get, create, delete, list_rules, create_rule
│   ├── snapshots.ts      — vultr_snap_list, get, create, delete
│   ├── scripts.ts        — vultr_script_list, get, create, delete
│   └── account.ts        — vultr_account_info, billing_history
├── schemas/              — Zod validation schemas per domain
├── formatters/           — Token-efficient output formatters
├── services/
│   ├── vultr.ts          — API client, key validation
│   └── auth.ts           — Bearer token middleware for HTTP transport
└── utils/
    ├── pagination.ts     — Pagination meta, truncation
    ├── write-gate.ts     — Dual write gate (env + confirm)
    └── errors.ts         — Vultr API error → actionable message mapping
```

**Dependencies:** `@modelcontextprotocol/sdk`, `zod`. No Vultr SDK — direct REST calls for control over response shaping.

## Development

```bash
npm install              # install dependencies
npm run dev              # stdio with hot-reload
npm run dev:http         # HTTP with hot-reload on :8780
npm test                 # run tests (vitest, 74 tests)
npm run typecheck        # type-check only
npm run build            # compile to dist/
```

## Stallari Marketplace

This MCP implements three [Stallari](https://stallari.ai) service contracts (pack-spec 2.0.0):
- `virtualisation-v1` — VM + bare metal lifecycle (extended)
- `serverless-v1` — inference subscriptions and usage
- `dns-authoritative-v1` — domain and record management

It serves as the reference implementation for GPU cloud provider blades.

- Marketplace listing: https://stallari.ai
- Stallari platform repo: https://github.com/Groupthink-dev/stallari
- Plugin manifest: https://github.com/Groupthink-dev/stallari-plugins/blob/main/plugins/tools/vultr-blade-mcp.json

## License

MIT
