import { describe, it, expect } from "vitest";
import { formatAccountInfo, formatBillingItem, formatBillingItems } from "../../src/formatters/account.js";

const RAW_ACCOUNT = {
  name: "Test User",
  email: "test@example.com",
  balance: -50.25,
  pending_charges: 12.50,
  last_payment_date: "2026-04-01T00:00:00+00:00",
  last_payment_amount: 100.00,
  acls: ["manage_users", "subscriptions_view"],
};

const RAW_BILLING = {
  id: 12345,
  date: "2026-04-20T00:00:00+00:00",
  type: "invoice",
  description: "GPU Instance - A100 80GB",
  amount: 2.68,
  balance: -52.93,
};

describe("formatAccountInfo", () => {
  it("extracts essential fields", () => {
    const result = formatAccountInfo(RAW_ACCOUNT);
    expect(result.name).toBe("Test User");
    expect(result.email).toBe("test@example.com");
    expect(result.balance).toBe(-50.25);
    expect(result.pending_charges).toBe(12.50);
    expect(result.last_payment_amount).toBe(100.00);
  });

  it("strips ACLs and internal fields", () => {
    const result = formatAccountInfo(RAW_ACCOUNT) as Record<string, unknown>;
    expect(result.acls).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatAccountInfo({});
    expect(result.name).toBe("");
    expect(result.balance).toBe(0);
  });
});

describe("formatBillingItem", () => {
  it("extracts essential fields", () => {
    const result = formatBillingItem(RAW_BILLING);
    expect(result.id).toBe(12345);
    expect(result.type).toBe("invoice");
    expect(result.description).toBe("GPU Instance - A100 80GB");
    expect(result.amount).toBe(2.68);
    expect(result.balance).toBe(-52.93);
  });

  it("handles missing fields gracefully", () => {
    const result = formatBillingItem({});
    expect(result.id).toBe(0);
    expect(result.description).toBe("");
    expect(result.amount).toBe(0);
  });
});

describe("formatBillingItems", () => {
  it("maps array", () => {
    const results = formatBillingItems([RAW_BILLING, RAW_BILLING]);
    expect(results).toHaveLength(2);
  });
});
