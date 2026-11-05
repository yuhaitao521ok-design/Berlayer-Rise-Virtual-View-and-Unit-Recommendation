/**
 * Unit recommendation engine — pure logic, no DOM, no dependencies.
 * Used by the website (js/main.js) and by node tests (tests/recommend.test.mjs).
 */

/** Priority id -> matcher returning a human-readable reason when the unit fits. */
const PRIORITIES = {
  sunlight: (unit) => {
    if (['S', 'W', 'SW'].includes(unit.aspect) || unit.tags.includes('sunlight')) {
      return 'Bright home with good daylight through the day';
    }
    if (unit.tags.includes('sunset')) {
      return 'Warm evening light';
    }
    return null;
  },
  quiet: (unit) => {
    if (unit.tags.includes('quiet')) {
      return 'Quieter position, away from the street';
    }
    if (unit.floor >= 2) {
      return 'Higher floor means less street noise';
    }
    return null;
  },
  views: (unit) => {
    if (unit.tags.includes('views') || unit.floor >= 2) {
      return 'Elevated outlook over the landscaped grounds';
    }
    return null;
  },
  accessibility: (unit) =>
    unit.tags.includes('step-free')
      ? 'Step-free access, close to the entrance and parking'
      : null,
  outdoor: (unit) => {
    if (unit.tags.includes('terrace')) {
      return 'Private terrace';
    }
    if (unit.tags.includes('balcony')) {
      return 'Private balcony';
    }
    if (unit.tags.includes('garden')) {
      return 'Own ground-floor garden';
    }
    return null;
  },
};

export const PRIORITY_OPTIONS = Object.keys(PRIORITIES);

/** Format a price as GBP, e.g. 289000 -> "£289,000". */
export function formatPrice(value) {
  return `£${Number(value).toLocaleString('en-GB')}`;
}

/**
 * Score one unit against the buyer's preferences.
 * @param {object} unit  a unit entry from data/units.json
 * @param {{budget?: number, householdSize?: number, priorities?: string[]}} prefs
 * @returns {{score: number, reasons: string[]}}
 */
export function scoreUnit(unit, prefs = {}) {
  const reasons = [];
  let score = 0;

  // Budget: staying within budget is the strongest single signal.
  const budget = Number(prefs.budget) || 0;
  if (budget > 0) {
    if (unit.priceFrom <= budget) {
      score += 25;
      reasons.push(`Within your budget (guide price ${formatPrice(unit.priceFrom)})`);
    } else {
      const over = (unit.priceFrom - budget) / budget;
      if (over <= 0.1) {
        score += 8;
        reasons.push(`Slightly over budget by ${Math.round(over * 100)}% — worth a viewing`);
      } else {
        score -= 15;
        reasons.push(`Over budget by ${Math.round(over * 100)}%`);
      }
    }
  }

  // Household fit: match bedroom count to the size of the household.
  const household = Math.max(1, Number(prefs.householdSize) || 2);
  const idealBeds = household <= 1 ? 1 : household <= 2 ? 2 : household <= 4 ? 3 : 4;
  const shortfall = idealBeds - unit.bedrooms;
  if (shortfall === 0) {
    score += 20;
    reasons.push(`Good size match for ${household} ${household === 1 ? 'person' : 'people'}`);
  } else if (shortfall < 0) {
    score += 12;
    reasons.push('Extra bedrooms — useful for guests or a home office');
  } else if (shortfall === 1) {
    score += 2;
    reasons.push(`One bedroom fewer than ideal — workable for ${household}`);
  } else {
    score -= 6 * shortfall;
    reasons.push(`May feel tight for ${household} people (${unit.bedrooms} bed)`);
  }

  // Priorities chosen by the buyer.
  for (const priority of prefs.priorities || []) {
    const match = PRIORITIES[priority] ? PRIORITIES[priority](unit) : null;
    if (match) {
      score += 15;
      reasons.push(match);
    } else {
      score -= 2;
    }
  }

  // Space bonus: unusually generous layouts score higher.
  if (unit.areaSqm >= 28 + unit.bedrooms * 22) {
    score += 5;
    reasons.push(`Generous living space (${unit.areaSqm} m²)`);
  }

  return { score, reasons: reasons.slice(0, 5) };
}

/**
 * Rank all units for a set of preferences.
 * @returns {Array<{unit: object, score: number, reasons: string[]}>}
 */
export function recommendUnits(units, prefs = {}) {
  return units
    .map((unit) => ({ unit, ...scoreUnit(unit, prefs) }))
    .sort((a, b) => b.score - a.score || a.unit.priceFrom - b.unit.priceFrom);
}
