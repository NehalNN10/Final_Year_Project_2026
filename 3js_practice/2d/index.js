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

// Walls
const wallHeight = 2;
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });

const wall1 = new THREE.Mesh(new THREE.PlaneGeometry(12, wallHeight), wallMaterial);
wall1.position.y = wallHeight / 2;
wall1.position.z = -3;
scene.add(wall1);

const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(12, wallHeight), wallMaterial);
wall2.position.y = wallHeight / 2;
wall2.position.z = 3;
wall2.rotation.y = Math.PI;
scene.add(wall2);

const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(6, wallHeight), wallMaterial);
wall3.position.y = wallHeight / 2;
wall3.position.x = -6;
wall3.rotation.y = Math.PI / 2;
scene.add(wall3);

const wall4 = new THREE.Mesh(new THREE.PlaneGeometry(6, wallHeight), wallMaterial);
wall4.position.y = wallHeight / 2;
wall4.position.x = 6;
wall4.rotation.y = -Math.PI / 2; 
scene.add(wall4);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const maxRotationY = Math.PI / 2;
    const minRotationY = -Math.PI / 2;

    floor.rotation.y = Math.max(minRotationY, Math.min(maxRotationY, floor.rotation.y));
    
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

// Start the animation loop
animate();
