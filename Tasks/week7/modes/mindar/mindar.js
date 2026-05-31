import { scene, camera, renderer, sunLight } from './scene.js';
import { initAtomBuilder, buildAtom, electronMeshes, nucGroup } from '../../shared/atomBuilder.js';
import { updateUI } from '../../shared/ui.js';
import { initAnimator, tickAtomAR } from '../../shared/animator.js';
import { closePopup, markSelected, setSelectCallback, setCurrentZ } from '../../shared/popup.js';
import { state } from '../../shared/animState.js';
import './controls.js';

import { MindARThree } from 'mindar-image-three';

let _currentElem = null;
let _onSwitch    = null;
let _mindarThree = null;
let _anchor      = null;

export async function bootMindAR(initialElem, onSwitch) {
  document.body.classList.add('mode-ar');
  state.autoRotate = false;

  _currentElem = initialElem;
  _onSwitch    = onSwitch;

  setSelectCallback(_switchElement);
  setCurrentZ(_currentElem.z);

  updateUI(_currentElem);

  window.addEventListener('atom:wireframe', e => {
    const wf = e.detail;
    electronMeshes.forEach(m => { m.material.wireframe = wf; });
    if (nucGroup) nucGroup.children.forEach(c => { if (c.material) c.material.wireframe = wf; });
  });

  await _initMindAR();
}

async function _initMindAR() {
  _mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: './modes/mindar/marker/marker-atom.mind',
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
  });

  const { renderer: mindRenderer, scene: mindScene, camera: mindCamera } = _mindarThree;

  initAnimator({ scene: mindScene, renderer: mindRenderer, camera: mindCamera, sunLight });
  initAtomBuilder({ scene: mindScene, camera: mindCamera });

  [sunLight, ...scene.children.filter(o => o.isLight)].forEach(light => {
    scene.remove(light);
    mindScene.add(light);
  });

  _anchor = _mindarThree.addAnchor(0);

  buildAtom(_currentElem);
  _reparentAtomToAnchor();

  _anchor.onTargetFound = () => console.log('MindAR: target found');
  _anchor.onTargetLost  = () => console.log('MindAR: target lost');

  await _mindarThree.start();

  mindRenderer.setAnimationLoop(() => {
    tickAtomAR();
    mindRenderer.render(mindScene, mindCamera);
  });
}

function _reparentAtomToAnchor() {
  if (!_anchor) return;

  _anchor.group.clear();

  const { scene: mindScene } = _mindarThree;
  const wrapper = new THREE.Group();
  wrapper.scale.setScalar(0.3);
  wrapper.position.set(0.5, 0, 0.5);

  const toMove = [...mindScene.children].filter(obj => !obj.isLight && obj !== _anchor.group);
  toMove.forEach(obj => {
    mindScene.remove(obj);
    wrapper.add(obj);
  });

  _anchor.group.add(wrapper);
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
    _reparentAtomToAnchor();
    updateUI(elem);
    markSelected(elem.z);
    setCurrentZ(elem.z);
    flash.style.transition = 'opacity .3s';
    flash.style.opacity    = '0';
  }, 120);

  closePopup();
}