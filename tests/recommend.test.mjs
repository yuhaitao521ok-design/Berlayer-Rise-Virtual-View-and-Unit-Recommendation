import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recommendUnits, scoreUnit, formatPrice } from '../js/recommend.js';

const data = JSON.parse(readFileSync(new URL('../data/units.json', import.meta.url), 'utf8'));
const units = data.units;

// 1) Data sanity: schema fields stay consistent with the 3D grid placement.
assert.ok(units.length >= 8, 'expected a meaningful number of sample units');
for (const unit of units) {
  assert.equal(typeof unit.id, 'string');
  assert.ok(unit.bedrooms >= 1 && unit.areaSqm > 0, `${unit.id}: invalid size fields`);
  assert.equal(unit.grid.floor, unit.floor, `${unit.id}: grid.floor must match floor`);
  assert.ok([0, 1, 2, 3].includes(unit.grid.col), `${unit.id}: unexpected grid column`);
}

// 2) Full ranking: every unit is returned, sorted by descending score.
const ranked = recommendUnits(units, { householdSize: 2, budget: 400000, priorities: ['sunlight', 'quiet'] });
assert.equal(ranked.length, units.length, 'every unit must take part in the ranking');
for (let i = 1; i < ranked.length; i += 1) {
  assert.ok(ranked[i - 1].score >= ranked[i].score, 'results must be sorted by descending score');
}

// 3) Budget logic: staying inside budget is rewarded, going far over is flagged.
const within = scoreUnit(units.find((u) => u.id === 'A-101'), { householdSize: 1, budget: 290000, priorities: [] });
assert.ok(within.reasons.some((r) => r.includes('Within your budget')), 'expected a budget-fit reason');
const over = scoreUnit(units.find((u) => u.id === 'D-302'), { householdSize: 2, budget: 300000, priorities: [] });
assert.ok(over.reasons.some((r) => r.includes('Over budget by')), 'expected an over-budget warning');

// 4) Accessibility priority ranks a step-free home first and explains why.
const accessible = recommendUnits(units, { householdSize: 2, budget: 600000, priorities: ['accessibility'] })[0];
assert.ok(accessible.unit.tags.includes('step-free'), 'expected a step-free unit on top');
assert.ok(accessible.reasons.length > 0, 'recommendations must explain themselves');

// 5) Outdoor priority surfaces a home with outdoor space first.
const outdoor = recommendUnits(units, { householdSize: 5, budget: 700000, priorities: ['outdoor'] })[0];
assert.ok(['balcony', 'terrace', 'garden'].some((tag) => outdoor.unit.tags.includes(tag)), 'expected outdoor space on top');

// 6) Price formatting is GBP with thousands separators.
assert.equal(formatPrice(289000), '£289,000');

console.log(`All recommendation tests passed (${units.length} units checked) ✔`);