# vultr-blade-mcp

Vultr GPU cloud MCP server — VM lifecycle, GPU provisioning, and cloud-init deployment with token-efficient defaults.

Implements the [`virtualmachine-v1`](https://github.com/groupthink-dev/stallari-pack-spec) service contract (12 tools).

## Tools

| Tool | Description | Gate |
|------|-------------|------|
| `vultr_vm_list` | List all instances with status, region, GPU, cost | read |
| `vultr_vm_get` | Get full details for a single instance | read |
| `vultr_vm_status` | Get power state and health (lightweight) | read |
| `vultr_vm_create` | Create instance with GPU + cloud-init user_data | write |
| `vultr_vm_delete` | Permanently destroy an instance | write |
| `vultr_vm_start` | Start a stopped instance | write |
| `vultr_vm_stop` | Stop (halt) a running instance | write |
| `vultr_vm_reboot` | Reboot a running instance | write |
| `vultr_vm_list_plans` | List plans with GPU specs + pricing (default: GPU only) | read |
| `vultr_vm_list_regions` | List available datacentres | read |
| `vultr_vm_list_images` | List OS images (default: Linux) | read |
| `vultr_vm_ssh_keys` | List SSH keys for injection | read |

## Quick start

```bash
# Install
npm install

# Run in stdio mode (Claude Desktop / local MCP)
VULTR_API_KEY=your-key npx tsx src/index.ts

# Run in HTTP mode (remote access)
VULTR_API_KEY=your-key TRANSPORT=http MCP_API_TOKEN=your-token npx tsx src/index.ts
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VULTR_API_KEY` | Yes | Vultr API key ([create one](https://my.vultr.com/settings/#settingsapi)) |
| `VULTR_WRITE_ENABLED` | For writes | Set to `true` to enable create/delete/start/stop/reboot |
| `MCP_API_TOKEN` | No | Bearer token for HTTP transport authentication |
| `TRANSPORT` | No | `stdio` (default) or `http` |
| `PORT` | No | HTTP port (default: 8780) |

## Safety model

Write operations are protected by a **dual gate**:

1. **Environment gate**: `VULTR_WRITE_ENABLED=true` must be set
2. **Per-call gate**: `confirm: true` must be passed in tool input

Both must pass. This prevents accidental writes from misconfigured environments and careless tool invocations.

## GPU provisioning flow

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

## Token efficiency

Formatters strip Vultr's verbose API responses to essential fields:

- **Instances**: 12 fields from ~40 (id, label, status, power, region, plan, IP, cost)
- **Plans**: GPU specs (type, VRAM, count) promoted to top-level; pricing included
- **Regions**: 5 fields (id, city, country, continent, options)
- **SSH keys**: Key material stripped — only id, name, date

Responses are capped at 4000 characters with pagination guidance on truncation.

## Development

```bash
npm run dev          # tsx watch (stdio)
npm run dev:http     # tsx watch (HTTP on :8780)
npm run build        # tsc → dist/
npm test             # vitest
npm run typecheck    # tsc --noEmit
```

## License

MIT
