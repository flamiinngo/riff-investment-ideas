import type { Allocation } from '@/types';

export const ALLOCATION_TOTAL = 100;

export function allocationTotal(allocation: Pick<Allocation, 'weight'>[]) {
  return allocation.reduce((sum, item) => sum + item.weight, 0);
}

export function isValidAllocation(allocation: Pick<Allocation, 'weight'>[]) {
  return allocation.length >= 2 && allocation.every((item) => Number.isInteger(item.weight) && item.weight >= 0 && item.weight <= 100) && allocationTotal(allocation) === ALLOCATION_TOTAL;
}

export function rebalanceAllocation(allocation: Allocation[], symbol: string, requestedWeight: number): Allocation[] {
  const nextWeight = Math.max(0, Math.min(100, Math.round(requestedWeight)));
  const targetIndex = allocation.findIndex((item) => item.symbol === symbol);
  if (targetIndex === -1 || allocation.length < 2) return allocation;

  const remaining = 100 - nextWeight;
  const others = allocation.filter((_, index) => index !== targetIndex);
  const otherTotal = others.reduce((sum, item) => sum + item.weight, 0);
  let distributed = 0;

  return allocation.map((item, index) => {
    if (index === targetIndex) return { ...item, weight: nextWeight };
    const otherIndex = others.findIndex((other) => other.symbol === item.symbol);
    const weight = otherIndex === others.length - 1
      ? remaining - distributed
      : Math.round(remaining * (otherTotal === 0 ? 1 / others.length : item.weight / otherTotal));
    distributed += weight;
    return { ...item, weight };
  });
}

export function allocatePurchase(amount: number, allocation: Pick<Allocation, 'symbol' | 'weight'>[]) {
  const cents = Math.round(amount * 100);
  let assigned = 0;
  return allocation.map((item, index) => {
    const value = index === allocation.length - 1 ? cents - assigned : Math.round(cents * item.weight / 100);
    assigned += value;
    return { symbol: item.symbol, amount: value / 100 };
  });
}

