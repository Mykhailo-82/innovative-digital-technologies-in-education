function initStage3() {}

function log(msg, type = '') {
  const box = document.getElementById('trainLog');
  const d = document.createElement('div');
  d.className = 'log-entry ' + type;
  d.innerHTML = msg;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

async function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

async function buildDataset() {
  const xs = [],
        ys = [],
        n = state.classes.length;
  for (let ci = 0; ci < n; ci++) {
    for (const url of state.classes[ci].samples) {
      const img = await loadImage(url);
      const t = tf.tidy(() =>
        tf.browser.fromPixels(img, 3).resizeBilinear([64, 64]).toFloat().div(255)
      );
      xs.push(t);
      ys.push(ci);
    }
  }
  const xStack = tf.stack(xs);
  xs.forEach(t => t.dispose());
  const yTensor = tf.oneHot(tf.tensor1d(ys, 'int32'), n);
  return { xStack, yTensor, n: xs.length };
}

function buildModel() {
  const n = state.classes.length;
  const model = tf.sequential();
  let first = true;
  for (const layer of state.layers) {
    let l;
    if (layer.type === 'Conv2D') {
      const cfg = {
        filters: layer.params.filters || 32,
        kernelSize: layer.params.kernelSize || 3,
        activation: layer.params.activation || 'relu',
        padding: layer.params.padding || 'same'
      };
      if (first) {
        cfg.inputShape = [64, 64, 3];
        first = false;
      }
      l = tf.layers.conv2d(cfg);
    } else if (layer.type === 'MaxPool') {
      if (first) {
        log('<i class="fas fa-exclamation-triangle"></i> MaxPool не може бути першим', 'err');
        return null;
      }
      l = tf.layers.maxPooling2d({
        poolSize: [layer.params.poolSize || 2, layer.params.poolSize || 2]
      });
    } else if (layer.type === 'Flatten') {
      if (first) {
        log('<i class="fas fa-exclamation-triangle"></i> Flatten не може бути першим', 'err');
        return null;
      }
      l = tf.layers.flatten();
    } else if (layer.type === 'Dense') {
      const cfg = {
        units: layer.params.units || 64,
        activation: layer.params.activation || 'relu'
      };
      if (first) {
        cfg.inputShape = [64 * 64 * 3];
        first = false;
      }
      l = tf.layers.dense(cfg);
    } else if (layer.type === 'Activation') {
      if (first) {
        log('<i class="fas fa-exclamation-triangle"></i> Activation не може бути першим', 'err');
        return null;
      }
      l = tf.layers.activation({ activation: layer.params.activation || 'relu' });
    } else {
      continue;
    }
    model.add(l);
  }
  try {
    model.add(tf.layers.flatten());
  } catch (e) {}
  model.add(tf.layers.dense({ units: n, activation: 'softmax' }));
  return model;
}

async function startTraining() {
  if (state.classes.length < 2) {
    toast('<i class="fas fa-exclamation-triangle"></i> Потрібно мінімум 2 класи');
    return;
  }
  if (state.classes.reduce((a, c) => a + c.samples.length, 0) < 4) {
    toast('<i class="fas fa-exclamation-triangle"></i> Потрібно більше зразків');
    return;
  }

  document.getElementById('trainBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('goInferBtn').disabled = true;
  document.getElementById('trainLog').innerHTML = '';
  state.stopFlag = false;

  log('<i class="fas fa-spinner fa-pulse"></i> Збираємо дані...', 'info');
  const ds = await buildDataset().catch(e => {
    log('<i class="fas fa-times-circle"></i> Помилка: ' + e, 'err');
    return null;
  });
  if (!ds) return;

  log(`<i class="fas fa-check"></i> Датасет: ${ds.n} зразків, ${state.classes.length} класів`, 'ok');

  const model = buildModel();
  if (!model) {
    log('<i class="fas fa-times-circle"></i> Помилка моделі', 'err');
    document.getElementById('trainBtn').disabled = false;
    return;
  }

  const lr = parseFloat(document.getElementById('cfgLR').value) || 0.001;
  const opt = document.getElementById('cfgOpt').value;
  const optimizer =
    opt === 'adam'
      ? tf.train.adam(lr)
      : opt === 'sgd'
      ? tf.train.sgd(lr)
      : tf.train.rmsprop(lr);

  model.compile({ optimizer, loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  log('<i class="fas fa-check"></i> Модель скомпільована', 'ok');

  const epochs = parseInt(document.getElementById('cfgEpochs').value) || 20;
  const batch = parseInt(document.getElementById('cfgBatch').value) || 16;

  await model.fit(ds.xStack, ds.yTensor, {
    epochs,
    batchSize: batch,
    shuffle: true,
    validationSplit: Math.min(0.2, 4 / ds.n),
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (state.stopFlag) {
          model.stopTraining = true;
          return;
        }
        const pct = (((epoch + 1) / epochs) * 100).toFixed(0);
        document.getElementById('trainProgress').style.width = pct + '%';
        document.getElementById('epochLabel').textContent = `${epoch + 1}/${epochs}`;
        document.getElementById('lossLabel').textContent = logs.loss.toFixed(4);
        document.getElementById('accLabel').textContent =
          ((logs.acc || logs.accuracy || 0) * 100).toFixed(1) + '%';
        log(
          `<i class="fas fa-chart-line"></i> Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)} acc=${(
            (logs.acc || logs.accuracy || 0) * 100
          ).toFixed(1)}%`
        );
        await tf.nextFrame();
      }
    }
  });

  if (state.model) state.model.dispose();
  state.model = model;
  ds.xStack.dispose();
  ds.yTensor.dispose();

  log('<i class="fas fa-check-circle"></i> Навчання завершено!', 'ok');
  document.getElementById('trainBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('goInferBtn').disabled = false;
  toast('<i class="fas fa-trophy"></i> Модель навчена! Перейдіть до тесту');
}

function stopTraining() {
  state.stopFlag = true;
  document.getElementById('stopBtn').disabled = true;
  log('<i class="fas fa-stop"></i> Зупинено', 'err');
}