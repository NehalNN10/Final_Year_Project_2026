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

const baseWallMat = new THREE.MeshBasicMaterial({ 
    color: 0x999999, 
    transparent: true, 
    opacity: 1, 
    side: THREE.DoubleSide 
});

const baseWoodMat = new THREE.MeshBasicMaterial({ 
    color: 0x462416, 
    transparent: true, 
    opacity: 1, 
    side: THREE.DoubleSide 
});

const baseGlassMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffffff, 
    transparent: true, 
    opacity: 1, 
    side: THREE.DoubleSide 
});

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

const floor1 = createFloor(14, 11.5, 3, 2, floorMaterial)
const floor2 = createFloor(18, 6, -5.75, 0, floorMaterial)

const wallThickness = 0.35;

const wallx1 = createFloor(wallThickness, 6.5, -5.5, 9 + wallThickness/2, baseWallMat)
const door1 = createFloor(wallThickness, 1, -1.75, 9 + wallThickness/2, baseWoodMat)
const wallx2 = createFloor(wallThickness, 5.5, 1.5, 9 + wallThickness/2, baseWallMat)
const door2 = createFloor(wallThickness, 1, 4.75, 9 + wallThickness/2, baseWoodMat)
const wallx3 = createFloor(wallThickness, 3.5, 7, 9 + wallThickness/2, baseWallMat)

const wallx4 = createFloor(wallThickness, 6 + wallThickness, -5.75 + wallThickness/2, -9 - wallThickness/2, baseWallMat)
const wallx5 = createFloor(wallThickness, 4, -0.75, -5 - wallThickness/2, baseWallMat)
const door3 = createFloor(wallThickness, 1, 1.75, -5 - wallThickness/2, baseGlassMat)
const wallx6 = createFloor(wallThickness, 6.5, 5.5, -5 - wallThickness/2, baseWallMat)

const wallz1 = createFloor(18 + wallThickness*2, wallThickness, -8.75 - wallThickness/2, 0, baseWallMat)

const doorz1 = createFloor(4 - wallThickness, wallThickness, -2.75 + wallThickness/2, -7 - wallThickness/2, baseWallMat)

const wallz2 = createFloor(2 + wallThickness, wallThickness, 8.75 + wallThickness/2, -4 - wallThickness/2, baseWallMat)
const doorz2 = createFloor(6.5, wallThickness, 8.75 + wallThickness/2, 0.25, baseGlassMat)
// const doorz2 = createGlassDoor(6.5, wallHeight, wallThickness, 0.25, wallHeight/2, 8.75 + wallThickness/2, 0, "glass");
const wallz3 = createFloor(5.5 + wallThickness, wallThickness, 8.75 + wallThickness/2, 6.25 + wallThickness/2, baseWallMat)
// const wallz3 = createWall(5.5 + wallThickness, wallHeight, wallThickness, 6.25 + wallThickness/2, wallHeight/2, 8.75 + wallThickness/2, 0);

function addMesh(x, y, z, rotY, mesh) {
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    scene.add(mesh);
    return mesh;
}

function createWall(w, h, d, x, y, z, rotY) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, baseWallMat.clone()); 
    return addMesh(x, y, z, rotY, mesh);
}

function createWoodDoor(w, h, d, x, y, z, rotY, type) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, baseWoodMat.clone()); 
    
    return addMesh(x, y, z, rotY, mesh);
}

function createGlassDoor(w, h, d, x, y, z, rotY, type) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, baseGlassMat.clone()); 
    
    return addMesh(x, y, z, rotY, mesh);
}

// const wallx1 = createWall(6.5, wallHeight, wallThickness, 9 + wallThickness/2, wallHeight/2, -5.5, Math.PI / 2);
// const door1 = createWoodDoor(1, wallHeight, wallThickness, 9 + wallThickness/2, wallHeight/2, -1.75, Math.PI / 2, "wood");
// const wallx2 = createWall(5.5, wallHeight, wallThickness, 9 + wallThickness/2, wallHeight/2, 1.5, Math.PI / 2);
// const door2 = createWoodDoor(1, wallHeight, wallThickness, 9 + wallThickness/2, wallHeight/2, 4.75, Math.PI / 2, "wood");
// const wallx3 = createWall(3.5, wallHeight, wallThickness, 9 + wallThickness/2, wallHeight/2, 7, Math.PI / 2);

// const wallx4 = createWall(6 + wallThickness, wallHeight, wallThickness, -9 - wallThickness/2, wallHeight/2, -5.75 + wallThickness/2, Math.PI / 2);
// const wallx5 = createWall(4, wallHeight, wallThickness, -5 - wallThickness/2, wallHeight/2, -0.75, Math.PI / 2);
// const door3 = createGlassDoor(1, wallHeight, wallThickness, -5 - wallThickness/2, wallHeight/2, 1.75, Math.PI / 2, "glass");
// const wallx6 = createWall(6.5, wallHeight, wallThickness, -5 - wallThickness/2, wallHeight/2, 5.5, Math.PI / 2);

// const wallz1 = createWall(18 + wallThickness*2, wallHeight, wallThickness, 0, wallHeight/2, -8.75 - wallThickness/2, 0);

// const doorz1 = createGlassDoor(4 - wallThickness, wallHeight, wallThickness, -7 - wallThickness/2, wallHeight/2, -2.75 + wallThickness/2, 0, "glass");

// const wallz2 = createWall(2 + wallThickness, wallHeight, wallThickness, -4 - wallThickness/2, wallHeight/2, 8.75 + wallThickness/2, 0);
// const doorz2 = createGlassDoor(6.5, wallHeight, wallThickness, 0.25, wallHeight/2, 8.75 + wallThickness/2, 0, "glass");
// const wallz3 = createWall(5.5 + wallThickness, wallHeight, wallThickness, 6.25 + wallThickness/2, wallHeight/2, 8.75 + wallThickness/2, 0);

function animate (t = 0) {
    requestAnimationFrame(animate);
    controls.update();
    const maxRotationZ = Math.PI / 2;
    const minRotationZ = -Math.PI / 2;

    floor1.rotation.z = Math.max(minRotationZ, Math.min(maxRotationZ, floor1.rotation.z));
    floor2.rotation.z = Math.max(minRotationZ, Math.min(maxRotationZ, floor2.rotation.z));
    renderer.render(scene, camera);
    
}

animate();