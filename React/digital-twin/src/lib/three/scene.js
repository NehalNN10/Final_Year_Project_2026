import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Alias the import so it's clear what it's doing
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export let scene, camera, renderer, controls;

export function initScene(container) {
    // Force a minimum size if container is briefly 0x0 during React hydration
    const w = container.clientWidth || window.innerWidth || 800;
    const h = container.clientHeight || window.innerHeight || 600;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    
    // PCFShadowMap (Without the 'Soft') is the new standard
    renderer.shadowMap.type = THREE.PCFShadowMap; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x131314);

    // Use the RGBELoader normally
    const hdrLoader = new RGBELoader();
    
    // Note: ensure your path starts with / for Next.js public folder
    hdrLoader.load('/models/qwantani_sunset_puresky_4k.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture; 
        scene.background = texture; 
    });

    const fov = 75;
    const aspect = w / h;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    camera.position.set(-10, 15, 0);

    // INJECT INTO REACT CONTAINER
    container.appendChild(renderer.domElement);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(10, 20, 10); 
    sunLight.castShadow = true;

    const d = 20;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.mapSize.width = 4096; 
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.bias = -0.0001; 
    scene.add(sunLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true; 
    controls.screenSpacePanning = false; 
    controls.maxPolarAngle = Math.PI / 2;

    scene.add(camera);
}