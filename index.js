import * as THREE from "three";
import { getBody, getMouseBall } from "./getBodies.js";
import RAPIER from 'rapier';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'jsm/objects/MarchingCubes.js';

const getViewportSize = () => {
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};
const { width: w, height: h } = getViewportSize();
const scene = new THREE.Scene();
scene.backgroundBlurriness = 0.05;
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(w, h, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const resizeRenderer = () => {
  const { width, height } = getViewportSize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(width, height, false);
};

window.addEventListener('resize', resizeRenderer);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeRenderer);
}

const environmentFiles = [
  'envs/belfast_sunset_puresky_2k.jpg',
  'envs/brother-claus-chapel-2K-bright.jpg',
  'envs/citrus_orchard_puresky_2k.jpg',
  'envs/creme-tile-corridor-2K.jpg',
  'envs/deer-stand-path-2K.jpg',
  'envs/foggy-field-path-2K.jpg',
  'envs/frosty-meadow-2K.jpg',
  'envs/frosty-meadow-sunset-2K.jpg',
  'envs/green-walk-2K.jpg',
  'envs/inside-riesenburg-cave-2K.jpg',
  'envs/mossy-cliff-hole-2-2K.jpg',
  'envs/old-farm-shed-2K.jpg',
  'envs/path-by-the-power-pole-2K.jpg',
  'envs/san_giuseppe_bridge_2k.jpg',
  'envs/studio_garden_4k.jpg',
  'envs/vysok-k-men-2-2K.jpg',
  'envs/vysok-k-men-2K.jpg',
  'envs/vysok-k-men-3-2K.jpg',
  'envs/wallerwarte-2K.jpg',
  'envs/wooden-hut-in-the-forest-2K.jpg'
];

const environmentItems = environmentFiles.map((path) => ({
  path,
  label: path
    .replace(/^envs\//, '')
    .replace(/\.jpg$/i, '')
    .replace(/_/g, ' ')
}));

const sceneSelect = document.getElementById('sceneSelect');
const menuToggle = document.getElementById('menuToggle');
const uiPanel = document.getElementById('uiPanel');
const introOverlay = document.getElementById('introOverlay');
const presetSelect = document.getElementById('presetSelect');
const meshCountInput = document.getElementById('meshCount');
const meshCountValue = document.getElementById('meshCountValue');
const sizeVarianceInput = document.getElementById('sizeVariance');
const sizeVarianceValue = document.getElementById('sizeVarianceValue');
const metaballSizeInput = document.getElementById('metaballSize');
const metaballSizeValue = document.getElementById('metaballSizeValue');
const glueStrengthInput = document.getElementById('glueStrength');
const glueStrengthValue = document.getElementById('glueStrengthValue');
const spreadRangeInput = document.getElementById('spreadRange');
const spreadRangeValue = document.getElementById('spreadRangeValue');
const speedVarianceInput = document.getElementById('speedVariance');
const speedVarianceValue = document.getElementById('speedVarianceValue');
const recenterForceInput = document.getElementById('recenterForce');
const recenterForceValue = document.getElementById('recenterForceValue');
const noiseStrengthInput = document.getElementById('noiseStrength');
const noiseStrengthValue = document.getElementById('noiseStrengthValue');
const swirlStrengthInput = document.getElementById('swirlStrength');
const swirlStrengthValue = document.getElementById('swirlStrengthValue');
environmentItems.forEach((item, index) => {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = item.label;
  sceneSelect.appendChild(option);
});

if (menuToggle && uiPanel) {
  const updateMenuState = (isOpen) => {
    uiPanel.hidden = !isOpen;
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.hidden = isOpen;
  };
  updateMenuState(false);
  menuToggle.addEventListener('click', () => {
    updateMenuState(true);
  });
  document.addEventListener('click', (evt) => {
    if (uiPanel.hidden) {
      return;
    }
    const target = evt.target;
    if (uiPanel.contains(target) || menuToggle.contains(target)) {
      return;
    }
    updateMenuState(false);
  });
}

if (introOverlay) {
  const closeIntro = () => {
    introOverlay.hidden = true;
  };
  introOverlay.addEventListener('click', (evt) => {
    if (evt.target === introOverlay) {
      closeIntro();
    }
  });
}

const textureLoader = new THREE.TextureLoader();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let currentEnvIndex = -1;
let currentBackground = null;
let currentEnvironment = null;

function applyEnvironment(path, onComplete) {
  textureLoader.load(path, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    if (currentBackground) {
      currentBackground.dispose();
    }
    if (currentEnvironment) {
      currentEnvironment.dispose();
    }

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.background = texture;
    scene.environment = envMap;

    currentBackground = texture;
    currentEnvironment = envMap;
    if (onComplete) {
      onComplete();
    }
  });
}

