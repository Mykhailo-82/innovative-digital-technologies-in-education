import { initAtomBuilder, buildAtom, electronMeshes, nucGroup } from '../../shared/atomBuilder.js';
import { updateUI } from '../../shared/ui.js';
import { openPopup, closePopup, markSelected, setSelectCallback, setCurrentZ } from '../../shared/popup.js';
import { scene, camera, renderer, sunLight } from './scene.js';
import { initAnimator, startAnimationLoop } from '../../shared/animator.js';
import './controls.js';

let _currentElem = null;
let _onSwitch    = null;

export function bootVR(initialElem, onSwitch) {
  initAtomBuilder({ scene, camera });
  initAnimator({ scene, renderer, camera, sunLight });

  _currentElem = initialElem;
  _onSwitch    = onSwitch;

  setSelectCallback(_switchElement);
  setCurrentZ(_currentElem.z);

  buildAtom(_currentElem);
  updateUI(_currentElem);
  startAnimationLoop();

  document.getElementById('btn-table').addEventListener('click', openPopup);
  document.getElementById('header-badge').addEventListener('click', openPopup);

  window.addEventListener('atom:wireframe', e => {
    const wf = e.detail;
    electronMeshes.forEach(m => { m.material.wireframe = wf; });
    if (nucGroup) nucGroup.children.forEach(c => { if (c.material) c.material.wireframe = wf; });
  });
}

function _switchElement(elem) {
  if (elem === _currentElem) { closePopup(); return; }
  _currentElem = elem;
  _onSwitch?.(elem);

  const flash = document.getElementById('flash');
  flash.style.transition = 'opacity .12s';
  flash.style.opacity    = '0.25';

  setTimeout(() => {
    buildAtom(elem);
    updateUI(elem);
    markSelected(elem.z);
    setCurrentZ(elem.z);
    flash.style.transition = 'opacity .3s';
    flash.style.opacity    = '0';
  }, 120);

  closePopup();
}