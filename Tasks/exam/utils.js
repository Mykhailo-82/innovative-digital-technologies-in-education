// massage
let toastTimer = null;
function toast(msg, dur = 2200) {
  const t = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  t.innerHTML = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    t.innerHTML = '';
    toastTimer = null;
  }, dur);
}

function h2(n) {
  return Math.round(n);
}

// Progress bar
function buildStageNav() {
  const nav = document.getElementById('stageNav');
  nav.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const step = document.createElement('div');
    step.className = 'stage-step';
    step.setAttribute('data-stage', i);
    step.onclick = () => goStage(i);
    const circle = document.createElement('div');
    circle.className = 'step-circle';
    circle.textContent = i;
    step.appendChild(circle);
    nav.appendChild(step);
  }
}
buildStageNav();

// First screen
document.getElementById('splashStartBtn').addEventListener('click', async () => {
  try { await document.documentElement.requestFullscreen(); } catch (e) {}
  const splash = document.getElementById('splash');
  splash.classList.add('hiding');
  setTimeout(() => { splash.style.display = 'none'; }, 400);
});

// Fullscreen button
const fsBtn = document.getElementById('fsBtn');
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() =>
      toast('<i class="fas fa-exclamation-triangle"></i> Повний екран не дозволено')
    );
  } else {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  fsBtn.innerHTML = document.fullscreenElement
    ? '<i class="fas fa-compress"></i>'
    : '<i class="fas fa-expand"></i>';
});

// Stages navigation
function goStage(n) {
  document.querySelectorAll('.stage').forEach((s, i) => s.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.stage-step').forEach((step, idx) => {
    step.classList.remove('active', 'done');
    if (idx + 1 < n) step.classList.add('done');
    if (idx + 1 === n) step.classList.add('active');
  });
  if (n === 2) onEnterAR();
  if (n === 3) initStage3();
  if (n === 4) initStage4();
}

// Save AR exit
async function exitXRAndGoStage(n) {
  if (arSession) {
    try { await arSession.end(); } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (wasFullscreenBeforeXR) {
    try { await document.documentElement.requestFullscreen(); } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  goStage(n);
}