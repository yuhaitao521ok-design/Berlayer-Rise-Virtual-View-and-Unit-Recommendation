/**
 * Flat-type recommendation engine for Berlayar Rise (HDB BTO, June 2026).
 * Pure logic — no DOM, no dependencies. Prices and areas may be null (TBA at launch).
 */

/** Priority id -> matcher returning a human-readable reason when the flat fits. */
const PRIORITIES = {
  space: (unit) => {
    if (unit.bedrooms >= 3) return `布局宽敞（${unit.bedrooms} 间卧室），适合家庭成长`;
    if (unit.bedrooms === 2) return '两间卧室，育儿 / 居家办公两相宜';
    return null;
  },
  views: (unit) =>
    (unit.blocks || []).some((b) => ['201A', '200B'].includes(b))
      ? '位于 48–49 层高塔楼（Blk 201A / 200B），视野与通风俱佳'
      : null,
  flexi: (unit) =>
    (unit.tags || []).includes('short-lease')
      ? '可选 55/45 年短租期（Short Lease），适合年长买家'
      : null,
  choice: (unit) =>
    (unit.blocks || []).length >= 4
      ? `分布在 ${unit.blocks.length} 座楼栋、套号充足，抽签选择余地更大`
      : null,
  value: (unit) =>
    (unit.tags || []).includes('compact')
      ? '小户型上手门槛更低（总价待发售公告）'
      : null,
};

export const PRIORITY_OPTIONS = Object.keys(PRIORITIES);

/** Format a price as SGD, e.g. 450000 -> "S$450,000". */
export function formatPrice(value) {
  return `S$${Number(value).toLocaleString('en-SG')}`;
}

/** Human-readable price line (handles TBA prices). */
export function priceText(unit) {
  return unit.priceFrom == null ? '价格待发售公告' : `${formatPrice(unit.priceFrom)} 起`;
}

/**
 * Score one flat type against the buyer's preferences.
 * @param {object} unit  a unit entry from data/units.json
 * @param {{budget?: number, householdSize?: number, priorities?: string[]}} prefs
 * @returns {{score: number, reasons: string[]}}
 */
export function scoreUnit(unit, prefs = {}) {
  const reasons = [];
  let score = 0;

  // Budget (advisory when prices are not yet announced).
  const budget = Number(prefs.budget) || 0;
  if (budget > 0) {
    if (unit.priceFrom == null) {
      reasons.push('价格待 HDB 发售公告，建议先按家庭需求筛选');
    } else if (unit.priceFrom <= budget) {
      score += 25;
      reasons.push(`在预算内（${formatPrice(unit.priceFrom)} 起）`);
    } else {
      const over = (unit.priceFrom - budget) / budget;
      if (over <= 0.1) {
        score += 8;
        reasons.push(`略超预算 ${Math.round(over * 100)}%，值得看房`);
      } else {
        score -= 15;
        reasons.push(`超出预算 ${Math.round(over * 100)}%`);
      }
    }
  }

  // Household fit against bedroom count.
  const household = Math.max(1, Number(prefs.householdSize) || 2);
  const idealBeds = household <= 1 ? 1 : household <= 2 ? 2 : 3;
  const shortfall = idealBeds - unit.bedrooms;
  if (shortfall === 0) {
    score += 20;
    reasons.push(`卧室数量匹配 ${household} 人家庭`);
  } else if (shortfall < 0) {
    score += 12;
    reasons.push('多一间房——客房或居家办公更从容');
  } else if (shortfall === 1) {
    score += 2;
    reasons.push(`少一间卧室，${household} 人家庭可作弹性安排`);
  } else {
    score -= 6 * shortfall;
    reasons.push(`${household} 人家庭住 ${unit.bedrooms} 房可能偏紧`);
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

  // Space bonus when the official area is known and generous.
  if (unit.areaSqm != null && unit.areaSqm >= 28 + unit.bedrooms * 22) {
    score += 5;
    reasons.push(`空间充裕（${unit.areaSqm} m²）`);
  }

  return { score, reasons: reasons.slice(0, 5) };
}

/**
 * Rank all flat types for a set of preferences.
 * @returns {Array<{unit: object, score: number, reasons: string[]}>}
 */
export function recommendUnits(units, prefs = {}) {
  return units
    .map((unit) => ({ unit, ...scoreUnit(unit, prefs) }))
    .sort((a, b) => b.score - a.score || (a.unit.priceFrom ?? 0) - (b.unit.priceFrom ?? 0));
}
