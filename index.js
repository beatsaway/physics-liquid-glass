import * as THREE from "three";
import { getBody, getMouseBall } from "./getBodies.js";
import RAPIER from 'rapier';
import { UltraHDRLoader } from 'jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'jsm/objects/MarchingCubes.js';
import getBgSphere from "./getBgSphere.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.backgroundBlurriness = 0.05;
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;
ctrls.enableZoom = false;

const hdrLoader = new UltraHDRLoader();
hdrLoader.load('envs/studio_garden_4k.jpg', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr;
  scene.environment = hdr;
});

await RAPIER.init();
const gravity = { x: 0.0, y: 0, z: 0.0 };
const world = new RAPIER.World(gravity);

const numBodies = 40;
const bodies = [];
for (let i = 0; i < numBodies; i++) {
  const body = getBody(RAPIER, world);
  bodies.push(body);
  // scene.add(body.mesh);
}

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);

// METABALLS
const metaMat = new THREE.MeshPhysicalMaterial({
  vertexColors: true,
  transmission: 1.0,
  thickness: 1.0,
  roughness: 0.0,
  metalness: 0.0,
  transparent: true, // debug
  // opacity: 0.8,
});
const metaballs = new MarchingCubes(
  96, // resolution,
  metaMat,
  true, // enableUVs
  true, // enableColors
  90000 // max poly count
);
metaballs.scale.setScalar(5);
metaballs.isolation = 1000;
metaballs.userData = {
  update() {
    metaballs.reset();
    const strength = 0.5; // size-y
    const subtract = 10; // lightness
    bodies.forEach((b) => {
      const { x, y, z } = b.update();
      metaballs.addBall(x, y, z, strength, subtract, b.color);
    });
    metaballs.update();
  }
};
scene.add(metaballs);

const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff);
hemiLight.intensity = 0.2;
scene.add(hemiLight);

// const bgSphere = getBgSphere({ hue: 0.565 });
// scene.add(bgSphere);

const pointsGeo = new THREE.BufferGeometry();
const pointsMat = new THREE.PointsMaterial({ 
  size: 0.05, 
  vertexColors: true
});
const points = new THREE.Points(pointsGeo, pointsMat);
scene.add(points);

function renderDebugView() {
  const { vertices, colors } = world.debugRender();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

// Mouse Interactivity
const raycaster = new THREE.Raycaster();
const pointerPos = new THREE.Vector2(0, 0);
const mousePos = new THREE.Vector3(0, 0, 0);

const mousePlaneGeo = new THREE.PlaneGeometry(48, 48, 48, 48);
const mousePlaneMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x00ff00,
  transparent: true,
  opacity: 0.0
});
const mousePlane = new THREE.Mesh(mousePlaneGeo, mousePlaneMat);
mousePlane.position.set(0, 0, 0.2);
scene.add(mousePlane);


window.addEventListener('mousemove', (evt) => {
  pointerPos.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1
  );
});

let cameraDirection = new THREE.Vector3();
function handleRaycast() {
  // orient the mouse plane to the camera
  camera.getWorldDirection(cameraDirection);
  cameraDirection.multiplyScalar(-1);
  mousePlane.lookAt(cameraDirection);

  raycaster.setFromCamera(pointerPos, camera);
  const intersects = raycaster.intersectObjects(
    [mousePlane],
    false
  );
  if (intersects.length > 0) {
    mousePos.copy(intersects[0].point);
  }
}

function animate() {
  requestAnimationFrame(animate);
  world.step();
  handleRaycast();
  mouseBall.update(mousePos);
  ctrls.update();
  // renderDebugView();
  bodies.forEach(b => b.update());
  metaballs.userData.update();
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);



