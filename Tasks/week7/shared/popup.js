
import ELEMENTS from './elements.js';
import { PERIODS } from './constants.js';

let _onSelect = null;
export function setSelectCallback(fn) { _onSelect = fn; }

let _currentZ = 3;
export function setCurrentZ(z) { _currentZ = z; }

export function openPopup() {
  _buildTable();
  const overlay = document.getElementById('overlay');
  overlay.classList.add('open');
  const search = document.getElementById('elem-search');
  search.value = '';
  _applyFilter('');
}

export function closePopup() {
  document.getElementById('overlay').classList.remove('open');
}

export function initPopup() {
  document.getElementById('popup-close')
    .addEventListener('click', closePopup);

  document.getElementById('overlay')
    .addEventListener('click', e => {
      if (e.target === document.getElementById('overlay')) closePopup();
    });

  document.getElementById('elem-search')
    .addEventListener('input', function () { _applyFilter(this.value); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopup();
  });
}

function _buildTable() {
  const scroll = document.getElementById('table-scroll');
  scroll.innerHTML = '';

  PERIODS.forEach(period => {
    const inPeriod = ELEMENTS.filter(
      e => e.z >= period.zRange[0] && e.z <= period.zRange[1],
    );
    if (!inPeriod.length) return;

    const lbl = document.createElement('div');
    lbl.className   = 'period-label';
    lbl.textContent = period.label;
    scroll.appendChild(lbl);

    const row = document.createElement('div');
    row.className = 'elem-group';

    inPeriod.forEach(elem => {
      const card = document.createElement('div');
      card.className    = `elem-card cat-${elem.cat}`;
      card.dataset.z    = elem.z;
      card.dataset.search = `${elem.z} ${elem.sym} ${elem.name}`.toLowerCase();
      if (elem.z === _currentZ) card.classList.add('selected');

      card.innerHTML =
        `<span class="e-num">${elem.z}</span>` +
        `<span class="e-sym">${elem.sym}</span>` +
        `<span class="e-name">${elem.name}</span>` +
        `<span class="e-mass">${elem.mass}</span>`;

      card.addEventListener('click', () => {
        if (_onSelect) _onSelect(elem);
      });

      row.appendChild(card);
    });

    scroll.appendChild(row);
  });
}

function _applyFilter(raw) {
  const q = raw.toLowerCase().trim();

  document.querySelectorAll('.elem-card').forEach(card => {
    card.classList.toggle('hidden-elem', !!q && !card.dataset.search.includes(q));
  });

  document.querySelectorAll('.elem-group').forEach(group => {
    const hasVisible = [...group.querySelectorAll('.elem-card')]
      .some(c => !c.classList.contains('hidden-elem'));
    group.style.display = hasVisible ? '' : 'none';
    const prev = group.previousElementSibling;
    if (prev?.classList.contains('period-label'))
      prev.style.display = hasVisible ? '' : 'none';
  });
}

export function markSelected(z) {
  _currentZ = z;
  document.querySelectorAll('.elem-card').forEach(c => {
    c.classList.toggle('selected', Number(c.dataset.z) === z);
  });
}