import * as THREE from "three";
import { MindARThree } from "mindar-face-three";

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");
  const arContainer = document.getElementById("ar-container");
  const vrMode = document.getElementById("vrMode");
  const arMode = document.getElementById("arMode");
  const backButton = document.getElementById("backButton");

  let mindarThree;

  const start = async (isVR = false) => {
    mindarThree = new MindARThree({
      container: arContainer,
      uiScanning: "yes",
      uiLoading: "yes",
    });

    const { scene, camera, renderer } = mindarThree;

    renderer.sortObjects = true;
    renderer.autoClear = false;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.5));
    const directLight = new THREE.DirectionalLight(0xffffff, 1);
    directLight.position.set(0, 0, 1);
    scene.add(directLight);

    const occluderMesh = mindarThree.addFaceMesh();
    occluderMesh.material = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      side: THREE.DoubleSide
    });
    occluderMesh.renderOrder = 0;
    scene.add(occluderMesh);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('./../../resources/textures/face/face.png');
    
    const faceMask = mindarThree.addFaceMesh();
    faceMask.material.map = texture;
    faceMask.material.transparent = true;
    faceMask.material.needsUpdate = true;
    faceMask.renderOrder = 1;
    scene.add(faceMask);

    if (isVR) {
      const dotGeometry = new THREE.SphereGeometry(0.01, 32, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.5
      });

      for (let i = 0; i < 468; i++) {
        const anchor = mindarThree.addAnchor(i);
        const mesh = new THREE.Mesh(dotGeometry, dotMaterial);
        anchor.group.add(mesh);
      }
    }

    await mindarThree.start();

    camera.near = 0.01;
    camera.updateProjectionMatrix();

    if (isVR) {
      const video = document.querySelector("video");
      if (video) {
        video.style.display = "none";
      }
    }

    renderer.setAnimationLoop(() => {
      renderer.clear();
      renderer.render(scene, camera);
    });
  };

  arMode.addEventListener("click", async () => {
    menu.style.display = "none";
    arContainer.style.display = "block";
    await start(false);
  });

  vrMode.addEventListener("click", async () => {
    menu.style.display = "none";
    arContainer.style.display = "block";
    await start(true);
  });

  backButton.addEventListener("click", () => {
    location.reload();
  });
});