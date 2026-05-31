/* global THREE */

import { makeScene } from '../../shared/makeScene.js';

const { scene, sunLight } = makeScene();
export { scene, sunLight };

export const camera = new THREE.Camera();

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.domElement.style.cssText =
  'position:fixed;top:0;left:0;z-index:2;pointer-events:none;';
document.body.appendChild(renderer.domElement);