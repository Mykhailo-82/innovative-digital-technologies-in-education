/* global THREE */

import { camera, renderer, scene } from './scene.js';
import { state } from '../../shared/animState.js';

export let wireframe = false;

let isDragging = false;
let prevX = 0, prevY = 0;

renderer.domElement.addEventListener('mousedown', e => {
  isDragging = true; prevX = e.clientX; prevY = e.clientY;
});
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  state.sceneRot.y += (e.clientX - prevX) * 0.008;
  state.sceneRot.x += (e.clientY - prevY) * 0.008;
  prevX = e.clientX; prevY = e.clientY;
});

renderer.domElement.addEventListener('touchstart', e => {
  isDragging = true;
  prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
});
window.addEventListener('touchend', () => { isDragging = false; });
window.addEventListener('touchmove', e => {
  if (!isDragging) return;
  state.sceneRot.y += (e.touches[0].clientX - prevX) * 0.008;
  state.sceneRot.x += (e.touches[0].clientY - prevY) * 0.008;
  prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
});

renderer.domElement.addEventListener('wheel', e => {
  camera.position.z = Math.max(3, Math.min(100, camera.position.z + e.deltaY * 0.01));
});

document.getElementById('btn-rotate').addEventListener('click', function () {
  state.autoRotate = !state.autoRotate;
  this.classList.toggle('active', state.autoRotate);
});

document.getElementById('btn-wireframe').addEventListener('click', function () {
  wireframe = !wireframe;
  this.classList.toggle('active', wireframe);
  window.dispatchEvent(new CustomEvent('atom:wireframe', { detail: wireframe }));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  state.sceneRot.x = 0;
  state.sceneRot.y = 0;
  scene.rotation.set(0, 0, 0);
});

document.getElementById('info-toggle').addEventListener('click', function () {
  const collapsed = document.getElementById('info').classList.toggle('collapsed');
  this.textContent = collapsed ? 'РОЗГОРНУТИ' : 'ЗГОРНУТИ';
});