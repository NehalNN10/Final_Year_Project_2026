import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { worldObjects } from "./world.js";
// Alias the import so it's clear what it's doing
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export let scene, camera, renderer, controls;
export let heatmapCanvas, heatmapCtx, heatmapTexture, heatmapPlane, heatmapSize, heatmapWidth, heatmapHeight;
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

export function setupHeatmap(showHeatmap) {
    // ----------------- Heatmap Setup -----------------
    const floorWidth = 18;   // X-axis (-9 to 9)
    const floorDepth = 17.5; // Z-axis (-8.75 to 8.75)
    const aspectRatio = floorWidth / floorDepth; 

    const heatmapBaseSize = 128;
    heatmapWidth = heatmapBaseSize;
    heatmapHeight = Math.round(heatmapBaseSize / aspectRatio);

    heatmapSize = heatmapBaseSize; 
    heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = Math.floor(heatmapWidth);
    heatmapCanvas.height = Math.floor(heatmapHeight);
    heatmapWidth = heatmapCanvas.width;
    heatmapHeight = heatmapCanvas.height;
    heatmapCtx = heatmapCanvas.getContext("2d");

    heatmapTexture = new THREE.CanvasTexture(heatmapCanvas);
    heatmapTexture.minFilter = THREE.LinearFilter;
    heatmapTexture.magFilter = THREE.LinearFilter;
    // REMOVED the repeat.x and offset.x hacks! The geometry fixes this natively.

    // 1. Draw the exact L-Shape
    // Note: Because we pitch the plane down by 90 degrees later, 
    // the 2D 'Y' coordinates here correspond to the 3D '-Z' coordinates!
    // (e.g. Y = 8.75 maps to the top/back wall at Z = -8.75)
    const floorShape = new THREE.Shape();
    floorShape.moveTo(-9, 8.75);   // Top-Left (Z = -8.75)
    floorShape.lineTo(9, 8.75);    // Top-Right (Z = -8.75)
    floorShape.lineTo(9, -8.75);   // Bottom-Right (Z = 8.75)
    
    // --- THE CUTOUT (Based on wallxm, wallzn, and wallxn) ---
    floorShape.lineTo(-5, -8.75);  // Bottom inner-corner (X = -5)
    floorShape.lineTo(-5, 2.75);   // Cutout corner going 'up' (Z = -2.75)
    floorShape.lineTo(-9, 2.75);   // Cutout corner going 'left' (X = -9)
    // --------------------------------------------------------
    
    floorShape.lineTo(-9, 8.75);   // Close shape back to start

    const customGeometry = new THREE.ShapeGeometry(floorShape);

    const posAttribute = customGeometry.attributes.position;
    const uvAttribute = customGeometry.attributes.uv;

    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);

        // Normalize X from [-9, 9] to [0.0, 1.0]
        const u = (x + 9) / 18; 
        
        // Normalize Y (which is our Z axis) from [-8.75, 8.75] to [1.0, 0.0]
        // We invert the V axis (1.0 - ...) because Canvas textures read bottom-to-top!
        const v = 1.0 - ((y + 8.75) / 17.5); 

        uvAttribute.setXY(i, u, v);
    }

    heatmapPlane = new THREE.Mesh(
        customGeometry, 
        new THREE.MeshBasicMaterial({
            map: heatmapTexture,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide // Important so it renders properly when laid flat
        })
    );

    heatmapPlane.material.opacity = showHeatmap ? 1 : 0;
    
    // 2. Lay it flat.
    // REMOVED the rotation.z hack. The shape handles the mapping perfectly.
    heatmapPlane.rotation.x = -Math.PI / 2;
    
    // Position is 0,0,0 because the vertices were drawn using exact world coordinates!
    heatmapPlane.position.set(0, 0.1, 0);                  
    
    scene.add(heatmapPlane);
}