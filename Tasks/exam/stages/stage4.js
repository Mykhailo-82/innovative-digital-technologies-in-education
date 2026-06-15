async function initStage4() {
  buildBars();
  if (!state.model) {
    document.getElementById('predLabel').textContent = 'Навчіть модель спочатку';
    return;
  }
  if (state.inferStream) {
    document.getElementById('inferCamStatus').innerHTML = '<i class="fas fa-video"></i> Камера активна';
    return;
  }
  try {
    state.inferStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }
    });
    document.getElementById('inferVideo').srcObject = state.inferStream;
    document.getElementById('inferCamStatus').innerHTML = '<i class="fas fa-video"></i> Камера активна';
    clearInterval(state.inferInterval);
    state.inferInterval = setInterval(runInfer, 300);
  } catch (e) {
    toast('<i class="fas fa-times-circle"></i> Камера: ' + e.message);
    document.getElementById('inferCamStatus').innerHTML =
      '<i class="fas fa-video-slash"></i> Помилка камери';
  }
}

function buildBars() {
  const wrap = document.getElementById('barsWrap');
  wrap.innerHTML = '';
  state.classes.forEach(cls => {
    const row = document.createElement('div');
    row.className = 'prob-row';
    row.innerHTML = `
      <div class="prob-name">${cls.name}</div>
      <div class="prob-bar-wrap"><div class="prob-bar-fill" id="bar_${cls.id}" style="width:0%"></div></div>
      <div class="prob-pct" id="pct_${cls.id}">0%</div>`;
    wrap.appendChild(row);
  });
}

async function runInfer() {
  if (!state.model) return;
  const video = document.getElementById('inferVideo');
  const canvas = document.getElementById('inferCanvas');
  if (!video.videoWidth) return;
  const vw = video.videoWidth,
        vh = video.videoHeight;
  const side = Math.min(vw, vh);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, 256, 256);
  const pred = tf.tidy(() =>
    state.model.predict(
      tf.browser.fromPixels(canvas, 3).resizeBilinear([64, 64]).toFloat().div(255).expandDims(0)
    )
  );
  const probs = await pred.data();
  pred.dispose();
  let mi = 0,
      mv = 0;
  probs.forEach((p, i) => {
    if (p > mv) {
      mv = p;
      mi = i;
    }
  });
  document.getElementById('predLabel').textContent = state.classes[mi]?.name || '?';
  document.getElementById('predConf').textContent = (mv * 100).toFixed(1) + '% впевненість';
  state.classes.forEach((cls, i) => {
    const bar = document.getElementById('bar_' + cls.id);
    const pct = document.getElementById('pct_' + cls.id);
    if (bar) {
      bar.style.width = (probs[i] * 100).toFixed(1) + '%';
      bar.style.background = i === mi ? 'var(--accent3)' : 'var(--accent)';
    }
    if (pct) pct.textContent = (probs[i] * 100).toFixed(1) + '%';
  });
}