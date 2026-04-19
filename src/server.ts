import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInstanceReadTools } from "./tools/instances-read.js";
import { registerInstanceWriteTools } from "./tools/instances-write.js";
import { registerPlanTools } from "./tools/plans.js";
import { registerImageTools } from "./tools/images.js";
import { registerSshKeyTools } from "./tools/ssh-keys.js";

/**
 * Creates and configures the MCP server with all Vultr tools registered.
 *
 * 12 tools total:
 *   Instances (8): vultr_vm_list, vultr_vm_get, vultr_vm_status,
 *                  vultr_vm_create, vultr_vm_delete, vultr_vm_start,
 *                  vultr_vm_stop, vultr_vm_reboot
 *   Plans (2):     vultr_vm_list_plans, vultr_vm_list_regions
 *   Images (1):    vultr_vm_list_images
 *   SSH Keys (1):  vultr_vm_ssh_keys
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "vultr-blade-mcp",
    version: "0.1.0",
  });

  // Instances — read
  registerInstanceReadTools(server);

  // Instances — write (gated)
  registerInstanceWriteTools(server);

  // Plans + regions
  registerPlanTools(server);

  // OS images
  registerImageTools(server);

  // SSH keys
  registerSshKeyTools(server);

  return server;
}