function pickRandomEnvironment() {
  if (environmentFiles.length <= 1) {
    return 0;
  }
  let nextIndex = currentEnvIndex;
  while (nextIndex === currentEnvIndex) {
    nextIndex = Math.floor(Math.random() * environmentFiles.length);
  }
  return nextIndex;
}

function setEnvironmentByIndex(index) {
  const item = environmentItems[index];
  if (!item) {
    return;
  }
  currentEnvIndex = index;
  if (sceneSelect) {
    sceneSelect.value = String(index);
  }
  applyEnvironment(item.path);
}

function setRandomEnvironment() {
  currentEnvIndex = pickRandomEnvironment();
  setEnvironmentByIndex(currentEnvIndex);
}

const defaultEnvPath = 'envs/vysok-k-men-2K.jpg';
const defaultEnvIndex = environmentFiles.indexOf(defaultEnvPath);
if (defaultEnvIndex >= 0) {
  setEnvironmentByIndex(defaultEnvIndex);
} else {
  setRandomEnvironment();
}

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;
ctrls.enableZoom = false;
ctrls.autoRotate = true;
ctrls.autoRotateSpeed = 1.5;

const clock = new THREE.Clock();
const cameraBaseQuat = new THREE.Quaternion();
const cameraOffsetQuat = new THREE.Quaternion();
const cameraOffsetEuler = new THREE.Euler(0, 0, 0, 'XYZ');
const degToRad = THREE.MathUtils.degToRad;

await RAPIER.init();
const gravity = { x: 0.0, y: 0, z: 0.0 };
const world = new RAPIER.World(gravity);

const presets = [
  
  {
    name: 'Default',
    meshCount: 31,
    sizeVariance: 0.37,
    metaballSize: 0.55,
    glueStrength: 94,
    spreadRange: 0.75,
    speedVariance: 0.14,
    recenterForce: 0.9,
    noiseStrength: 1.0,
    swirlStrength: 1.0
  },
  {
    name: 'Preset A',
    meshCount: 80,
    sizeVariance: 0,
    metaballSize: 0.44,
    glueStrength: 46,
    spreadRange: 1.3,
    speedVariance: 0.0,
    recenterForce: 0.5,
    noiseStrength: 0.0,
    swirlStrength: 1.0
  },
  {
    name: 'Preset B',
    meshCount: 40,
    sizeVariance: 0.35,
    metaballSize: 0.5,
    glueStrength: 95,
    spreadRange: 1.0,
    speedVariance: 0.3,
    recenterForce: 0.5,
    noiseStrength: 0.2,
    swirlStrength: 0.15
  },
  {
    name: 'Preset C',
    meshCount: 32,
    sizeVariance: 0.29,
    metaballSize: 0.37,
    glueStrength: 29,
    spreadRange: 0.5,
    speedVariance: 0.49,
    recenterForce: 0.5,
    noiseStrength: 0.85,
    swirlStrength: 0.15
  },
  {
    name: 'Preset D',
    meshCount: 31,
    sizeVariance: 0.37,
    metaballSize: 0.55,
    glueStrength: 40,
    spreadRange: 1.4,
    speedVariance: 0.13,
    recenterForce: 0.9,
    noiseStrength: 1.0,
    swirlStrength: 1.0
  },
  {
    name: 'Preset E',
    meshCount: 25,
    sizeVariance: 0.52,
    metaballSize: 0.55,
    glueStrength: 10,
    spreadRange: 0.9,
    speedVariance: 0.13,
    recenterForce: 0.9,
    noiseStrength: 1.0,
    swirlStrength: 1.0
  },
  
  {
    name: 'Preset F',
    meshCount: 80,
    sizeVariance: 0.22,
    metaballSize: 0.2,
    glueStrength: 11,
    spreadRange: 1.25,
    speedVariance: 0.4,
    recenterForce: 2,
    noiseStrength: 1,
    swirlStrength: 0
  },
  {
    name: 'Preset G',
    meshCount: 80,
    sizeVariance: 0.62,
    metaballSize: 0.67,
    glueStrength: 46,
    spreadRange: 1.3,
    speedVariance: 0.0,
    recenterForce: 2.0,
    noiseStrength: 1.0,
    swirlStrength: 0.48
  },
  {
    name: 'Preset H',
    meshCount: 65,
    sizeVariance: 0.56,
    metaballSize: 0.84,
    glueStrength: 28,
    spreadRange: 2.05,
    speedVariance: 0.35,
    recenterForce: 2.0,
    noiseStrength: 0.11,
    swirlStrength: 0.15
  }
];

