import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recommendUnits, scoreUnit, formatPrice, priceText } from '../js/recommend.js';

const data = JSON.parse(readFileSync(new URL('../data/units.json', import.meta.url), 'utf8'));
const units = data.units;
const blockIds = data.blocks.map((b) => b.id);

// 1) Real-data sanity: stats, blocks and per-type block/stack references.
assert.equal(data.stats.totalUnits, 1976, 'official total unit count must be kept');
assert.equal(data.blocks.length, 6, 'six residential blocks');
for (const unit of units) {
  assert.ok(unit.name && unit.stacks, `${unit.id}: missing name/stacks`);
  assert.ok(unit.bedrooms >= 1, `${unit.id}: invalid bedrooms`);
  for (const b of unit.blocks) {
    assert.ok(blockIds.includes(b), `${unit.id}: unknown block ${b}`);
  }
  assert.ok(blockIds.includes(unit.grid.block), `${unit.id}: grid.block must be a real block`);
}

// 2) Full ranking on real data (prices TBA): every type returned, sorted desc.
const ranked = recommendUnits(units, { householdSize: 3, budget: 450000, priorities: ['space', 'views'] });
assert.equal(ranked.length, units.length, 'every flat type must take part in the ranking');
for (let i = 1; i < ranked.length; i += 1) {
  assert.ok(ranked[i - 1].score >= ranked[i].score, 'results must be sorted by descending score');
}

// 3) TBA prices: scoring is safe and explains itself.
const tba = scoreUnit(units.find((u) => u.id === '4R'), { householdSize: 4, budget: 500000, priorities: [] });
assert.ok(tba.reasons.some((r) => r.includes('发售公告')), 'expected a price-TBA reason');

// 4) Budget logic still works when a price is known (synthetic priced unit).
const priced = { ...units.find((u) => u.id === '2RF-T1'), id: 'PRICED', priceFrom: 280000, areaSqm: 38 };
const within = scoreUnit(priced, { householdSize: 1, budget: 300000, priorities: [] });
assert.ok(within.reasons.some((r) => r.includes('在预算内')), 'expected an in-budget reason');
const over = scoreUnit({ ...priced, priceFrom: 600000 }, { householdSize: 1, budget: 300000, priorities: [] });
assert.ok(over.reasons.some((r) => r.includes('超出预算')), 'expected an over-budget warning');

// 5) Household fit: a 5-person household ranks a 3-bedroom layout first.
const big = recommendUnits(units, { householdSize: 5, budget: 0, priorities: [] })[0];
assert.equal(big.unit.bedrooms, 3, 'expected a 3-bedroom layout on top for 5 people');

// 6) Flexi priority surfaces short-lease layouts first for a single applicant.
const flexi = recommendUnits(units, { householdSize: 1, budget: 0, priorities: ['flexi'] })[0];
assert.ok(flexi.unit.tags.includes('short-lease'), 'expected a short-lease layout on top');

// 7) Price formatting: SGD, with a TBA fallback.
assert.equal(formatPrice(450000), 'S$450,000');
assert.equal(priceText({ priceFrom: null }), '价格待发售公告');

console.log(`All recommendation tests passed (${units.length} flat types checked) ✔`);