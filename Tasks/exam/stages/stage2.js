let flatContainer = null;
let htmlCards = [];
let htmlMode = false;

function onEnterAR() {
  if (arSession) {
    arSession.end().catch(() => {});
    arSession = null;
  }
  if (arRenderer) {
    arRenderer.setAnimationLoop(null);
  }
  xrMode = null;
  arPlaced = false;
  htmlMode = false;

  document.getElementById('arStartScreen').style.display = 'flex';
  document.getElementById('arHUD').classList.remove('visible');
  document.getElementById('arToolbar').classList.remove('visible');
  document.getElementById('arPlaceHint').classList.remove('visible');
  document.getElementById('arCanvas').style.display = 'none';
  closeCardActionPanel();

  if (flatContainer) {
    flatContainer.remove();
    flatContainer = null;
    htmlCards = [];
  }

  arCards = [];
  selectedCardIdx = null;
  editingCardIdx = null;
}

function initThreeScene() {
  const canvas = document.getElementById('arCanvas');
  const stage2 = document.getElementById('stage2');
  const w = stage2.clientWidth || window.innerWidth;
  const h = stage2.clientHeight || (window.innerHeight - 53);

  arRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  arRenderer.setPixelRatio(window.devicePixelRatio);
  arRenderer.setSize(w, h);
  arRenderer.xr.enabled = true;
  arRenderer.setClearColor(0x000000, 0);

  arScene = new THREE.Scene();
  arCamera = new THREE.PerspectiveCamera(70, w / h, 0.01, 100);

  arSceneGroup = new THREE.Group();
  arScene.add(arSceneGroup);

  arScene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 0.5);
  dir.position.set(1, 2, 1);
  arScene.add(dir);
  arScene.add(new THREE.PointLight(0x7c6aff, 0.4, 3));

  const rGeo = new THREE.RingGeometry(0.04, 0.055, 32);
  rGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  arReticleGroup = new THREE.Group();
  arReticleGroup.add(
    new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({ color: 0x6affd4, side: THREE.DoubleSide }))
  );
  const dGeo = new THREE.CircleGeometry(0.012, 16);
  dGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  arReticleGroup.add(
    new THREE.Mesh(dGeo, new THREE.MeshBasicMaterial({ color: 0x6affd4 }))
  );
  arReticleGroup.visible = false;
  arScene.add(arReticleGroup);

  const grid = new THREE.GridHelper(4, 24, 0x7c6aff, 0x2a2a3f);
  grid.position.y = -0.01;
  grid.name = 'fallbackGrid';
  grid.visible = false;
  arScene.add(grid);

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
  canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mouseup', onCanvasMouseUp);

  window.addEventListener('resize', () => {
    if (!arRenderer) return;
    const ww = stage2.clientWidth || window.innerWidth;
    const hh = stage2.clientHeight || (window.innerHeight - 53);
    arRenderer.setSize(ww, hh);
    arCamera.aspect = ww / hh;
    arCamera.updateProjectionMatrix();
  });
}

function onCanvasTouchStart(e) {
  if (xrMode === 'ar' && !arPlaced) {
    e.preventDefault();
    return;
  }
  const t = e.touches[0];
  const rect = arRenderer.domElement.getBoundingClientRect();
  const x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
  const idx = getCardAt(x, y);
  longPressIdx = idx;
  if (idx >= 0) {
    longPressTimer = setTimeout(() => {
      if (longPressIdx === idx) showCardActionPanel(idx, t.clientX, t.clientY);
    }, 500);
  }
}

function onCanvasTouchEnd(e) {
  e.preventDefault();
  clearTimeout(longPressTimer);
  if (xrMode === 'ar' && !arPlaced) {
    placeARScene();
    return;
  }
  if (e.changedTouches.length === 0) return;
  const t = e.changedTouches[0];
  const rect = arRenderer.domElement.getBoundingClientRect();
  const x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
  const idx = getCardAt(x, y);
  if (idx >= 0 && idx === longPressIdx) openARPopup(idx);
}

function onCanvasMouseDown(e) {
  const rect = arRenderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const idx = getCardAt(x, y);
  longPressIdx = idx;
  if (idx >= 0) {
    longPressTimer = setTimeout(() => {
      if (longPressIdx === idx) showCardActionPanel(idx, e.clientX, e.clientY);
    }, 500);
  }
}

