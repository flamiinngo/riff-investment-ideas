import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashAllocation,
  isPublishableAllocation,
  stableAllocation,
} from './canonical.ts';

const allocation = [
  { symbol: 'NVDA', company: 'ignored', weight: 60, available: true },
  { symbol: 'MSFT', company: 'ignored', weight: 40, available: true },
];

void test('publishable allocations require unique supported assets totaling 100%', () => {
  assert.equal(isPublishableAllocation(allocation), true);
  assert.equal(
    isPublishableAllocation([allocation[0], { ...allocation[0], weight: 40 }]),
    false,
  );
  assert.equal(
    isPublishableAllocation([
      allocation[0],
      { symbol: 'VST', company: 'Vistra', weight: 40, available: true },
    ]),
    false,
  );
  assert.equal(
    isPublishableAllocation([{ ...allocation[0], weight: 59 }, allocation[1]]),
    false,
  );
});

void test('canonical allocation identity is independent of display order', async () => {
  assert.equal(
    stableAllocation(allocation),
    stableAllocation([...allocation].reverse()),
  );
  assert.equal(
    await hashAllocation(allocation),
    await hashAllocation([...allocation].reverse()),
  );
});
