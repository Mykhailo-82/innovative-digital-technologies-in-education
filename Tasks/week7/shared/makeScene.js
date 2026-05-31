/* global THREE */

export function makeScene() {
  const scene = new THREE.Scene();

  const ambient = new THREE.AmbientLight(0x1a3a5a, 2.5);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0x00d4ff, 3, 40);
  sunLight.position.set(3, 5, 5);
  scene.add(sunLight);

  const fill = new THREE.PointLight(0xff6b35, 1.5, 30);
  fill.position.set(-5, -3, 2);
  scene.add(fill);

  const rim = new THREE.PointLight(0xa259ff, 1.2, 25);
  rim.position.set(0, -4, -5);
  scene.add(rim);

  return { scene, sunLight };
}