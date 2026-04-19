/**
 * Firewall formatters — strip to essential fields.
 */

interface ConciseFirewallGroup {
  id: string;
  description: string;
  date_created: string;
  date_modified: string;
  instance_count: number;
  rule_count: number;
  max_rule_count: number;
}

export function formatFirewallGroup(raw: Record<string, unknown>): ConciseFirewallGroup {
  return {
    id: String(raw.id ?? ""),
    description: String(raw.description ?? ""),
    date_created: String(raw.date_created ?? ""),
    date_modified: String(raw.date_modified ?? ""),
    instance_count: Number(raw.instance_count ?? 0),
    rule_count: Number(raw.rule_count ?? 0),
    max_rule_count: Number(raw.max_rule_count ?? 0),
  };
}

export function formatFirewallGroups(groups: Record<string, unknown>[]): ConciseFirewallGroup[] {
  return groups.map(formatFirewallGroup);
}

interface ConciseFirewallRule {
  id: number;
  action: string;
  ip_type: string;
  protocol: string;
  port: string;
  subnet: string;
  subnet_size: number;
  source: string;
  notes: string;
}

export function formatFirewallRule(raw: Record<string, unknown>): ConciseFirewallRule {
  return {
    id: Number(raw.id ?? 0),
    action: String(raw.action ?? ""),
    ip_type: String(raw.ip_type ?? ""),
    protocol: String(raw.protocol ?? ""),
    port: String(raw.port ?? ""),
    subnet: String(raw.subnet ?? ""),
    subnet_size: Number(raw.subnet_size ?? 0),
    source: String(raw.source ?? ""),
    notes: String(raw.notes ?? ""),
  };
}

export function formatFirewallRules(rules: Record<string, unknown>[]): ConciseFirewallRule[] {
  return rules.map(formatFirewallRule);
}