if (presetSelect) {
  presets.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
}

const settings = { ...presets[0] };
let currentPresetIndex = 0;
const presetTransition = {
  isActive: false,
  startTime: 0,
  duration: 800,
  from: null,
  to: null
};
const sliderTweens = new Map();
const sliderTweenConfig = {
  meshCount: { key: 'meshCount', round: true },
  sizeVariance: { key: 'sizeVariance' },
  metaballSize: { key: 'metaballSize' },
  glueStrength: { key: 'glueStrength', round: true },
  spreadRange: { key: 'spreadRange' },
  speedVariance: { key: 'speedVariance' },
  recenterForce: { key: 'recenterForce' },
  noiseStrength: { key: 'noiseStrength' },
  swirlStrength: { key: 'swirlStrength' }
};

const maxBodies = 80;
const bodies = [];
for (let i = 0; i < maxBodies; i++) {
  const body = getBody(RAPIER, world, { size: 0.2 });
  bodies.push(body);
  // scene.add(body.mesh);
}

const mouseBall = getMouseBall(RAPIER, world);

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
    const baseStrength = settings.metaballSize; // size-y
    const subtract = settings.glueStrength; // lightness
    for (let i = 0; i < settings.meshCount; i += 1) {
      const b = bodies[i];
      const { x, y, z } = b.update(settings, clock.getElapsedTime());
      const normalizedSeed = (b.sizeSeed + 1) * 0.5;
      const curve = 1 + settings.sizeVariance * 6;
      const skewedSeed = Math.pow(normalizedSeed, curve);
      const variance = THREE.MathUtils.lerp(
        Math.max(0.1, 1 - settings.sizeVariance),
        1 + settings.sizeVariance * 4,
        skewedSeed
      );
      const strength = Math.max(0.05, baseStrength * variance);
      metaballs.addBall(x, y, z, strength, subtract, b.color);
    }
    metaballs.update();
  }
};
const blobGroup = new THREE.Group();
blobGroup.add(metaballs);
scene.add(blobGroup);

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
const blobDirection = new THREE.Vector3();
let blobDistanceOffset = 0;
const blobDistanceLimits = {
  min: -4,
  max: 4
};

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

renderer.domElement.addEventListener(
  'wheel',
  (evt) => {
    if (evt.ctrlKey) {
      return;
    }
    evt.preventDefault();
    blobDistanceOffset += evt.deltaY * 0.002;
    blobDistanceOffset = THREE.MathUtils.clamp(
      blobDistanceOffset,
      blobDistanceLimits.min,
      blobDistanceLimits.max
    );
  },
  { passive: false }
);

window.addEventListener('keydown', (evt) => {
  if (evt.repeat) {
    return;
  }
  if (evt.code === 'Space') {
    evt.preventDefault();
    setRandomEnvironment();
    return;
  }
  if (evt.code === 'KeyN') {
    evt.preventDefault();
    const nextIndex = (currentPresetIndex + 1) % presets.length;
    applyPreset(nextIndex);
  }
});

if (sceneSelect) {
  sceneSelect.addEventListener('change', (evt) => {
    const nextIndex = Number(evt.target.value);
    if (Number.isNaN(nextIndex)) {
      return;
    }
    setEnvironmentByIndex(nextIndex);
  });
}

if (presetSelect) {
  presetSelect.addEventListener('change', (evt) => {
    const nextIndex = Number(evt.target.value);
    if (Number.isNaN(nextIndex)) {
      return;
    }
    applyPreset(nextIndex);
  });
}

if (uiPanel) {
  uiPanel.addEventListener('click', (evt) => {
    const label = evt.target.closest('label');
    if (!label) {
      return;
    }
    const inputId = label.getAttribute('for');
    const config = inputId ? sliderTweenConfig[inputId] : null;
    if (!config) {
      return;
    }
    const preset = presets[currentPresetIndex];
    const targetValue = preset?.[config.key];
    if (typeof targetValue !== 'number') {
      return;
    }
    presetTransition.isActive = false;
    startSliderTween(config.key, targetValue);
  });
}

