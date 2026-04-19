import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInstanceReadTools } from "./tools/instances-read.js";
import { registerInstanceWriteTools } from "./tools/instances-write.js";
import { registerPlanTools } from "./tools/plans.js";
import { registerImageTools } from "./tools/images.js";
import { registerSshKeyTools } from "./tools/ssh-keys.js";
import { registerScriptTools } from "./tools/scripts.js";
import { registerFirewallTools } from "./tools/firewall.js";
import { registerSnapshotTools } from "./tools/snapshots.js";
import { registerBaremetalReadTools } from "./tools/baremetal-read.js";
import { registerBaremetalWriteTools } from "./tools/baremetal-write.js";
import { registerBaremetalPlanTools } from "./tools/baremetal-plans.js";
import { registerInferenceTools } from "./tools/inference.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerAccountTools } from "./tools/account.js";

/**
 * Creates and configures the MCP server with all Vultr tools registered.
 *
 * 50 tools total:
 *   Instances (11):   vultr_vm_list, vultr_vm_get, vultr_vm_status, vultr_vm_bandwidth,
 *                     vultr_vm_create, vultr_vm_delete, vultr_vm_start, vultr_vm_stop,
 *                     vultr_vm_reboot, vultr_vm_update, vultr_vm_set_reverse_dns
 *   Plans (2):        vultr_vm_list_plans, vultr_vm_list_regions
 *   Images (1):       vultr_vm_list_images
 *   SSH Keys (1):     vultr_vm_ssh_keys
 *   Scripts (4):      vultr_script_list, vultr_script_get, vultr_script_create, vultr_script_delete
 *   Firewall (6):     vultr_fw_list_groups, vultr_fw_get_group, vultr_fw_create_group,
 *                     vultr_fw_delete_group, vultr_fw_list_rules, vultr_fw_create_rule
 *   Snapshots (4):    vultr_snap_list, vultr_snap_get, vultr_snap_create, vultr_snap_delete
 *   Bare Metal (9):   vultr_bm_list, vultr_bm_get, vultr_bm_bandwidth, vultr_bm_create,
 *                     vultr_bm_delete, vultr_bm_start, vultr_bm_stop, vultr_bm_reboot,
 *                     vultr_bm_list_plans
 *   Inference (5):    vultr_inference_list, vultr_inference_get, vultr_inference_create,
 *                     vultr_inference_delete, vultr_inference_usage
 *   DNS (5):          vultr_dns_list_domains, vultr_dns_list_records, vultr_dns_create_record,
 *                     vultr_dns_update_record, vultr_dns_delete_record
 *   Account (2):      vultr_account_info, vultr_billing_history
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "vultr-blade-mcp",
    version: "0.2.0",
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

  // Startup scripts
  registerScriptTools(server);

  // Firewall groups + rules
  registerFirewallTools(server);

  // Snapshots
  registerSnapshotTools(server);

  // Bare metal — read
  registerBaremetalReadTools(server);

  // Bare metal — write (gated)
  registerBaremetalWriteTools(server);

  // Bare metal plans
  registerBaremetalPlanTools(server);

  // Serverless inference
  registerInferenceTools(server);

  // DNS
  registerDnsTools(server);

  // Account + billing
  registerAccountTools(server);

  return server;
}
