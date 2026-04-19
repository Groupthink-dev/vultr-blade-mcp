import { describe, it, expect } from "vitest";
import {
  formatFirewallGroup,
  formatFirewallGroups,
  formatFirewallRule,
  formatFirewallRules,
} from "../../src/formatters/firewall.js";

const RAW_GROUP = {
  id: "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
  description: "GPU workers",
  date_created: "2026-04-20T01:30:00+00:00",
  date_modified: "2026-04-20T02:00:00+00:00",
  instance_count: 3,
  rule_count: 5,
  max_rule_count: 50,
};

const RAW_RULE = {
  id: 1,
  action: "accept",
  ip_type: "v4",
  protocol: "tcp",
  port: "22",
  subnet: "0.0.0.0",
  subnet_size: 0,
  source: "",
  notes: "SSH access",
};

describe("formatFirewallGroup", () => {
  it("extracts essential fields", () => {
    const result = formatFirewallGroup(RAW_GROUP);
    expect(result.id).toBe("cb676a46-66fd-4dfb-b839-443f2e6c0b60");
    expect(result.description).toBe("GPU workers");
    expect(result.instance_count).toBe(3);
    expect(result.rule_count).toBe(5);
    expect(result.max_rule_count).toBe(50);
  });

  it("handles missing fields gracefully", () => {
    const result = formatFirewallGroup({});
    expect(result.id).toBe("");
    expect(result.instance_count).toBe(0);
  });
});

describe("formatFirewallGroups", () => {
  it("maps array of groups", () => {
    const results = formatFirewallGroups([RAW_GROUP]);
    expect(results).toHaveLength(1);
  });
});

describe("formatFirewallRule", () => {
  it("extracts essential fields", () => {
    const result = formatFirewallRule(RAW_RULE);
    expect(result.id).toBe(1);
    expect(result.action).toBe("accept");
    expect(result.protocol).toBe("tcp");
    expect(result.port).toBe("22");
    expect(result.subnet).toBe("0.0.0.0");
    expect(result.subnet_size).toBe(0);
    expect(result.notes).toBe("SSH access");
  });

  it("handles missing fields gracefully", () => {
    const result = formatFirewallRule({});
    expect(result.id).toBe(0);
    expect(result.protocol).toBe("");
  });
});

describe("formatFirewallRules", () => {
  it("maps array of rules", () => {
    const results = formatFirewallRules([RAW_RULE, RAW_RULE]);
    expect(results).toHaveLength(2);
  });
});
