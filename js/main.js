import { recommendUnits, priceText } from './recommend.js';
import { createViewer } from './viewer.js';

const $ = (selector, root = document) => root.querySelector(selector);

const STATUS_LABELS = {
  launch: '发售中 On Launch',
  available: 'Available 可选',
  reserved: 'Reserved 已预留',
  sold: 'Sold 已售',
};

const state = { data: null, units: [], viewer: null };

function renderHeroStats() {
  const stats = state.data.stats;
  $('#stat-blocks').textContent = String(stats.blocks);
  $('#stat-units').textContent = stats.totalUnits.toLocaleString('en-SG');
  $('#stat-types').textContent = String(stats.flatTypes);
  $('#stat-storeys').textContent = stats.storeysRange;
}

function renderUnitCards() {
  $('#unit-grid').innerHTML = state.units.map((unit) => `
    <article class="unit-card" data-unit-id="${unit.id}">
      <header>
        <h3>${unit.name}</h3>
        <span class="status status-available">${STATUS_LABELS[unit.status] || unit.status}</span>
      </header>
      <p class="unit-meta">${unit.type} · 卧室 ${unit.bedrooms} · 浴室 ${unit.bathrooms} · ${unit.blocks.length} 座楼栋可选</p>
      <p class="unit-price">${priceText(unit)}</p>
      <p class="unit-meta">${unit.stacks}</p>
      <ul class="chip-row">${unit.features.map((feature) => `<li class="chip">${feature}</li>`).join('')}</ul>
      <button class="btn btn-small" type="button" data-action="view">View in 3D 三维查看</button>
    </article>`).join('');
}

function renderUnitSelect() {
  $('#unit-select').innerHTML = state.units
    .map((unit) => `<option value="${unit.id}">${unit.name}</option>`)
    .join('');
}

function renderUnitDetail(unit) {
  $('#unit-detail').innerHTML = `
    <h3>${unit.name}</h3>
    <p class="unit-price">${priceText(unit)}</p>
    <p class="unit-meta">${unit.lease} · ${STATUS_LABELS[unit.status] || unit.status}</p>
    <p class="unit-meta">${unit.stacks}</p>
    <ul class="chip-row">${unit.layout.map((item) => `<li class="chip">${item}</li>`).join('')}</ul>
    <ul class="result-reasons">${unit.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
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
    list.innerHTML = '<li class="unit-detail"><p>暂无匹配户型，请调整条件。No flat types match your preferences yet.</p></li>';
    return;
  }
  const top = results.slice(0, 4);
  const maxScore = Math.max(...top.map((item) => item.score), 1);
  list.innerHTML = top.map((item, index) => `
    <li class="result-card">
      <span class="result-rank">${index + 1}</span>
      <div>
        <h3>${item.unit.name}</h3>
        <p class="unit-meta">卧室 ${item.unit.bedrooms} · ${item.unit.blocks.length} 座楼栋可选 · ${priceText(item.unit)}</p>
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
  const hint = $('.viewer-hint');
  const showError = () => {
    canvas.hidden = true;
    fallback.hidden = false;
    if (hint) hint.hidden = true;
  };
  const viewer = createViewer({
    canvas,
    blocks: state.data.blocks,
    units: state.units,
    onSelect: selectUnit,
    onError: showError,
  });
  if (viewer) {
    state.viewer = viewer;
  } else {
    showError();
  }
  if (state.units.length > 0) selectUnit(state.units[0].id);
}

async function init() {
  try {
    const response = await fetch('data/units.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.data = data;
    state.units = data.units;
    renderHeroStats();
    renderUnitCards();
    renderUnitSelect();
    initInteractions();
    initViewer();
  } catch (error) {
    $('#unit-grid').innerHTML = `<p class="unit-detail">无法加载房源数据（${error.message}），请稍后重试。</p>`;
  }
}

init();
