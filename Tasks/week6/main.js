let activeNodes = {};

AFRAME.registerComponent('marker-node', {
  init: function () {
    this.el.addEventListener('markerFound', () => {
      activeNodes[this.el.id] = this.el;
    });
    this.el.addEventListener('markerLost', () => {
      delete activeNodes[this.el.id];
    });
  }
});

AFRAME.registerComponent('polygon-solver', {
  init: function () {
    this.statsPanel = document.querySelector('#stats');
    if (!this.statsPanel) {
      this.statsPanel = document.createElement('div');
      this.statsPanel.id = 'stats';
      this.statsPanel.className = 'ar-stats-panel';
      document.body.appendChild(this.statsPanel);
    }

    this.linePool = [];
    this.textPool = [];

    this.p1 = new THREE.Vector3();
    this.p2 = new THREE.Vector3();
    this.v1 = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.cross = new THREE.Vector3();

    let material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    let geometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 12);

    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    for (let i = 0; i < 15; i++) {
      let wrapper = document.createElement('a-entity');
      this.el.sceneEl.appendChild(wrapper);

      let mesh = new THREE.Mesh(geometry, material);
      wrapper.object3D.add(mesh);

      wrapper.setAttribute('visible', 'false');
      this.linePool.push({ wrapper: wrapper, mesh: mesh });
    }

    for (let i = 0; i < 10; i++) {
      let txt = document.createElement('a-text');
      txt.setAttribute('align', 'center');
      txt.setAttribute('color', 'yellow');
      txt.setAttribute('scale', '0.7 0.7 0.7');
      txt.setAttribute('font', '../assets/times-msdf.json');
      txt.setAttribute('negate', 'false');
      txt.setAttribute('visible', 'false');
      this.el.sceneEl.appendChild(txt);
      this.textPool.push(txt);
    }
  },

  tick: function () {
    let ids = Object.keys(activeNodes).sort();
    let nodes = ids.map(id => activeNodes[id]);

    this.linePool.forEach(l => l.wrapper.setAttribute('visible', 'false'));
    this.textPool.forEach(t => t.setAttribute('visible', 'false'));

    if (ids.length < 2) {
      if (this.statsPanel) {
        this.statsPanel.innerHTML = `<div class="ar-stats-panel--waiting">Очікування маркерів (A, B, C, D)...</div>`;
      }
      return;
    }

    let lineIdx = 0;
    
    let statsText = `
      <div class="ar-stats-section">
        <div class="ar-stats-title">Активні маркери</div>
        <div class="ar-stats-value">${ids.join(', ')}</div>
      </div>
    `;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (lineIdx < this.linePool.length) {
          this.drawConnector(nodes[i], nodes[j], this.linePool[lineIdx]);
          lineIdx++;
        }
      }
    }

    if (ids.length === 4 && ids.join('') === 'ABCD') {
      let pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3(), pD = new THREE.Vector3();
      activeNodes['A'].object3D.getWorldPosition(pA);
      activeNodes['B'].object3D.getWorldPosition(pB);
      activeNodes['C'].object3D.getWorldPosition(pC);
      activeNodes['D'].object3D.getWorldPosition(pD);
      let p = pA.distanceTo(pB) + pB.distanceTo(pC) + pC.distanceTo(pD) + pD.distanceTo(pA);
      
      statsText += `
        <div class="ar-stats-section">
          <div class="ar-stats-title">Геометрія фігури</div>
          <div class="ar-stats-row">
            <span class="ar-stats-tag">ABCD</span>
            <span class="ar-stats-number">${p.toFixed(2)} м (Периметр)</span>
          </div>
        </div>
      `;
    }

    // Секція розрахунку трикутників
    if (ids.length >= 3) {
      let textIdx = 0;
      let triangleRows = '';

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          for (let k = j + 1; k < ids.length; k++) {
            if (textIdx < this.textPool.length) {
              let area = this.calculateArea(nodes[i], nodes[j], nodes[k], this.textPool[textIdx]);
              let triangleName = ids[i] + ids[j] + ids[k];
              
              triangleRows += `
                <div class="ar-stats-row">
                  <span class="ar-stats-tag">${triangleName}</span>
                  <span class="ar-stats-number">${area.toFixed(4)} м²</span>
                </div>
              `;
              textIdx++;
            }
          }
        }
      }

      statsText += `
        <div class="ar-stats-section">
          <div class="ar-stats-title">Площі трикутників</div>
          ${triangleRows}
        </div>
      `;
    }

    if (this.statsPanel) this.statsPanel.innerHTML = statsText;
  },

  drawConnector: function (n1, n2, poolObj) {
    n1.object3D.getWorldPosition(this.p1);
    n2.object3D.getWorldPosition(this.p2);

    let dist = this.p1.distanceTo(this.p2);
    poolObj.wrapper.object3D.position.copy(this.p1);
    poolObj.wrapper.object3D.lookAt(this.p2);

    poolObj.mesh.scale.set(1, 1, dist);
    poolObj.wrapper.setAttribute('visible', 'true');
  },

  calculateArea: function (n1, n2, n3, textEl) {
    let tp1 = new THREE.Vector3(), tp2 = new THREE.Vector3(), tp3 = new THREE.Vector3();
    n1.object3D.getWorldPosition(tp1);
    n2.object3D.getWorldPosition(tp2);
    n3.object3D.getWorldPosition(tp3);

    this.v1.subVectors(tp2, tp1);
    this.v2.subVectors(tp3, tp1);
    this.cross.crossVectors(this.v1, this.v2);
    let area = this.cross.length() * 0.5;

    let center = new THREE.Vector3().add(tp1).add(tp2).add(tp3).divideScalar(3);
    textEl.object3D.position.copy(center);
    textEl.setAttribute('value', area.toFixed(2));
    textEl.setAttribute('visible', 'true');

    return area;
  }
});