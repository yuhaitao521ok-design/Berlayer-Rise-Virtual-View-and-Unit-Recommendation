import { recommendUnits, formatPrice } from './recommend.js';
import { createViewer } from './viewer.js';

const $ = (selector, root = document) => root.querySelector(selector);

const STATUS_LABELS = {
  available: 'Available 在售',
  reserved: 'Reserved 已预留',
  sold: 'Sold 已售',
};

const state = { units: [], viewer: null };

function renderHeroStats() {
  const types = new Set(state.units.map((unit) => unit.type));
  const floors = new Set(state.units.map((unit) => unit.floor));
  $('#stat-units').textContent = String(state.units.length);
  $('#stat-types').textContent = String(types.size);
  $('#stat-floors').textContent = String(floors.size);
}

function renderUnitCards() {
  $('#unit-grid').innerHTML = state.units.map((unit) => `
    <article class="unit-card" data-unit-id="${unit.id}">
      <header>
        <h3>${unit.name}</h3>
        <span class="status status-${unit.status}">${STATUS_LABELS[unit.status] || unit.status}</span>
      </header>
      <p class="unit-meta">${unit.id} · Floor ${unit.floor + 1} · ${unit.areaSqm} m² · ${unit.bedrooms} bed · ${unit.bathrooms} bath · ${unit.aspect} facing</p>
      <p class="unit-price">From ${formatPrice(unit.priceFrom)}</p>
      <ul class="chip-row">${unit.features.map((feature) => `<li class="chip">${feature}</li>`).join('')}</ul>
      <button class="btn btn-small" type="button" data-action="view">View in 3D 三维查看</button>
    </article>`).join('');
}

function renderUnitSelect() {
  $('#unit-select').innerHTML = state.units
    .map((unit) => `<option value="${unit.id}">${unit.id} · ${unit.name}</option>`)
    .join('');
}

function renderUnitDetail(unit) {
  $('#unit-detail').innerHTML = `
    <h3>${unit.name}</h3>
    <p class="unit-meta">Unit ${unit.id} · Floor ${unit.floor + 1} · ${unit.aspect} facing · ${STATUS_LABELS[unit.status] || unit.status}</p>
    <p class="unit-price">Guide price from ${formatPrice(unit.priceFrom)}</p>
    <p class="unit-meta">${unit.areaSqm} m² · ${unit.bedrooms} bedrooms · ${unit.bathrooms} bathrooms</p>
    <ul class="chip-row">${unit.features.map((feature) => `<li class="chip">${feature}</li>`).join('')}</ul>
    <p class="muted">${unit.tags.join(' · ')}</p>`;
}

function selectUnit(unitId) {
  const unit = state.units.find((entry) => entry.id === unitId);
  if (!unit) return;
  document.querySelectorAll('.unit-card').forEach((card) => {
    card.classList.toggle('is-selected', card.dataset.unitId === unitId);
  });
  $('#unit-select').value = unitId;
  renderUnitDetail(unit);
  if (state.viewer) {
    state.viewer.highlight(unitId);
    state.viewer.focus(unitId);
  }
}

function renderRecommendationResults(results) {
  const list = $('#recommend-results');
  if (!results.length) {
    list.innerHTML = '<li class="unit-detail"><p>No units match your preferences yet. 暂无匹配户型，请调整条件。</p></li>';
    return;
  }
  const top = results.slice(0, 5);
  const maxScore = Math.max(...top.map((item) => item.score), 1);
  list.innerHTML = top.map((item, index) => `
    <li class="result-card">
      <span class="result-rank">${index + 1}</span>
      <div>
        <h3>${item.unit.name}</h3>
        <p class="unit-meta">${item.unit.id} · ${item.unit.bedrooms} bed · ${item.unit.areaSqm} m² · From ${formatPrice(item.unit.priceFrom)}</p>
        <ul class="result-reasons">${item.reasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>
      </div>
      <div class="score-wrap">
        <div class="score-value">${Math.round(item.score)}</div>
        <div class="score-bar"><span style="width:${Math.round((Math.max(item.score, 0) / maxScore) * 100)}%"></span></div>
        <button class="btn btn-small" type="button" data-action="view" data-unit-id="${item.unit.id}">View in 3D 三维查看</button>
      </div>
    </li>`).join('');
}

function readPreferences(form) {
  return {
    householdSize: Number($('#pref-household').value),
    budget: Number($('#pref-budget').value) || 0,
    priorities: Array.from(form.querySelectorAll('input[name="priority"]:checked')).map((el) => el.value),
  };
}

function initInteractions() {
  $('#unit-grid').addEventListener('click', (event) => {
    const card = event.target.closest('.unit-card');
    if (card) selectUnit(card.dataset.unitId);
  });

  $('#recommend-results').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="view"]');
    if (button) selectUnit(button.dataset.unitId);
  });

  $('#unit-select').addEventListener('change', (event) => selectUnit(event.target.value));

  const form = $('#recommend-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    renderRecommendationResults(recommendUnits(state.units, readPreferences(form)));
  });
  form.addEventListener('reset', () => {
    window.setTimeout(() => { $('#recommend-results').innerHTML = ''; }, 0);
  });
}

function initViewer() {
  const canvas = $('#viewer-canvas');
  const fallback = $('#viewer-fallback');
  const showError = () => {
    canvas.hidden = true;
    fallback.hidden = false;
  };
  const viewer = createViewer({ canvas, units: state.units, onSelect: selectUnit, onError: showError });
  if (!viewer) {
    showError();
    return;
  }
  state.viewer = viewer;
  if (state.units.length > 0) selectUnit(state.units[0].id);
}

async function init() {
  try {
    const response = await fetch('data/units.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.units = data.units;
    renderHeroStats();
    renderUnitCards();
    renderUnitSelect();
    initInteractions();
    initViewer();
  } catch (error) {
    $('#unit-grid').innerHTML = `<p class="unit-detail">Could not load unit data (${error.message}). 无法加载房源数据，请稍后重试。</p>`;
  }
}

init();