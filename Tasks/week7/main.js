import ELEMENTS from './shared/elements.js';
import { initPopup, setSelectCallback } from './shared/popup.js';

let currentElem = ELEMENTS.find(e => e.z === 3);

setSelectCallback(() => {});
initPopup();

function dismissModeScreen() {
  const s = document.getElementById('mode-screen');
  s.classList.add('hidden');
  setTimeout(() => s.remove(), 400);
}

document.getElementById('mode-vr').addEventListener('click', async () => {
  dismissModeScreen();
  const { bootVR } = await import('./modes/vr/vr.js');
  bootVR(currentElem, elem => { currentElem = elem; });
});

document.getElementById('mode-arjs').addEventListener('click', async () => {
  dismissModeScreen();
  const { bootARJS } = await import('./modes/arjs/arjs.js');
  bootARJS(currentElem, elem => { currentElem = elem; });
});

document.getElementById('mode-mindar').addEventListener('click', async () => {
  dismissModeScreen();
  const { bootMindAR } = await import('./modes/mindar/mindar.js');
  bootMindAR(currentElem, elem => { currentElem = elem; });
});

document.getElementById('mode-webxr').addEventListener('click', async () => {
  dismissModeScreen();
  const { bootWebXR } = await import('./modes/webxr/webxr.js');
  bootWebXR(currentElem, elem => { currentElem = elem; });
});