import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

export const w = window.innerWidth;
export const h = window.innerHeight;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 1;
const far = 200;
export const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-20, 20);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131314);
// scene.rotateY(Math.PI/2);

const ambientLight = new THREE.AmbientLight(0xffffff, 1); 
scene.add(ambientLight);

// 2. Directional Light (Simulates sun/overhead light)
const headlight = new THREE.DirectionalLight(0xffffff, 3);
headlight.position.set(0, 0, 1);
camera.add(headlight);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = false; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = Math.PI / 2;
controls.minY = 0.1;

scene.add(camera);

const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);