/* global THREE */
import { SHELL_COLORS, TILT_AXES, PHYSICS } from './constants.js';

let _scene  = null;
let _camera = null;

export function initAtomBuilder({ scene, camera }) {
  _scene  = scene;
  _camera = camera;
}

export let nucGroup       = null;
export let electronPivots = [];
export let electronMeshes = [];
export let orbitSpeeds    = [];
export let baseAngles     = [];

let atomObjects = [];

export function clearAtom() {
  atomObjects.forEach(obj => {
    _scene.remove(obj);
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  });
  atomObjects    = [];
  electronPivots = [];
  electronMeshes = [];
  orbitSpeeds    = [];
  baseAngles     = [];
  nucGroup       = null;
}

export function buildAtom(elem) {
  clearAtom();

  const { shells } = elem;
  const nShells    = shells.length;
  const total      = elem.protons + elem.neutrons;
  const P          = PHYSICS;

  const R_N   = P.nucleonRadius;
  const shown = Math.min(total, P.nucleonCap);
  const NUC_R = R_N * 1.4 * Math.cbrt(shown);

  const INNER = NUC_R * P.gapMult + R_N * 1.5;
  const OUTER = Math.max(INNER * (1 + P.orbitOuter * (nShells - 1)), INNER + 0.5);

  const orbitR = shells.map((_, i) => {
    if (nShells === 1) return INNER;
    const t = i / (nShells - 1);
    const k = P.orbitSpread;
    return INNER + (OUTER - INNER) * (Math.exp(t * k) - 1) / (Math.exp(k) - 1);
  });

  _camera.position.z = Math.max(orbitR[nShells - 1] * P.cameraFitMult, P.cameraMinZ);

  const ng = new THREE.Group();
  _scene.add(ng);
  atomObjects.push(ng);
  nucGroup = ng;

  _buildNucleus(ng, elem, shown, R_N, NUC_R);
  shells.forEach((eCount, si) => _buildShell(si, eCount, orbitR[si]));
}

function _buildNucleus(ng, elem, shown, R_N, NUC_R) {
  const pMat = new THREE.MeshPhongMaterial({ color: 0xee2233, emissive: 0x661122, shininess: 90 });
  const nMat = new THREE.MeshPhongMaterial({ color: 0x7799bb, emissive: 0x223344, shininess: 70 });
  const geo  = new THREE.SphereGeometry(R_N, 14, 10);

  const types = [
    ...Array(elem.protons).fill(true),
    ...Array(elem.neutrons).fill(false),
  ];
  const shuffled = types
    .map((v, i) => ({ v, key: (i * 0.6180339887) % 1 }))
    .sort((a, b) => a.key - b.key)
    .map(x => x.v);

  const maxRadius = NUC_R - R_N;
  const layerStep = R_N * 1.5;
  const numLayers = Math.max(1, Math.ceil(maxRadius / layerStep));

  const layerCapacities = [];
  let totalWeight = 0;
  for (let l = 1; l <= numLayers; l++) {
    layerCapacities.push(l * l);
    totalWeight += l * l;
  }

  const layerCounts = layerCapacities.map(w => Math.round((w / totalWeight) * shown));
  let allocated = layerCounts.reduce((a, b) => a + b, 0);
  while (allocated !== shown) {
    if (allocated < shown) {
      layerCounts[layerCounts.length - 1]++; allocated++;
    } else {
      for (let i = layerCounts.length - 1; i >= 0; i--) {
        if (layerCounts[i] > 1) { layerCounts[i]--; allocated--; break; }
      }
    }
  }

  let globalIdx = 0;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let l = 0; l < numLayers; l++) {
    const pointsInLayer = layerCounts[l];
    if (pointsInLayer <= 0) continue;
    const r = numLayers === 1 ? 0 : (l / (numLayers - 1)) * maxRadius;

    for (let i = 0; i < pointsInLayer; i++) {
      if (globalIdx >= shown) break;
      const mesh = new THREE.Mesh(geo, shuffled[globalIdx] ? pMat : nMat);
      globalIdx++;

      let x, y, z;
      if (pointsInLayer === 1) {
        x = 0; y = 0; z = 0;
      } else {
        const minZ = -1 + 1 / pointsInLayer;
        const maxZ =  1 - 1 / pointsInLayer;
        const zPct = minZ + (i / (pointsInLayer - 1)) * (maxZ - minZ);
        const radiusAtZ = Math.sqrt(1 - zPct * zPct);
        const theta = (2 * Math.PI * i) / goldenRatio;
        x = Math.cos(theta) * radiusAtZ * r;
        y = Math.sin(theta) * radiusAtZ * r;
        z = zPct * r;
      }

      mesh.position.set(x, y, z);
      ng.add(mesh);
    }
  }

  const P = PHYSICS;
  const gGeo = new THREE.SphereGeometry(NUC_R * P.nucGlowMult, 20, 20);
  const gMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff, transparent: true, opacity: P.nucGlowOpacity,
  });
  ng.add(new THREE.Mesh(gGeo, gMat));
}

function _buildShell(si, eCount, radius) {
  const color = SHELL_COLORS[si % SHELL_COLORS.length];
  const tilt  = TILT_AXES[si % TILT_AXES.length];
  const P     = PHYSICS;

  const group = new THREE.Group();
  group.rotation.x = tilt.rx;
  group.rotation.z = tilt.rz;
  _scene.add(group);
  atomObjects.push(group);

  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const rMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
  group.add(new THREE.Line(rGeo, rMat));

  const segH = ([16, 12, 8, 8, 6, 6, 6][si]) ?? 6;
  const eGeo = new THREE.SphereGeometry(P.electronRadius, 14, segH);
  const hGeo = new THREE.SphereGeometry(P.electronRadius * P.electronHalo, 9, segH);

  for (let ei = 0; ei < eCount; ei++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (ei / eCount) * Math.PI * 2;
    group.add(pivot);
    electronPivots.push(pivot);

    const eMat  = new THREE.MeshPhongMaterial({
      color, emissive: color, emissiveIntensity: 0.7, shininess: 120,
    });
    const eMesh = new THREE.Mesh(eGeo, eMat);
    eMesh.position.x = radius;

    const hMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: P.electronHaloOp,
    });
    eMesh.add(new THREE.Mesh(hGeo, hMat));

    pivot.add(eMesh);
    electronMeshes.push(eMesh);

    orbitSpeeds.push(2.2 / (si + 1));
    baseAngles.push((ei / eCount) * Math.PI * 2);
  }
}