function formatControlValue(value) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return value;
  }
  const fixed = num.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
}

function setInputValue(input, value) {
  if (!input) {
    return;
  }
  input.value = String(formatControlValue(value));
}

function updateControlValue(el, value) {
  if (!el) {
    return;
  }
  el.textContent = formatControlValue(value);
}

function syncControls() {
  setInputValue(meshCountInput, settings.meshCount);
  setInputValue(sizeVarianceInput, settings.sizeVariance);
  setInputValue(metaballSizeInput, settings.metaballSize);
  setInputValue(glueStrengthInput, settings.glueStrength);
  setInputValue(spreadRangeInput, settings.spreadRange);
  setInputValue(speedVarianceInput, settings.speedVariance);
  setInputValue(recenterForceInput, settings.recenterForce);
  setInputValue(noiseStrengthInput, settings.noiseStrength);
  setInputValue(swirlStrengthInput, settings.swirlStrength);
  updateControlValue(meshCountValue, settings.meshCount);
  updateControlValue(sizeVarianceValue, settings.sizeVariance);
  updateControlValue(metaballSizeValue, settings.metaballSize);
  updateControlValue(glueStrengthValue, settings.glueStrength);
  updateControlValue(spreadRangeValue, settings.spreadRange);
  updateControlValue(speedVarianceValue, settings.speedVariance);
  updateControlValue(recenterForceValue, settings.recenterForce);
  updateControlValue(noiseStrengthValue, settings.noiseStrength);
  updateControlValue(swirlStrengthValue, settings.swirlStrength);
}

syncControls();
function setSettingsFromPreset(preset) {
  settings.meshCount = preset.meshCount;
  settings.sizeVariance = preset.sizeVariance;
  settings.metaballSize = preset.metaballSize;
  settings.glueStrength = preset.glueStrength;
  settings.spreadRange = preset.spreadRange;
  settings.speedVariance = preset.speedVariance;
  settings.recenterForce = preset.recenterForce;
  settings.noiseStrength = preset.noiseStrength;
  settings.swirlStrength = preset.swirlStrength;
}

function startPresetTransition(targetPreset) {
  presetTransition.isActive = true;
  presetTransition.startTime = performance.now();
  presetTransition.from = {
    meshCount: settings.meshCount,
    sizeVariance: settings.sizeVariance,
    metaballSize: settings.metaballSize,
    glueStrength: settings.glueStrength,
    spreadRange: settings.spreadRange,
    speedVariance: settings.speedVariance,
    recenterForce: settings.recenterForce,
    noiseStrength: settings.noiseStrength,
    swirlStrength: settings.swirlStrength
  };
  presetTransition.to = { ...targetPreset };
}

function startSliderTween(key, target) {
  sliderTweens.set(key, {
    from: settings[key],
    to: target,
    startTime: performance.now(),
    duration: 400
  });
}

function updateSliderTweens() {
  if (sliderTweens.size === 0) {
    return;
  }
  const now = performance.now();
  for (const [key, tween] of sliderTweens.entries()) {
    const rawT = Math.min(Math.max((now - tween.startTime) / tween.duration, 0), 1);
    const t = rawT * (2 - rawT);
    const nextValue = THREE.MathUtils.lerp(tween.from, tween.to, t);
    const config = sliderTweenConfig[key];
    settings[key] = config?.round ? Math.round(nextValue) : nextValue;
    if (rawT >= 1) {
      settings[key] = config?.round ? Math.round(tween.to) : tween.to;
      sliderTweens.delete(key);
    }
  }
  syncControls();
}

function applyPreset(index, { immediate = false } = {}) {
  const preset = presets[index];
  if (!preset) {
    return;
  }
  currentPresetIndex = index;
  if (immediate) {
    presetTransition.isActive = false;
    setSettingsFromPreset(preset);
    syncControls();
  } else {
    startPresetTransition(preset);
  }
  if (presetSelect) {
    presetSelect.value = String(currentPresetIndex);
  }
}

applyPreset(currentPresetIndex, { immediate: true });

if (meshCountInput) {
  meshCountInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.meshCount = Math.max(1, Math.min(maxBodies, nextValue));
    updateControlValue(meshCountValue, settings.meshCount);
  });
}

if (sizeVarianceInput) {
  sizeVarianceInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.sizeVariance = Number.isNaN(nextValue) ? settings.sizeVariance : nextValue;
      updateControlValue(sizeVarianceValue, settings.sizeVariance);
  });
}