function onCanvasMouseUp(e) {
  clearTimeout(longPressTimer);
}

function onCanvasClick(e) {
  e.preventDefault();
  if (xrMode === 'ar' && !arPlaced) {
    placeARScene();
  }
}

function getCardAt(nx, ny) {
  if (!arCards.length) return -1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x: nx, y: ny }, arCamera);
  const hits = raycaster.intersectObjects(arCards.map(c => c.plane));
  if (hits.length > 0) return hits[0].object.userData.cardIndex;
  return -1;
}

function showCardActionPanel(idx, clientX, clientY) {
  const card = htmlMode ? htmlCards[idx] : arCards[idx];
  if (!card || card.fixed) return;
  selectedCardIdx = idx;
  const panel = document.getElementById('cardActionPanel');
  document.getElementById('cardActionTitle').textContent = card.type;
  const layerIdx = getLayerIdxForCard(idx);
  document.getElementById('cardMoveLeftBtn').disabled = (layerIdx <= 0);
  document.getElementById('cardMoveRightBtn').disabled = (layerIdx >= state.layers.length - 1);
  const stage2 = document.getElementById('stage2');
  const r = stage2.getBoundingClientRect();
  let px = clientX - r.left + 12,
      py = clientY - r.top - 20;
  px = Math.min(px, r.width - 180);
  py = Math.min(py, r.height - 220);
  py = Math.max(py, 10);
  panel.style.left = px + 'px';
  panel.style.top = py + 'px';
  panel.classList.add('open');
}

function closeCardActionPanel() {
  document.getElementById('cardActionPanel').classList.remove('open');
  selectedCardIdx = null;
}

function getLayerIdxForCard(cardIdx) {
  return cardIdx - 1;
}

function moveCardLeft() {
  const li = getLayerIdxForCard(selectedCardIdx);
  if (li <= 0) return;
  [state.layers[li - 1], state.layers[li]] = [state.layers[li], state.layers[li - 1]];
  closeCardActionPanel();
  buildARCards();
  toast('<i class="fas fa-arrow-left"></i> Переміщено');
}

function moveCardRight() {
  const li = getLayerIdxForCard(selectedCardIdx);
  if (li >= state.layers.length - 1) return;
  [state.layers[li], state.layers[li + 1]] = [state.layers[li + 1], state.layers[li]];
  closeCardActionPanel();
  buildARCards();
  toast('<i class="fas fa-arrow-right"></i> Переміщено');
}

function deleteSelectedCard() {
  const li = getLayerIdxForCard(selectedCardIdx);
  if (li < 0 || li >= state.layers.length) return;
  state.layers.splice(li, 1);
  closeCardActionPanel();
  buildARCards();
  toast('<i class="fas fa-trash-alt"></i> Видалено');
}

async function startARMode() {
  if (!navigator.xr) {
    toast('<i class="fas fa-exclamation-triangle"></i> WebXR не підтримується');
    return;
  }
  const ok = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
  if (!ok) {
    toast('<i class="fas fa-exclamation-triangle"></i> AR не підтримується. Спробуйте 2D перегляд.');
    return;
  }

  wasFullscreenBeforeXR = !!document.fullscreenElement;

  try {
    arSession = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local', 'hit-test'],
      optionalFeatures: ['dom-overlay', 'local-floor'],
      domOverlay: { root: document.getElementById('stage2') }
    });
  } catch (e) {
    wasFullscreenBeforeXR = false;
    toast('<i class="fas fa-times-circle"></i> Помилка AR: ' + e.message);
    return;
  }

  if (!arRenderer) initThreeScene();
  arRenderer.xr.setReferenceSpaceType('local');
  await arRenderer.xr.setSession(arSession);
  arRefSpace = await arSession.requestReferenceSpace('local').catch(() => null);
  const viewerSpace = await arSession.requestReferenceSpace('viewer');
  arHitTestSource = await arSession.requestHitTestSource({ space: viewerSpace }).catch(() => null);

  xrMode = 'ar';
  htmlMode = false;
  arPlaced = false;
  arSceneGroup.visible = false;
  arReticleGroup.visible = true;
  arScene.background = null;
  arRenderer.setClearColor(0x000000, 0);
  arScene.getObjectByName('fallbackGrid').visible = false;
  arSession.addEventListener('end', onARSessionEnd);

  document.getElementById('arStartScreen').style.display = 'none';
  document.getElementById('arHUD').classList.add('visible');
  document.getElementById('arToolbar').classList.add('visible');
  document.getElementById('arPlaceHint').classList.add('visible');
  document.querySelector('#arPlaceHint .hint-text').textContent = 'Скануємо поверхню…';

  document.getElementById('arCanvas').style.display = 'block';
  if (flatContainer) {
    flatContainer.remove();
    flatContainer = null;
    htmlCards = [];
  }

  if (arCards.length === 0) buildARCards();
  arRenderer.setAnimationLoop(arRenderLoopAR);
}

