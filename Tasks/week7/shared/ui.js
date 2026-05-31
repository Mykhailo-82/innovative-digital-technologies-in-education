import { SHELL_CSS, SHELL_NAMES, ORBIT_LABELS } from './constants.js';

function plural(n) {
  if (n === 1) return '';
  if (n >= 2 && n <= 4) return 'и';
  return 'ів';
}

export function updateUI(elem) {
  _updateHeader(elem);
  _updateInfoPanel(elem);
  _updateOrbitLegend(elem);
}

function _updateHeader(elem) {
  document.getElementById('hdr-num').textContent   = elem.z;
  document.getElementById('hdr-sym').textContent   = elem.sym;
  document.getElementById('hdr-mass').textContent  = elem.mass;
  document.getElementById('hdr-title').textContent = elem.name.toUpperCase();
  document.getElementById('hdr-desc').textContent  =
    `${elem.protons} протон${plural(elem.protons)} · ` +
    `${elem.neutrons} нейтрон${plural(elem.neutrons)} · ` +
    `${elem.protons} електрон${plural(elem.protons)}`;
}

function _updateInfoPanel(elem) {
  document.getElementById('inf-z').textContent  = elem.z;
  document.getElementById('inf-p').textContent  = elem.protons;
  document.getElementById('inf-n').textContent  = elem.neutrons;
  document.getElementById('inf-e').textContent  = elem.protons;
  document.getElementById('inf-sh').textContent = elem.shells.join(', ');
}

function _updateOrbitLegend(elem) {
  const legend = document.getElementById('orb-legend');
  legend.innerHTML = '';

  elem.shells.forEach((cnt, si) => {
    const c   = SHELL_CSS[si % SHELL_CSS.length];
    const div = document.createElement('div');
    div.className = 'orb-row';
    div.innerHTML =
      `<div class="orb-dot" style="background:${c};box-shadow:0 0 5px ${c}"></div>` +
      `<div class="orb-info">` +
        `<strong>Орбіта ${si + 1}</strong> · ${ORBIT_LABELS[si] ?? ''}<br>` +
        `${cnt} електрон${plural(cnt)} · ${SHELL_NAMES[si]}-оболонка` +
      `</div>`;
    legend.appendChild(div);
  });
}