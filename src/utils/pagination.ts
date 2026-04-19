/**
 * Pagination and truncation utilities for token-efficient responses.
 */

import { CHARACTER_LIMIT } from "../constants.js";

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  cursor: string;
  has_more: boolean;
}

/**
 * Builds pagination metadata from Vultr's cursor-based pagination.
 */
export function buildPaginationMeta(
  total: number,
  items: unknown[],
  perPage: number,
  cursor: string
): PaginationMeta {
  return {
    total,
    count: items.length,
    per_page: perPage,
    cursor,
    has_more: cursor !== "",
  };
}

/**
 * Truncates a string response to CHARACTER_LIMIT with guidance.
 */
export function truncateIfNeeded(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;

  const truncated = text.slice(0, CHARACTER_LIMIT);
  const lastNewline = truncated.lastIndexOf("\n");
  const cleanCut = lastNewline > CHARACTER_LIMIT * 0.8 ? truncated.slice(0, lastNewline) : truncated;

  return (
    cleanCut +
    "\n\n--- TRUNCATED ---\nResponse exceeded token limit. Use per_page or filter parameters to narrow results."
  );
}
