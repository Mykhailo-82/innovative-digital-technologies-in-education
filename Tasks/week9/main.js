import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function createYouTube(videoUrl) {
  const id = videoUrl.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
  const iframe = document.createElement("iframe");

  iframe.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0`;
  iframe.width = "960";
  iframe.height = "540";
  iframe.allow = "autoplay; fullscreen";
  iframe.style.border = "none";

  return {
    element: iframe,
    play: () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo" }),
        "*"
      );
    },
    pause: () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo" }),
        "*"
      );
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("startButton");
  const container = document.getElementById("mind-ar-container");
  const screen = document.getElementById("start-screen");

  button.addEventListener("click", async () => {
    screen.style.display = "none";

    const mindarThree = new MindARThree({
      container: container,
      imageTargetSrc: "./../../resources/Markers/VideoAndWorld/VideoAndWorld.mind",
      maxTrack: 2,
      uiScanning: "yes",
      uiLoading: "yes",
    });

    const { scene, cssScene, camera, renderer, cssRenderer } = mindarThree;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    const anchor1 = mindarThree.addCSSAnchor(0);
    const youtube = createYouTube("https://www.youtube.com/watch?v=rcd_SQZDlnk");

    const obj1 = new CSS3DObject(youtube.element);
    
    obj1.scale.set(1, 1, 1); 
    
    anchor1.group.add(obj1);

    anchor1.onTargetFound = () => youtube.play();
    anchor1.onTargetLost = () => youtube.pause();

    const anchor2 = mindarThree.addAnchor(1);
    
    let guitarMesh = null; 

    const loader = new GLTFLoader();
    loader.load(
      "../../resources/Models/guitar.glb",
      (gltf) => {
        guitarMesh = gltf.scene;
        guitarMesh.scale.set(1.0, 1.0, 1.0); 
        guitarMesh.position.set(0, 0, 0);
        anchor2.group.add(guitarMesh);
      },
      undefined,
      (error) => console.error("Помилка завантаження моделі:", error)
    );

    await mindarThree.start();

    renderer.setAnimationLoop(() => {
      if (guitarMesh && guitarMesh.rotation) {
        guitarMesh.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    });
  });
});