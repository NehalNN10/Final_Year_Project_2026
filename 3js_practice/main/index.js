import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1117);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const aspect = window.innerWidth / window.innerHeight;
const d = 20;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Isometric-style view position
camera.position.set(0, 20, 0);  
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = true; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = Math.PI / 2; 

// Floor
const floorGeometry = new THREE.PlaneGeometry(12, 6);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x447c5a, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Walls Setup
const wallHeight = 2;
const wallThickness = 0.35;

// Base material definition
const baseWallMat = new THREE.MeshBasicMaterial({ 
    color: 0x999999, 
    transparent: true, 
    opacity: 1, 
    side: THREE.DoubleSide 
});

// Helper function to create a wall with a UNIQUE material clone
function createWall(w, h, d, x, y, z, rotY) {
    const geo = new THREE.BoxGeometry(w, h, d);
    // CRITICAL FIX: .clone() creates a unique copy of the material
    const mesh = new THREE.Mesh(geo, baseWallMat.clone()); 
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    scene.add(mesh);
    return mesh;
}

// Z-Axis Walls (Front/Back)
// Note: I adjusted your geometry math slightly to make corners flush
const wallz1 = createWall(12 + wallThickness*2, wallHeight, wallThickness, 0, wallHeight/2, -3 - wallThickness/2, 0);
const wallz2 = createWall(12 + wallThickness*2, wallHeight, wallThickness, 0, wallHeight/2, 3 + wallThickness/2, Math.PI);

// X-Axis Walls (Left/Right)
const wallx1 = createWall(6 + wallThickness, wallHeight, wallThickness, -6 - wallThickness/2, wallHeight/2, 0, Math.PI / 2);
const wallx2 = createWall(6 + wallThickness, wallHeight, wallThickness, 6 + wallThickness/2, wallHeight/2, 0, -Math.PI / 2);


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const maxRotationY = Math.PI / 2;
    const minRotationY = -Math.PI / 2;

    floor.rotation.y = Math.max(minRotationY, Math.min(maxRotationY, floor.rotation.y));

    // 1. Calculate Distances
    const dZ1 = camera.position.distanceTo(wallz1.position);
    const dZ2 = camera.position.distanceTo(wallz2.position);
    const dX1 = camera.position.distanceTo(wallx1.position);
    const dX2 = camera.position.distanceTo(wallx2.position);

    // 2. Determine Target Opacity (Logic: Further wall = 1, Closer wall = 0.15)
    // We use a "target" variable because we want to animate towards it
    const targetOpZ1 = dZ1 < dZ2 ? 0 : 0.95;
    const targetOpZ2 = dZ2 < dZ1 ? 0 : 0.95;
    
    const targetOpX1 = dX1 < dX2 ? 0 : 0.95;
    const targetOpX2 = dX2 < dX1 ? 0 : 0.95;

    // 3. Apply Smooth Transition (Lerp)
    // "Lerp" moves the current value 10% (0.1) closer to the target every frame
    wallz1.material.opacity = THREE.MathUtils.lerp(wallz1.material.opacity, targetOpZ1, 0.1);
    wallz2.material.opacity = THREE.MathUtils.lerp(wallz2.material.opacity, targetOpZ2, 0.1);
    wallx1.material.opacity = THREE.MathUtils.lerp(wallx1.material.opacity, targetOpX1, 0.1);
    wallx2.material.opacity = THREE.MathUtils.lerp(wallx2.material.opacity, targetOpX2, 0.1);

    renderer.render(scene, camera);
}


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();