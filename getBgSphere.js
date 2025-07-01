import * as THREE from "three"

export default function getBgSphere({ hue = 0.565 }) {
    const bgSphereGeo = new THREE.IcosahedronGeometry(8, 3);
    const bgSphereMat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        vertexColors: true,
        fog: false
    });
    // create an array of colors per vertex
    const bgSphereColors = [];
    const len = bgSphereGeo.attributes.position.count;
    for (let i = 0; i < len; i++) {
        const hue = 0.565;
        const z = -bgSphereGeo.attributes.position.getZ(i);
        const { r, g, b } = new THREE.Color().setHSL(hue, 1, Math.pow(z * 0.08, 3));
        bgSphereColors.push(r, g, b);
    }
    bgSphereGeo.setAttribute('color', new THREE.Float32BufferAttribute(bgSphereColors, 3));
    const bgSphere = new THREE.Mesh(bgSphereGeo, bgSphereMat);

    return bgSphere;
}