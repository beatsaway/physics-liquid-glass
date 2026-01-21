import * as THREE from "three";

const sceneMiddle = new THREE.Vector3(0, 0, 0);
const metaOffset = new THREE.Vector3(0.5, 0.5, 0.5);
// const colorPallete = [0x780000, 0xc1121f, 0xfdf0d5, 0x003049, 0x669bbc];
const colorPallete = [0x0067b1, 0x4e99ce, 0x9bcbeb, 0x55d7e2, 0xffffff, 0x9ca9b2, 0x4e6676, 0xf69230, 0xf5d81f];
function getBody(RAPIER, world, options = {}) {
  const baseSize = options.size ?? 0.2;
  const size = baseSize;
  const range = options.spreadRange ?? 6;
  const basePullStrength = options.pullStrength ?? 0.5;
  const density = 0.5; // size * 1.0;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;
  // physics
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
  world.createCollider(colliderDesc, rigid);

  let color = colorPallete[Math.floor(Math.random() * colorPallete.length)];
  const geometry = new THREE.IcosahedronGeometry(size, 1);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    flatShading: true,
    metalness: 1,
    roughness: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // const wireMat = new THREE.MeshBasicMaterial({
  //   color: 0xffffff,
  //   wireframe: true
  // });
  // const wireMesh = new THREE.Mesh(geometry, wireMat);
  // wireMesh.scale.setScalar(1.01);
  // mesh.add(wireMesh);

  const sizeSeed = Math.random() * 2 - 1;
  const speedSeed = Math.random() * 2 - 1;
  const noiseSeed = Math.random() * 100;
  const swirlSeed = Math.random() * 2 - 1;
  function update(settings = {}, time = 0) {
    const spreadRange = settings.spreadRange ?? 1;
    const speedVariance = settings.speedVariance ?? 0;
    const pullStrength = settings.recenterForce ?? basePullStrength;
    const dampingStrength = settings.recenterDamping ?? 0.2;
    const deadZone = settings.recenterDeadZone ?? 0.05;
    const noiseStrength = settings.noiseStrength ?? 0;
    const swirlStrength = settings.swirlStrength ?? 0;
    const boundaryRadius = settings.boundaryRadius ?? 5;
    const boundaryStrength = settings.boundaryStrength ?? 0.6;
    rigid.resetForces(true);
    let { x, y, z } = rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    const speedFactor = 1 + speedVariance * speedSeed;
    const offset = pos.clone().sub(sceneMiddle);
    const distance = offset.length();
    if (distance > deadZone) {
      const dir = offset.multiplyScalar(1 / distance);
      const distanceFactor = Math.min(distance, 2);
      rigid.addForce(dir.multiplyScalar(-pullStrength * speedFactor * distanceFactor), true);
    }
    if (distance > boundaryRadius) {
      const boundaryDir = pos.clone().sub(sceneMiddle).normalize();
      const boundaryFactor = Math.min(distance - boundaryRadius, 2);
      rigid.addForce(boundaryDir.multiplyScalar(-boundaryStrength * boundaryFactor), true);
    }
    if (swirlStrength > 0) {
      const swirlScale = swirlStrength * (0.5 + 0.5 * Math.abs(swirlSeed));
      const swirlForce = new THREE.Vector3(-pos.y, pos.x, 0).normalize();
      rigid.addForce(
        {
          x: swirlForce.x * swirlScale,
          y: swirlForce.y * swirlScale,
          z: swirlForce.z * swirlScale
        },
        true
      );
    }
    if (noiseStrength > 0) {
      const t = time * 0.6 + noiseSeed;
      const noiseForce = {
        x: Math.sin(t + sizeSeed * 3.1) * noiseStrength,
        y: Math.sin(t * 0.9 + speedSeed * 2.7) * noiseStrength,
        z: Math.cos(t * 1.1 + sizeSeed * 4.2) * noiseStrength
      };
      rigid.addForce(noiseForce, true);
    }
    const vel = rigid.linvel();
    rigid.addForce(
      {
        x: -vel.x * dampingStrength,
        y: -vel.y * dampingStrength,
        z: -vel.z * dampingStrength
      },
      true
    );
    pos.multiplyScalar(0.1 * spreadRange).add(metaOffset);
    return pos;
  }
  return { mesh, rigid, update, color, size, sizeSeed, speedSeed };
}

function getMouseBall(RAPIER, world) {
  const mouseSize = 0.25;
  const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
  });
  const mouseLight = new THREE.PointLight(0xffffff, 1);
  const mouseMesh = new THREE.Mesh(geometry, material);
  // mouseMesh.add(mouseLight);
  // RIGID BODY
  let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
  let mouseRigid = world.createRigidBody(bodyDesc);
  let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 6.0);
  world.createCollider(dynamicCollider, mouseRigid);
  function update(mousePos) {
    mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y, z: mousePos.z });
    let { x, y, z } = mouseRigid.translation();
    mouseMesh.position.set(x, y, z);
  }
  return { mesh: mouseMesh, update };
}

export { getBody, getMouseBall };