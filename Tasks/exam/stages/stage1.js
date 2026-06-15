function addClass() {
  state.classes.push({
    id: Date.now(),
    name: 'Клас ' + (state.classes.length + 1),
    samples: []
  });
  renderClasses();
}

function renderClasses() {
  const list = document.getElementById('classList');
  list.innerHTML = '';
  state.classes.forEach(cls => {
    const card = document.createElement('div');
    card.className = 'class-card';

    const head = document.createElement('div');
    head.className = 'class-card-head';

    const inp = document.createElement('input');
    inp.className = 'class-name-input';
    inp.value = cls.name;
    inp.onchange = () => { cls.name = inp.value; };

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn danger';
    delBtn.innerHTML = '<i class="fas fa-times"></i>';
    delBtn.onclick = () => {
      state.classes = state.classes.filter(c => c.id !== cls.id);
      renderClasses();
    };

    head.append(inp, delBtn);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:9px;margin-bottom:8px;flex-wrap:wrap;';

    const cnt = document.createElement('span');
    cnt.className = 'sample-count';
    cnt.id = 'cnt' + cls.id;
    cnt.textContent = cls.samples.length + ' зразків';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-photo-btn';
    addBtn.innerHTML = '<i class="fas fa-camera"></i> Додати фото';
    addBtn.onclick = () => openCameraOverlay(cls.id);

    row.append(cnt, addBtn);

    const grid = document.createElement('div');
    grid.className = 'samples-grid';
    grid.id = 'grid' + cls.id;
    renderGrid(cls, grid);

    card.append(head, row, grid);
    list.appendChild(card);
  });
  updateTotal();
}

function renderGrid(cls, gridEl) {
  const grid = gridEl || document.getElementById('grid' + cls.id);
  if (!grid) return;
  grid.innerHTML = '';
  cls.samples.forEach((url, idx) => {
    const item = document.createElement('div');
    item.className = 'sample-item';

    const img = document.createElement('img');
    img.src = url;
    img.className = 'sample-thumb';

    const del = document.createElement('button');
    del.className = 'sample-del';
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.onclick = () => {
      cls.samples.splice(idx, 1);
      renderGrid(cls);
      updateCnt(cls);
      updateTotal();
    };

    item.append(img, del);
    grid.appendChild(item);
  });
}

function updateCnt(cls) {
  const el = document.getElementById('cnt' + cls.id);
  if (el) el.textContent = cls.samples.length + ' зразків';
}

function updateTotal() {
  const total = state.classes.reduce((a, c) => a + c.samples.length, 0);
  document.getElementById('totalSamples').textContent =
    `Зразків: ${total} (${state.classes.length} класів)`;
}

async function openCameraOverlay(classId) {
  activePhotoClassId = classId;
  const cls = state.classes.find(c => c.id === classId);
  document.getElementById('camOverlayTitle').textContent = cls ? cls.name : 'Фото';
  try {
    cameraOverlayStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }
    });
    document.getElementById('camOverlayVideo').srcObject = cameraOverlayStream;
  } catch (e) {
    toast('<i class="fas fa-times-circle"></i> Камера: ' + e.message);
    return;
  }
  document.getElementById('cameraOverlay').classList.add('open');
}

function closeCameraOverlay() {
  document.getElementById('cameraOverlay').classList.remove('open');
  if (cameraOverlayStream) {
    cameraOverlayStream.getTracks().forEach(t => t.stop());
    cameraOverlayStream = null;
  }
  activePhotoClassId = null;
}

function takePhoto() {
  const cls = state.classes.find(c => c.id === activePhotoClassId);
  if (!cls) return;
  const video = document.getElementById('camOverlayVideo');
  if (!video || !video.videoWidth) {
    toast('<i class="fas fa-exclamation-circle"></i> Камера не готова');
    return;
  }
  const canvas = document.getElementById('camSnapCanvas');
  const ctx = canvas.getContext('2d');
  const vw = video.videoWidth,
        vh = video.videoHeight;
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2,
        sy = (vh - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, 256, 256);
  cls.samples.push(canvas.toDataURL('image/jpeg', 0.88));
  renderGrid(cls);
  updateCnt(cls);
  updateTotal();
  const overlay = document.getElementById('cameraOverlay');
  overlay.style.background = 'rgba(255,255,255,.25)';
  setTimeout(() => { overlay.style.background = '#000'; }, 120);
}

addClass();