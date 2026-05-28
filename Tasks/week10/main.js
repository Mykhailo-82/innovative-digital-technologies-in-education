let model;
let video;
let canvas;
let ctx;
let statsPanel;

const FINGERS = {
  THUMB:  { mcp: 1, tip: 4,  label: "Великий" },
  INDEX:  { mcp: 5, tip: 8,  label: "Вказівний" },
  MIDDLE: { mcp: 9, tip: 12, label: "Середній" },
  RING:   { mcp: 13, tip: 16, label: "Безіменний" },
  PINKY:  { mcp: 17, tip: 20, label: "Мізинець" }
};

const INTER_DIGIT_PAIRS = [
  { f1: "THUMB",  f2: "INDEX",  tag: "T-I" },
  { f1: "INDEX",  f2: "MIDDLE", tag: "I-M" },
  { f1: "MIDDLE", f2: "RING",   tag: "M-R" },
  { f1: "RING",   f2: "PINKY",  tag: "R-P" }
];

async function setupCamera() {
  video = document.getElementById('webcam');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false
  });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(video);
  });
}

function getFingerVector(landmarks, finger) {
  const pMCP = landmarks[finger.mcp];
  const pTIP = landmarks[finger.tip];
  return {
    x: pTIP[0] - pMCP[0],
    y: pTIP[1] - pMCP[1],
    z: pTIP[2] - pMCP[2]
  };
}

function vectorLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function calculateAngle(v1, v2) {
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const len1 = vectorLength(v1);
  const len2 = vectorLength(v2);
  if (len1 === 0 || len2 === 0) return 0;
  let cosTheta = dotProduct / (len1 * len2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta)); 
  return Math.acos(cosTheta) * (180 / Math.PI);
}

async function mainLoop() {
  const predictions = await model.estimateHands(video);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
    });

    const vectors = {};
    const lengths = {};
    
    for (const [key, config] of Object.entries(FINGERS)) {
      vectors[key] = getFingerVector(landmarks, config);
      lengths[key] = vectorLength(vectors[key]);
    }

    let statsHTML = `
      <div class="ar-stats-section">
        <div class="ar-stats-title">Довжина пальців (px)</div>
    `;
    for (const [key, config] of Object.entries(FINGERS)) {
      statsHTML += `
        <div class="ar-stats-row">
          <span class="ar-stats-tag">${config.label}</span>
          <span class="ar-stats-number">${lengths[key].toFixed(1)}</span>
        </div>
      `;
    }
    statsHTML += `</div><div class="ar-stats-section"><div class="ar-stats-title">Кути між пальцями</div>`;

    INTER_DIGIT_PAIRS.forEach(pair => {
      const angle = calculateAngle(vectors[pair.f1], vectors[pair.f2]);
      const labelPair = `${FINGERS[pair.f1].label} - ${FINGERS[pair.f2].label}`;
      
      statsHTML += `
        <div class="ar-stats-row">
          <span class="ar-stats-tag">${pair.tag}</span>
          <span class="ar-stats-value" style="font-size:12px;">${labelPair}</span>
          <span class="ar-stats-number" style="color:#facc15;">${angle.toFixed(1)}°</span>
        </div>
      `;

      const tip1 = landmarks[FINGERS[pair.f1].tip];
      const tip2 = landmarks[FINGERS[pair.f2].tip];

      const midX = (tip1[0] + tip2[0]) / 2;
      const midY = (tip1[1] + tip2[1]) / 2;

      ctx.beginPath();
      ctx.moveTo(tip1[0], tip1[1]);
      ctx.lineTo(tip2[0], tip2[1]);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(midX, midY);
      ctx.scale(-1, 1);

      const text = `${angle.toFixed(1)}°`;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(15, 18, 25, 0.8)";
      ctx.fillRect(-(textWidth / 2) - 4, -9, textWidth + 8, 18);
      
      ctx.fillStyle = "#facc15";
      ctx.fillText(text, 0, 4);

      ctx.restore();
    });
    
    ctx.restore();
    
    statsHTML += `</div>`;
    statsPanel.innerHTML = statsHTML;

  } else {
    statsPanel.innerHTML = `<div class="ar-stats-panel--waiting">Помістіть руку в кадр камери...</div>`;
  }

  requestAnimationFrame(mainLoop);
}

document.addEventListener("DOMContentLoaded", async () => {
  statsPanel = document.getElementById('stats');
  canvas = document.getElementById('output-canvas');
  ctx = canvas.getContext('2d');

  try {
    await setupCamera();
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    statsPanel.innerHTML = `<div class="ar-stats-panel--waiting">Завантаження ваг нейромережі Handpose...</div>`;
    model = await handpose.load();
    statsPanel.innerHTML = `<div class="ar-stats-panel--waiting">Все готово. Помістіть руку в кадр.</div>`;
    
    mainLoop();
  } catch (e) {
    statsPanel.innerHTML = `<div class="ar-stats-panel--waiting" style="color:#ef4444;">Помилка доступу до камери або WebGL.</div>`;
    console.error(e);
  }
});