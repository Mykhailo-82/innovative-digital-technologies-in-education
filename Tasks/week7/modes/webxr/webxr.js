import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { scene, camera, renderer, sunLight } from './scene.js';
import { initAtomBuilder, buildAtom, electronMeshes, nucGroup } from '../../shared/atomBuilder.js';
import { updateUI } from '../../shared/ui.js';
import { initAnimator, tickAtomAR } from '../../shared/animator.js';
import { closePopup, markSelected, setSelectCallback, setCurrentZ } from '../../shared/popup.js';
import { state } from '../../shared/animState.js';
import './controls.js';

let _currentElem = null;
let _onSwitch    = null;

const atomGroup = new THREE.Group();
atomGroup.position.set(0, 0, -0.5);
atomGroup.scale.setScalar(0.05);
scene.add(atomGroup);

export function bootWebXR(initialElem, onSwitch) {
  document.body.classList.add('mode-ar');
  state.autoRotate = false;

  initAtomBuilder({ scene: atomGroup, camera });
  initAnimator({ scene, renderer, camera, sunLight });

  _currentElem = initialElem;
  _onSwitch    = onSwitch;

  setSelectCallback(_switchElement);
  setCurrentZ(_currentElem.z);

  buildAtom(_currentElem);
  updateUI(_currentElem);

  window.addEventListener('atom:wireframe', e => {
    const wf = e.detail;
    electronMeshes.forEach(m => { m.material.wireframe = wf; });
    if (nucGroup) nucGroup.children.forEach(c => { if (c.material) c.material.wireframe = wf; });
  });

  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body },
  });
  arButton.style.cssText = `
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    padding: 12px 28px;
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem;
    letter-spacing: .14em;
    background: rgba(0,212,255,.1);
    border: 1px solid #00d4ff;
    color: #00d4ff;
    cursor: pointer;
  `;
  document.body.appendChild(arButton);

  renderer.setAnimationLoop(() => {
    tickAtomAR();
    renderer.render(scene, camera);
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