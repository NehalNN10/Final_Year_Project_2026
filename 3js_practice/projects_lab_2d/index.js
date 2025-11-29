import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const w = window.innerWidth;
const h = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 1;
const far = 200;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 20, 0);

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = true; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = 0;

const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x447c5a, side: THREE.DoubleSide });
const baseWallMat = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });
const baseWoodMat = new THREE.MeshBasicMaterial({ color: 0x462416, side: THREE.DoubleSide });
const baseGlassMat = new THREE.MeshBasicMaterial({ color: 0xffffffff, side: THREE.DoubleSide });
const basePillarMat = new THREE.MeshBasicMaterial({ color: 0xd1b100, side: THREE.DoubleSide })
const baseBenchMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
const baseBuggyMat = new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.DoubleSide })

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

function createFloor(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    scene.add(mesh);
    return mesh
}

function createObject(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    mesh.position.y = 0.1
    scene.add(mesh);
    return mesh
}

function createMarker(z, x, color) {
    const markerGeometry = new THREE.CircleGeometry(0.1, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.z = z
    marker.position.x = x
    marker.position.y = 0.11
    scene.add(marker);
    return marker
}

// Floor
const floor1 = createFloor(14, 11.5, 3, 2, floorMaterial)
const floor2 = createFloor(18, 6, -5.75, 0, floorMaterial)

// Wall

const wallThickness = 0.35;

const wallx1 = createFloor(wallThickness, 6.5, -5.5, 9 + wallThickness/2, baseWallMat)
const doorx1 = createFloor(wallThickness, 1, -1.75, 9 + wallThickness/2, baseWoodMat)
const wallx2 = createFloor(wallThickness, 5.5, 1.5, 9 + wallThickness/2, baseWallMat)
const doorx2 = createFloor(wallThickness, 1, 4.75, 9 + wallThickness/2, baseWoodMat)
const wallx3 = createFloor(wallThickness, 3.5, 7, 9 + wallThickness/2, baseWallMat)

const wallx4 = createFloor(wallThickness, 6 + wallThickness, -5.75 + wallThickness/2, -9 - wallThickness/2, baseWallMat)
const wallx5 = createFloor(wallThickness, 4, -0.75, -5 - wallThickness/2, baseWallMat)
const doorx3 = createFloor(wallThickness, 1, 1.75, -5 - wallThickness/2, baseGlassMat)
const wallx6 = createFloor(wallThickness, 6.5, 5.5, -5 - wallThickness/2, baseWallMat)

const wallz1 = createFloor(18 + wallThickness*2, wallThickness, -8.75 - wallThickness/2, 0, baseWallMat)

const doorz1 = createFloor(4 - wallThickness, wallThickness, -2.75 + wallThickness/2, -7 - wallThickness/2, baseGlassMat)

const wallz2 = createFloor(2 + wallThickness, wallThickness, 8.75 + wallThickness/2, -4 - wallThickness/2, baseWallMat)
const doorz2 = createFloor(5.5, wallThickness, 8.75 + wallThickness/2, -0.25, baseGlassMat)
const wallz3 = createFloor(6.5 + wallThickness, wallThickness, 8.75 + wallThickness/2, 5.75 + wallThickness/2, baseWallMat)

// Other structures & objects
const pillar = createObject(1, 1, 1.75, 2.5, basePillarMat)
const table_p1 = createObject(1, 4.5, -1, 2.5, baseGlassMat)
const table_p2 = createObject(1, 4.5, 5.5, 2.5, baseGlassMat)

const table_v1 = createObject(3, 1, -4, 6, baseGlassMat)
const table_v2 = createObject(3, 1, -1, 6, baseGlassMat)
const table_v3 = createObject(3, 1, 1.75, 6, baseGlassMat)
const table_v4 = createObject(3, 1, 4.55, 6, baseGlassMat)
const table_v5 = createObject(3, 1, 7.35, 6, baseGlassMat)

const workbench_v1 = createObject(1.8, 4.75, -1.1, 0.12, baseBenchMat)
const workbench_v2 = createObject(1.8, 4.75, 4.65, 0.12, baseBenchMat)
const workbench_v3 = createObject(1.8, 4.75, -1.1, -3.15, baseBenchMat)
const workbench_v4 = createObject(1.8, 4.75, 4.65, -3.15, baseBenchMat)

const buggy = createObject(1.8, 1, -8, -7.5, baseBuggyMat)

const Waiz = createMarker(-0.3, 7, 0xff0000);

function animate (t = 0) {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

