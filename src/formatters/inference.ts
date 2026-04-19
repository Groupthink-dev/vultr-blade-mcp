/**
 * Serverless inference formatters — strip to essential fields.
 */

interface ConciseSubscription {
  id: string;
  label: string;
  status: string;
  api_key_masked: string;
  date_created: string;
}

export function formatSubscription(raw: Record<string, unknown>): ConciseSubscription {
  const apiKey = String(raw.api_key ?? "");
  return {
    id: String(raw.id ?? ""),
    label: String(raw.label ?? ""),
    status: String(raw.status ?? ""),
    api_key_masked: apiKey ? `${apiKey.slice(0, 8)}...` : "",
    date_created: String(raw.date_created ?? ""),
  };
}

export function formatSubscriptions(subs: Record<string, unknown>[]): ConciseSubscription[] {
  return subs.map(formatSubscription);
}

interface ConciseUsage {
  subscription_id: string;
  chat: UsageBucket;
  completions: UsageBucket;
  embeddings: UsageBucket;
  audio: UsageBucket;
}

interface UsageBucket {
  current_tokens: number;
  monthly_allotment: number;
  overage: number;
}

function parseUsageBucket(raw: unknown): UsageBucket {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    current_tokens: Number(data.current_tokens ?? 0),
    monthly_allotment: Number(data.monthly_allotment ?? 0),
    overage: Number(data.overage ?? 0),
  };
}

export function formatUsage(subscriptionId: string, raw: Record<string, unknown>): ConciseUsage {
  return {
    subscription_id: subscriptionId,
    chat: parseUsageBucket(raw.chat),
    completions: parseUsageBucket(raw.completions),
    embeddings: parseUsageBucket(raw.embeddings),
    audio: parseUsageBucket(raw.audio),
  };
}
