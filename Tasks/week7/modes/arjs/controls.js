import { state } from '../../shared/animState.js';
import { openPopup } from '../../shared/popup.js';

document.getElementById('btn-rotate').addEventListener('click', function () {
  state.autoRotate = !state.autoRotate;
  this.classList.toggle('active', state.autoRotate);
});

document.getElementById('btn-wireframe').addEventListener('click', function () {
  const wf = this.classList.toggle('active');
  window.dispatchEvent(new CustomEvent('atom:wireframe', { detail: wf }));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  state.sceneRot.x = 0;
  state.sceneRot.y = 0;
});

document.getElementById('info-toggle').addEventListener('click', function () {
  const collapsed = document.getElementById('info').classList.toggle('collapsed');
  this.textContent = collapsed ? 'РОЗГОРНУТИ' : 'ЗГОРНУТИ';
});

document.getElementById('btn-table').addEventListener('click', openPopup);
document.getElementById('header-badge').addEventListener('click', openPopup);