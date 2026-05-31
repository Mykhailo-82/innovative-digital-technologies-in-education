import { scene, camera, renderer, sunLight } from './scene.js';
import { initAtomBuilder, buildAtom, electronMeshes, nucGroup } from '../../shared/atomBuilder.js';
import { updateUI } from '../../shared/ui.js';
import { initAnimator, tickAtomAR  } from '../../shared/animator.js';
import { closePopup, markSelected, setSelectCallback, setCurrentZ } from '../../shared/popup.js';
import './controls.js';


let _currentElem = null;
let _onSwitch    = null;
let _arToolkitSource, _arToolkitContext, _markerRoot;

export function bootARJS(initialElem, onSwitch) {
  document.body.classList.add('mode-ar');

  initAtomBuilder({ scene, camera }); // ← додати першим
  initAnimator({ scene, renderer, camera, sunLight });

  _currentElem = initialElem;
  _onSwitch    = onSwitch;

  _initAR();

  initAnimator({ scene, renderer, camera, sunLight });
  setSelectCallback(_switchElement);
  setCurrentZ(_currentElem.z);

  buildAtom(_currentElem);
  updateUI(_currentElem);

  window.addEventListener('atom:wireframe', e => {
    const wf = e.detail;
    electronMeshes.forEach(m => { m.material.wireframe = wf; });
    if (nucGroup) nucGroup.children.forEach(c => { if (c.material) c.material.wireframe = wf; });
  });

  // _startARLoop();
}

function _initAR() {
  _arToolkitSource = new THREEx.ArToolkitSource({ sourceType: 'webcam' });
  _arToolkitSource.init(() => {
    const video = _arToolkitSource.domElement;
    video.style.cssText = `
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important;
      object-fit: cover !important;
      z-index: 1 !important;
      margin: 0 !important;
    `;
    _onResize();
    setTimeout(_onResize, 500);
  });

  _arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: './modes/arjs/camera_para.dat',
    detectionMode: 'mono',
  });

  _arToolkitContext.init(() => {
    camera.projectionMatrix.copy(_arToolkitContext.getProjectionMatrix());

    _markerRoot = new THREE.Group();
    _markerRoot.matrixAutoUpdate = false;
    scene.add(_markerRoot);

    new THREEx.ArMarkerControls(_arToolkitContext, _markerRoot, {
      type: 'pattern',
      patternUrl: './modes/arjs/marker/marker-atom.patt',
    });

    console.log('ArMarkerControls created, arController:', _arToolkitContext.arController);

    _reparentAtomToMarker();
    _startARLoop();
  });

  window.addEventListener('resize', _onResize);
}

function _onResize() {
  _arToolkitSource.onResizeElement();
  _arToolkitSource.copyElementSizeTo(renderer.domElement);

  if (_arToolkitContext.arController !== null) {
    _arToolkitSource.copyElementSizeTo(_arToolkitContext.arController.canvas);
  }

  const video = _arToolkitSource.domElement;
  if (video && video.tagName === 'VIDEO') {
    video.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      object-fit: cover !important;
      z-index: 1 !important;
      margin: 0 !important;
    `;
  }
}

function _startARLoop() {
  requestAnimationFrame(function loop() {
    requestAnimationFrame(loop);

    if (_arToolkitSource.ready) {
      _arToolkitContext.update(_arToolkitSource.domElement);
    }

    _markerRoot.children.forEach(child => {
      child.visible = _markerRoot.visible;
    });

    tickAtomAR();
    renderer.render(scene, camera);
  });
}

function _reparentAtomToMarker() {
  const toMove = [...scene.children].filter(
    obj => obj !== _markerRoot && !(obj.isLight),
  );
  toMove.forEach(obj => {
    scene.remove(obj);
    _markerRoot.add(obj);
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
    _reparentAtomToMarker();
    updateUI(elem);
    markSelected(elem.z);
    setCurrentZ(elem.z);
    flash.style.transition = 'opacity .3s';
    flash.style.opacity    = '0';
  }, 120);

  closePopup();
}