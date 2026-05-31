import { nucGroup, electronPivots, orbitSpeeds, baseAngles } from './atomBuilder.js';
import { state } from './animState.js';

/* global THREE */
const clock = new THREE.Clock();

let _scene, _renderer, _camera, _sunLight;

export function initAnimator({ scene, renderer, camera, sunLight }) {
  _scene    = scene;
  _renderer = renderer;
  _camera   = camera;
  _sunLight = sunLight;
}

export function tickAtom() {
  const t = clock.getElapsedTime() * state.speed;

  if (state.autoRotate) {
    _scene.rotation.y = state.sceneRot.y + t * 0.18;
    _scene.rotation.x = state.sceneRot.x + Math.sin(t * 0.07) * 0.08;
  } else {
    _scene.rotation.y = state.sceneRot.y;
    _scene.rotation.x = state.sceneRot.x;
  }

  if (nucGroup) {
    nucGroup.scale.setScalar(1 + 0.04 * Math.sin(t * 3.5));
  }

  for (let i = 0; i < electronPivots.length; i++) {
    electronPivots[i].rotation.z = baseAngles[i] + t * orbitSpeeds[i];
  }

  if (_sunLight) {
    _sunLight.position.x = 3 + Math.sin(t * 0.4) * 2;
    _sunLight.position.y = 5 + Math.cos(t * 0.3) * 1;
  }
}

export function startAnimationLoop() {
  requestAnimationFrame(startAnimationLoop);
  tickAtom();
  _renderer.render(_scene, _camera);
}

export function tickAtomAR() {
  const t = clock.getElapsedTime() * state.speed;

  if (nucGroup) {
    nucGroup.scale.setScalar(1 + 0.04 * Math.sin(t * 3.5));
  }

  for (let i = 0; i < electronPivots.length; i++) {
    electronPivots[i].rotation.z = baseAngles[i] + t * orbitSpeeds[i];
  }

  if (_sunLight) {
    _sunLight.position.x = 3 + Math.sin(t * 0.4) * 2;
    _sunLight.position.y = 5 + Math.cos(t * 0.3) * 1;
  }
}