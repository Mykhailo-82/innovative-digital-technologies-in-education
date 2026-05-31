/* global THREE */
import { makeScene } from '../../shared/makeScene.js';

const wrap = document.getElementById('canvas-wrap');
const { scene, sunLight } = makeScene();

export { scene, sunLight };

export const camera = new THREE.PerspectiveCamera(
  55,
  wrap.clientWidth / wrap.clientHeight,
  0.01,
  1000,
);
camera.position.set(0, 0, 9);

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
});