import assert from 'node:assert/strict';
import test from 'node:test';
import { allocatePurchase, allocationTotal, isValidAllocation, rebalanceAllocation } from './allocation.ts';

const sample = [
  { symbol: 'A', company: 'A', weight: 35, available: true },
  { symbol: 'B', company: 'B', weight: 30, available: true },
  { symbol: 'C', company: 'C', weight: 20, available: true },
  { symbol: 'D', company: 'D', weight: 15, available: true },
];

void test('rebalancing always preserves an exact 100% total', () => {
  const result = rebalanceAllocation(sample, 'B', 41);
  assert.equal(allocationTotal(result), 100);
  assert.equal(result.find((item) => item.symbol === 'B')?.weight, 41);
  assert.ok(isValidAllocation(result));
});

void test('weights clamp to valid percentage boundaries', () => {
  assert.equal(rebalanceAllocation(sample, 'A', 140)[0].weight, 100);
  assert.equal(rebalanceAllocation(sample, 'A', -20)[0].weight, 0);
});

void test('purchase allocation never creates or loses a cent', () => {
  const result = allocatePurchase(10.01, sample);
  assert.equal(result.reduce((sum, item) => sum + item.amount, 0), 10.01);
});
