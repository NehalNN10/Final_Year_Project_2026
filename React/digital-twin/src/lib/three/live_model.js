import * as THREE from 'three';
import { initVariables } from './variables.js';
import { initScene, scene, camera, renderer, controls, composer } from './scene.js';
import { loadAssets, buildLiveWorld, createMarker, models, createObjectMarker } from './world.js';
import { renderLiveFrame } from './live_simulation.js';

let animationFrameId;
let currentContainer = null;
let trackMarkers = new Map();

// function createTrackMarker(trackId, position, region) {
//     // Generate a consistent color based on the ID hash
//     let hash = 0;
//     for (let i = 0; i < trackId.length; i++) hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
//     const colorHex = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`).getHex();

//     // Uses your standard world.js createMarker function
//     const marker = createMarker(position.z, position.x, colorHex, 0.2, trackId);
//     scene.add(marker);
    
//     trackMarkers.set(trackId, {
//         mesh: marker,
//         trackId: trackId,
//         position: position,
//         region: region
//     });
//     return marker;
// }

function updateTrackMarker(trackId, position, region) {
    // Centering logic based on your world dimensions
    // position.x -= 4.25; // Center X around middle of the room
    // position.z += 2.4;  // Center Z around middle of the room
    if (trackMarkers.has(trackId)) {
        const markerData = trackMarkers.get(trackId);

        markerData.mesh.position.set(position.x, 0, position.z);
        
        markerData.position = position;
        markerData.region = region; 
    } else {
        createTrackMarker(trackId, position, region);
        
    }
}
function createTrackMarker(trackId, position, region) {
    let hash = 0;
    for (let i = 0; i < trackId.length; i++) hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
    const colorHex = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`).getHex();

    // FIXED: Passed position.x first, then position.z
    const marker = createMarker(position.x, position.z, colorHex, 0.2, trackId); 
    scene.add(marker);
    
    trackMarkers.set(trackId, {
        mesh: marker,
        trackId: trackId,
        position: position,
        region: region
    });
    console.log(`Created marker for ${trackId} at (${position.x.toFixed(2)}, ${position.z.toFixed(2)}) in region ${region}`);
    return marker;
}
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    // --- FLICKER-FREE RESIZE LOGIC ---
    if (currentContainer && renderer && camera) {
        const width = currentContainer.clientWidth;
        const height = currentContainer.clientHeight;
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(width * pixelRatio);
        const targetHeight = Math.floor(height * pixelRatio);

        if (width > 0 && height > 0 && (canvas.width !== targetWidth || canvas.height !== targetHeight)) {
            renderer.setSize(width, height, false); 
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }
    
    renderLiveFrame(); 
    
    if (controls) controls.update();
    if (renderer && scene && camera) composer.render();
}

export async function initLiveEngine(container) {
    currentContainer = container; 
    
    // Memory wipe for Next.js SPA transitions
    trackMarkers.forEach(data => scene.remove(data.mesh));
    trackMarkers.clear();

    initScene(container);

    camera.position.set(3.75, 6, 6);
    camera.lookAt(3.75, 0, 0);
    controls.target.set(3.75, 0, 0);
    
    if (renderer) {
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
    }

    await initVariables();

    // ==========================================
    // 🌟 THE BRIDGE: Listen to React, not WebSockets
    // ==========================================
    window.updateLiveAvatars = (detectionsArray) => {
        if (!scene) return;

        // Keep track of which IDs are currently visible
        const currentFrameIds = new Set();

        // Add or Update markers
        detectionsArray.forEach(trackData => {
            const compositeId = `${trackData.region}_${trackData.id}`;
            currentFrameIds.add(compositeId);

            // Using your existing mapping logic
            // const position = trackData.region === 'MAIN_VIEW' 
            //     ? { x: trackData.x, z: trackData.z } 
            //     : { x: trackData.x, z: trackData.z };
            const position = { x: trackData.x, z: trackData.z };
            
            updateTrackMarker(compositeId, position, trackData.region);

            console.log(`Updating marker for ${compositeId} at (${position.x.toFixed(2)}, ${position.z.toFixed(2)}) in region ${trackData.region}`);
        });

        // Instantly remove anyone who walked off-camera
        // This replaces the hacky Math.random() stale marker check!
        trackMarkers.forEach((markerData, trackId) => {
            if (!currentFrameIds.has(trackId)) {
                scene.remove(markerData.mesh);
                trackMarkers.delete(trackId);
            }
        });
    };

    try {
        await loadAssets();
        buildLiveWorld(); 
        animate();
    } catch (err) {
        console.error("Critical Error loading assets:", err);
    }
}

export function destroyLiveEngine() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // Clean up the bridge!
    window.updateLiveAvatars = null;
    
    currentContainer = null;
    
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        const dom = renderer.domElement;
        if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
    }
}