if (metaballSizeInput) {
  metaballSizeInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.metaballSize = Number.isNaN(nextValue) ? settings.metaballSize : nextValue;
      updateControlValue(metaballSizeValue, settings.metaballSize);
  });
}

if (glueStrengthInput) {
  glueStrengthInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.glueStrength = Number.isNaN(nextValue) ? settings.glueStrength : nextValue;
    updateControlValue(glueStrengthValue, settings.glueStrength);
  });
}

if (spreadRangeInput) {
  spreadRangeInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.spreadRange = Number.isNaN(nextValue) ? settings.spreadRange : nextValue;
      updateControlValue(spreadRangeValue, settings.spreadRange);
  });
}

if (speedVarianceInput) {
  speedVarianceInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.speedVariance = Number.isNaN(nextValue) ? settings.speedVariance : nextValue;
      updateControlValue(speedVarianceValue, settings.speedVariance);
  });
}

if (recenterForceInput) {
  recenterForceInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.recenterForce = Number.isNaN(nextValue) ? settings.recenterForce : nextValue;
      updateControlValue(recenterForceValue, settings.recenterForce);
  });
}

if (noiseStrengthInput) {
  noiseStrengthInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.noiseStrength = Number.isNaN(nextValue) ? settings.noiseStrength : nextValue;
      updateControlValue(noiseStrengthValue, settings.noiseStrength);
  });
}

if (swirlStrengthInput) {
  swirlStrengthInput.addEventListener('input', (evt) => {
    const nextValue = Number(evt.target.value);
    settings.swirlStrength = Number.isNaN(nextValue) ? settings.swirlStrength : nextValue;
      updateControlValue(swirlStrengthValue, settings.swirlStrength);
  });
}

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

function updatePresetTransition() {
  if (!presetTransition.isActive || !presetTransition.from || !presetTransition.to) {
    return;
  }
  const elapsed = performance.now() - presetTransition.startTime;
  const rawT = Math.min(Math.max(elapsed / presetTransition.duration, 0), 1);
  const t = rawT * (2 - rawT);
  const from = presetTransition.from;
  const to = presetTransition.to;
  settings.meshCount = Math.round(THREE.MathUtils.lerp(from.meshCount, to.meshCount, t));
  settings.sizeVariance = THREE.MathUtils.lerp(from.sizeVariance, to.sizeVariance, t);
  settings.metaballSize = THREE.MathUtils.lerp(from.metaballSize, to.metaballSize, t);
  settings.glueStrength = THREE.MathUtils.lerp(from.glueStrength, to.glueStrength, t);
  settings.spreadRange = THREE.MathUtils.lerp(from.spreadRange, to.spreadRange, t);
  settings.speedVariance = THREE.MathUtils.lerp(from.speedVariance, to.speedVariance, t);
  settings.recenterForce = THREE.MathUtils.lerp(from.recenterForce, to.recenterForce, t);
  settings.noiseStrength = THREE.MathUtils.lerp(from.noiseStrength, to.noiseStrength, t);
  settings.swirlStrength = THREE.MathUtils.lerp(from.swirlStrength, to.swirlStrength, t);
  syncControls();
  if (rawT >= 1) {
    presetTransition.isActive = false;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const pitch =
    degToRad(-8) +
    degToRad(0.6) * Math.cos((t * Math.PI * 2) / 5) +
    degToRad(0.9) * Math.cos((t * Math.PI * 2) / 3)+
    degToRad(0.5) * Math.cos((t * Math.PI * 2) / 7)+
    degToRad(0.35) * Math.cos((t * Math.PI * 2) / 1);
  const roll =
  
     degToRad(0.6) * Math.cos((t * Math.PI * 2) / 5) +
    degToRad(0.35) * Math.cos((t * Math.PI * 2) / 11);
  world.step();
  handleRaycast();
  mouseBall.update(mousePos);
  ctrls.update();
  cameraBaseQuat.copy(camera.quaternion);
  cameraOffsetEuler.set(pitch, 0, roll);
  cameraOffsetQuat.setFromEuler(cameraOffsetEuler);
  camera.quaternion.copy(cameraBaseQuat).multiply(cameraOffsetQuat);
  camera.getWorldDirection(blobDirection);
  blobGroup.position.copy(blobDirection.multiplyScalar(blobDistanceOffset));
  updatePresetTransition();
  updateSliderTweens();
  // renderDebugView();
  bodies.forEach(b => b.update(settings, t));
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



