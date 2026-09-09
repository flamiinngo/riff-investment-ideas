import { getTokenizedStock } from '../stocks/tokenized-stocks.ts';
import type { Allocation } from '../../types/index.ts';

export function isPublishableAllocation(
  allocation: unknown,
): allocation is Allocation[] {
  if (
    !Array.isArray(allocation) ||
    allocation.length < 2 ||
    allocation.length > 12
  )
    return false;
  const symbols = new Set<string>();
  let total = 0;
  for (const item of allocation) {
    if (
      !item ||
      typeof item !== 'object' ||
      !('symbol' in item) ||
      !('weight' in item)
    )
      return false;
    const symbol = String(item.symbol).toUpperCase();
    const weight = Number(item.weight);
    if (
      !getTokenizedStock(symbol) ||
      symbols.has(symbol) ||
      !Number.isInteger(weight) ||
      weight <= 0 ||
      weight > 100
    )
      return false;
    symbols.add(symbol);
    total += weight;
  }
  return total === 100;
}

export function normalizePublishableAllocation(allocation: Allocation[]) {
  return allocation.map((item) => {
    const stock = getTokenizedStock(item.symbol)!;
    return {
      symbol: item.symbol.toUpperCase(),
      company: stock.company,
      weight: item.weight,
      available: true,
    };
  });
}

export function stableAllocation(allocation: Allocation[]) {
  return [...allocation]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map(({ symbol, weight }) => `${symbol.toUpperCase()}:${weight}`)
    .join('|');
}

export async function hashAllocation(allocation: Allocation[]) {
  const bytes = new TextEncoder().encode(stableAllocation(allocation));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