function onARSessionEnd() {
  arSession = null;
  xrMode = null;
  if (arHitTestSource) {
    arHitTestSource.cancel();
    arHitTestSource = null;
  }
  arReticleGroup.visible = false;
  arSceneGroup.visible = false;
  arPlaced = false;
  document.getElementById('arStartScreen').style.display = 'flex';
  document.getElementById('arHUD').classList.remove('visible');
  document.getElementById('arToolbar').classList.remove('visible');
  document.getElementById('arPlaceHint').classList.remove('visible');
  arRenderer.setAnimationLoop(null);

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  setTimeout(() => {
    document.getElementById('fsBtn').innerHTML = document.fullscreenElement
      ? '<i class="fas fa-compress"></i>'
      : '<i class="fas fa-expand"></i>';
  }, 350);

  requestAnimationFrame(() => { arRenderer.render(arScene, arCamera); });
}

function arRenderLoopAR(timestamp, frame) {
  if (!frame) return;
  if (arHitTestSource) {
    const hits = frame.getHitTestResults(arHitTestSource);
    if (hits.length > 0) {
      const pose = hits[0].getPose(arRefSpace);
      if (pose) {
        arReticleGroup.visible = !arPlaced;
        arReticleGroup.matrix.fromArray(pose.transform.matrix);
        arReticleGroup.matrix.decompose(
          arReticleGroup.position,
          arReticleGroup.quaternion,
          arReticleGroup.scale
        );
        if (!arPlaced)
          document.querySelector('#arPlaceHint .hint-text').textContent = 'Торкніться, щоб розмістити';
      }
    } else {
      if (!arPlaced) arReticleGroup.visible = false;
    }
  }
  arRenderer.render(arScene, arCamera);
}

function placeARScene() {
  if (!arPlaced && arReticleGroup.position.lengthSq() > 0) {
    arSceneGroup.position.copy(arReticleGroup.position);
    arSceneGroup.rotation.set(0, 0, 0);
    arSceneGroup.visible = true;
    arPlaced = true;
    arReticleGroup.visible = false;
    document.getElementById('arPlaceHint').classList.remove('visible');
    toast('<i class="fas fa-check"></i> Схему розміщено');
  }
}

function resetARPlacement() {
  if (xrMode === 'ar') {
    arPlaced = false;
    arSceneGroup.visible = false;
    arReticleGroup.visible = true;
    document.getElementById('arPlaceHint').classList.add('visible');
    document.querySelector('#arPlaceHint .hint-text').textContent = 'Скануємо поверхню…';
    toast('<i class="fas fa-map-pin"></i> Оберіть нове місце');
  }
}

