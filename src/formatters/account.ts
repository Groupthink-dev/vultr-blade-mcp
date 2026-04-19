/**
 * Account and billing formatters — strip to essential fields.
 */

interface ConciseAccountInfo {
  name: string;
  email: string;
  balance: number;
  pending_charges: number;
  last_payment_date: string;
  last_payment_amount: number;
}

export function formatAccountInfo(raw: Record<string, unknown>): ConciseAccountInfo {
  return {
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    balance: Number(raw.balance ?? 0),
    pending_charges: Number(raw.pending_charges ?? 0),
    last_payment_date: String(raw.last_payment_date ?? ""),
    last_payment_amount: Number(raw.last_payment_amount ?? 0),
  };
}

interface ConciseBillingItem {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  balance: number;
}

export function formatBillingItem(raw: Record<string, unknown>): ConciseBillingItem {
  return {
    id: Number(raw.id ?? 0),
    date: String(raw.date ?? ""),
    type: String(raw.type ?? ""),
    description: String(raw.description ?? ""),
    amount: Number(raw.amount ?? 0),
    balance: Number(raw.balance ?? 0),
  };
}

export function formatBillingItems(items: Record<string, unknown>[]): ConciseBillingItem[] {
  return items.map(formatBillingItem);
}