// 2D mode
function startFlatMode() {
  htmlMode = true;
  xrMode = 'flat';
  arPlaced = true;

  document.getElementById('arCanvas').style.display = 'none';
  if (arSession) {
    arSession.end().catch(() => {});
    arSession = null;
  }
  if (arRenderer) arRenderer.setAnimationLoop(null);
  if (flatContainer) {
    flatContainer.remove();
    flatContainer = null;
    htmlCards = [];
  }

  flatContainer = document.createElement('div');
  flatContainer.id = 'flatScheme';
  flatContainer.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    overflow: auto; padding: 20px; box-sizing: border-box;
    display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
    gap: 20px; background: var(--bg);
  `;
  document.getElementById('stage2').appendChild(flatContainer);

  buildFlatHTML();

  document.getElementById('arStartScreen').style.display = 'none';
  document.getElementById('arHUD').classList.add('visible');
  document.getElementById('arToolbar').classList.add('visible');
  document.getElementById('arPlaceHint').classList.remove('visible');
}

function buildFlatHTML() {
  if (!flatContainer) return;
  flatContainer.innerHTML = '';
  htmlCards = [];

  const chain = [
    { type: 'Input', params: {}, fixed: true },
    ...state.layers.map(l => ({ type: l.type, params: { ...l.params }, fixed: false, id: l.id })),
    { type: 'Output', params: {}, fixed: true }
  ];

  chain.forEach((item, i) => {
    const meta = LAYER_META[item.type];
    const cardEl = document.createElement('div');
    cardEl.className = 'flat-card';
    cardEl.style.cssText = `
      background: ${item.fixed ? 'var(--surface2)' : 'var(--surface)'};
      border: 2px solid #${meta.color.toString(16).padStart(6, '0')};
      border-radius: 12px; padding: 12px 16px; min-width: 140px;
      text-align: center; cursor: pointer;
      transition: transform 0.2s;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    `;
    cardEl.innerHTML = `
      <i class="fas ${meta.faIcon}" style="font-size: 1.8rem; color: #${meta.color.toString(16).padStart(6, '0')};"></i>
      <div style="font-weight: bold; color: var(--text);">${meta.label}</div>
      <div style="font-size: 0.7rem; color: var(--text2);">${getParamStr(item.type, item.params)}</div>
    `;

    const cardData = {
      el: cardEl,
      type: item.type,
      params: item.params,
      fixed: item.fixed,
      layerId: item.id,
      index: i
    };
    htmlCards.push(cardData);

    cardEl.addEventListener('click', (e) => {
      if (htmlMode) openARPopup(i);
    });
    cardEl.addEventListener('mousedown', (e) => {
      if (!htmlMode) return;
      longPressIdx = i;
      longPressTimer = setTimeout(() => {
        if (longPressIdx === i) showCardActionPanel(i, e.clientX, e.clientY);
      }, 500);
    });
    cardEl.addEventListener('mouseup', () => clearTimeout(longPressTimer));
    cardEl.addEventListener('touchstart', (e) => {
      if (!htmlMode) return;
      e.preventDefault();
      const t = e.touches[0];
      longPressIdx = i;
      longPressTimer = setTimeout(() => {
        if (longPressIdx === i) showCardActionPanel(i, t.clientX, t.clientY);
      }, 500);
    });
    cardEl.addEventListener('touchend', (e) => {
      if (!htmlMode) return;
      e.preventDefault();
      clearTimeout(longPressTimer);
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      if (longPressIdx === i) openARPopup(i);
    });

    flatContainer.appendChild(cardEl);
  });

  updateHUD();
}

function buildARCards() {
  if (htmlMode) {
    buildFlatHTML();
  } else {
    arCards.forEach(c => arSceneGroup.remove(c.group));
    arCards = [];
    const chain = [
      { type: 'Input', params: {}, fixed: true },
      ...state.layers.map(l => ({ type: l.type, params: { ...l.params }, fixed: false, id: l.id })),
      { type: 'Output', params: {}, fixed: true }
    ];
    chain.forEach((item, i) => {
      const pos = getCardPosition(i, chain.length);
      const card = createCard(item.type, item.params, i, chain.length, item.fixed, pos);
      arSceneGroup.add(card.group);
      arCards.push({
        ...card,
        type: item.type,
        params: item.params,
        index: i,
        fixed: item.fixed,
        layerId: item.id
      });
    });
    drawARConnections();
    updateHUD();
  }
}

// AR
function createCard(type, params, index, total, fixed, pos) {
  const meta = LAYER_META[type];
  const group = new THREE.Group();
  group.position.set(pos.x, pos.y, pos.z);

  const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const mat = new THREE.MeshStandardMaterial({
    color: fixed ? 0x0d1a12 : 0x0d0d1a,
    transparent: true,
    opacity: 0.93,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(geo, mat);
  group.add(plane);

  const edges = new THREE.EdgesGeometry(geo);
  const borderMat = new THREE.LineBasicMaterial({
    color: meta.color,
    transparent: true,
    opacity: 0.75
  });
  const border = new THREE.LineSegments(edges, borderMat);
  border.position.z = 0.001;
  group.add(border);

  const tex = makeCardTexture(type, params, meta);
  const labelGeo = new THREE.PlaneGeometry(CARD_W * 0.9, CARD_H * 0.88);
  const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.z = 0.002;
  group.add(labelMesh);

  plane.userData = { cardIndex: index, isCard: true };
  return { group, plane, border, labelMesh, labelMat, tex };
}

function makeCardTexture(type, params, meta) {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = Math.round(size * 0.6);
  const ctx = cvs.getContext('2d');
  const ch = cvs.height;
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  ctx.font = `900 ${h2(ch * 0.28)}px "Font Awesome 6 Free"`;
  ctx.fillStyle = '#' + meta.color.toString(16).padStart(6, '0');
  ctx.textAlign = 'center';
  ctx.fillText(meta.icon, size / 2, ch * 0.38);

  ctx.font = `bold ${h2(ch * 0.19)}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = '#e8e8f0';
  ctx.fillText(meta.label, size / 2, ch * 0.6);

  ctx.font = `${h2(ch * 0.14)}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = 'rgba(136, 136, 170, 0.9)';
  ctx.fillText(getParamStr(type, params), size / 2, ch * 0.82);

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

function getParamStr(type, params) {
  if (type === 'Conv2D')
    return `${params.filters || 32}f k${params.kernelSize || 3} ${params.activation || 'relu'}`;
  if (type === 'MaxPool') return `pool ${params.poolSize || 2}×${params.poolSize || 2}`;
  if (type === 'Dense') return `${params.units || 64} ${params.activation || 'relu'}`;
  if (type === 'Activation') return params.activation || 'relu';
  if (type === 'Input') return '256×256×3';
  if (type === 'Output') return `${state.classes.length} cls softmax`;
  return '';
}

function drawARConnections() {
  arSceneGroup.children
    .filter(c => c.userData && c.userData.isConnector)
    .forEach(c => arSceneGroup.remove(c));
  for (let i = 0; i < arCards.length - 1; i++) {
    const a = arCards[i],
          b = arCards[i + 1];
    if (!a || !b) continue;
    const posA = a.group.position.clone();
    const posB = b.group.position.clone();
    const sameRow = Math.floor(i / COLS) === Math.floor((i + 1) / COLS);
    if (sameRow) {
      posA.x += CARD_W / 2;
      posB.x -= CARD_W / 2;
    } else {
      posA.y -= CARD_H / 2;
      posB.y += CARD_H / 2;
    }
    const geo = new THREE.BufferGeometry().setFromPoints([posA, posB]);
    const mat = new THREE.LineBasicMaterial({ color: 0x7c6aff, opacity: 0.45, transparent: true });
    const line = new THREE.Line(geo, mat);
    line.userData = { isConnector: true };
    arSceneGroup.add(line);
  }
}

function getCardPosition(index, total) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const totalRows = Math.ceil(total / COLS);
  const rowCount = Math.min(COLS, total - row * COLS);
  const rowOffset = ((COLS - rowCount) * (CARD_W + CARD_GAP)) / 2;
  const x = rowOffset + col * (CARD_W + CARD_GAP) - ((COLS - 1) * (CARD_W + CARD_GAP)) / 2;
  const y = (totalRows - 1 - row) * (CARD_H + CARD_GAP) + 0.08;
  return { x, y, z: 0 };
}

function openARPopup(idx) {
  if (idx === undefined || idx === null) return;
  editingCardIdx = idx;
  const card = htmlMode ? htmlCards[idx] : arCards[idx];
  if (!card || card.fixed) {
    closeCardActionPanel();
    return;
  }
  const meta = LAYER_META[card.type];
  document.getElementById('arPopupIcon').innerHTML = `<i class="fas ${meta.faIcon}"></i>`;
  document.getElementById('arPopupTitle').textContent = card.type;
  const body = document.getElementById('arPopupBody');
  body.innerHTML = '';
  const p = card.params;
  if (card.type === 'Conv2D') {
    body.innerHTML = `
      <div class="field"><label>Фільтри</label><input type="number" id="pFilters" value="${p.filters || 32}" min="1" max="512"></div>
      <div class="field"><label>Kernel size</label><input type="number" id="pKernel" value="${p.kernelSize || 3}" min="1" max="7"></div>
      <div class="field"><label>Padding</label><select id="pPadding">
        <option value="same" ${(p.padding || 'same') === 'same' ? 'selected' : ''}>same</option>
        <option value="valid" ${p.padding === 'valid' ? 'selected' : ''}>valid</option>
      </select></div>
      <div class="field"><label>Activation</label><select id="pAct">${actOpts(p.activation)}</select></div>`;
  } else if (card.type === 'MaxPool') {
    body.innerHTML = `<div class="field"><label>Pool size</label><input type="number" id="pPool" value="${p.poolSize || 2}" min="1" max="4"></div>`;
  } else if (card.type === 'Dense') {
    body.innerHTML = `
      <div class="field"><label>Units</label><input type="number" id="pUnits" value="${p.units || 64}" min="1" max="2048"></div>
      <div class="field"><label>Activation</label><select id="pAct">${actOpts(p.activation)}</select></div>`;
  } else if (card.type === 'Activation') {
    body.innerHTML = `<div class="field"><label>Функція</label><select id="pActOnly">${actOpts(p.activation)}</select></div>`;
  } else if (card.type === 'Flatten') {
    body.innerHTML = '<p style="font-size:.8rem;color:var(--text2)">Flatten не має параметрів.</p>';
  }
  closeCardActionPanel();
  document.getElementById('arPopup').classList.add('open');
}

function actOpts(cur = 'relu') {
  return ['relu', 'sigmoid', 'tanh', 'softmax', 'elu', 'selu']
    .map(a => `<option value="${a}" ${a === cur ? 'selected' : ''}>${a}</option>`)
    .join('');
}

function saveARLayerConfig() {
  if (editingCardIdx === null) {
    closeARPopup();
    return;
  }
  const card = htmlMode ? htmlCards[editingCardIdx] : arCards[editingCardIdx];
  const p = card.params;
  if (card.type === 'Conv2D') {
    p.filters = +document.getElementById('pFilters').value;
    p.kernelSize = +document.getElementById('pKernel').value;
    p.padding = document.getElementById('pPadding').value;
    p.activation = document.getElementById('pAct').value;
  } else if (card.type === 'MaxPool') {
    p.poolSize = +document.getElementById('pPool').value;
  } else if (card.type === 'Dense') {
    p.units = +document.getElementById('pUnits').value;
    p.activation = document.getElementById('pAct').value;
  } else if (card.type === 'Activation') {
    p.activation = document.getElementById('pActOnly').value;
  }
  syncARToState();

  if (!htmlMode) {
    card.tex.dispose();
    const newTex = makeCardTexture(card.type, p, LAYER_META[card.type]);
    card.labelMat.map = newTex;
    card.labelMat.needsUpdate = true;
    card.tex = newTex;
  } else {
    const cardEl = htmlCards[editingCardIdx].el;
    const paramDiv = cardEl.querySelector('div:last-child');
    if (paramDiv) {
      paramDiv.textContent = getParamStr(card.type, p);
    }
  }

  closeARPopup();
  toast('<i class="fas fa-check"></i> Збережено');
}

function closeARPopup() {
  document.getElementById('arPopup').classList.remove('open');
  editingCardIdx = null;
}

function addARLayer(type) {
  const l = { id: Date.now(), type, params: {} };
  if (type === 'Conv2D') l.params = { filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' };
  else if (type === 'MaxPool') l.params = { poolSize: 2 };
  else if (type === 'Dense') l.params = { units: 64, activation: 'relu' };
  else if (type === 'Activation') l.params = { activation: 'relu' };
  state.layers.push(l);
  buildARCards();
  toast('<i class="fas fa-plus"></i> ' + type + ' додано');
}

function undoARLayer() {
  if (!state.layers.length) {
    toast('<i class="fas fa-exclamation-triangle"></i> Нічого скасовувати');
    return;
  }
  state.layers.pop();
  buildARCards();
}

function clearARLayers() {
  state.layers = [];
  buildARCards();
}

function syncARToState() {
  const cards = htmlMode ? htmlCards : arCards;
  state.layers = cards
    .filter(c => !c.fixed)
    .map((c, i) => ({ id: c.layerId || Date.now() + i, type: c.type, params: { ...c.params } }));
}

function updateHUD() {
  const chain = ['Input', ...state.layers.map(l => l.type), 'Output'];
  document.getElementById('hudChain').innerHTML = chain
    .map((t, i) => {
      const fixed = t === 'Input' || t === 'Output';
      return `${i > 0 ? '<span class="hud-arrow"><i class="fas fa-arrow-right"></i></span>' : ''}
              <span class="hud-chip ${fixed ? 'fixed' : ''}">${t}</span>`;
    })
    .join('');
}

document.getElementById('arModeBtn').addEventListener('click', startARMode);
document.getElementById('fallbackModeBtn').addEventListener('click', startFlatMode);