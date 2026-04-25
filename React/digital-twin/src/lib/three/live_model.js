import * as THREE from 'three';
import { io } from 'socket.io-client';
import { initVariables } from './variables.js';
import { initScene, scene, camera, renderer, controls } from './scene.js';
import { loadAssets, buildLiveWorld, createMarker } from './world.js';
import { renderLiveFrame } from './live_simulation.js';

let animationFrameId;
let currentContainer = null;
let trackMarkers = new Map();
let socket = null;
let heartbeatTimer = null;

function setStatus(isOnline) {
    const statusEl = document.getElementById('data-status');
    if (!statusEl) return;
    
    if (isOnline) {
        if (statusEl.textContent !== "Online") { 
            statusEl.textContent = "Online";
            statusEl.style.backgroundColor = "#00ff88"; 
            statusEl.style.color = "#000000";
            statusEl.style.boxShadow = "0 0 10px #00ff88"; 
        }
    } else {
        statusEl.textContent = "Offline";
        statusEl.style.backgroundColor = "#ff0000"; 
        statusEl.style.color = "#ffffff";
        statusEl.style.boxShadow = "none";
        statusEl.style.boxShadow = "0 0 10px #ff0000"; 
    }
}

function createTrackMarker(trackId, position, region) {
    // Generate a consistent color based on the ID hash
    let hash = 0;
    for (let i = 0; i < trackId.length; i++) hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
    const colorHex = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`).getHex();

    // Uses your standard world.js createMarker function
    const marker = createMarker(position.x, position.z, colorHex, 0.2, trackId);
    scene.add(marker);
    
    trackMarkers.set(trackId, {
        mesh: marker,
        trackId: trackId,
        position: position,
        lastUpdate: Date.now(),
        region: region
    });
    return marker;
}

function updateTrackMarker(trackId, position, region) {
    if (trackMarkers.has(trackId)) {
        const markerData = trackMarkers.get(trackId);
        markerData.mesh.position.set(position.x, 0.3, position.z);
        markerData.position = position;
        markerData.lastUpdate = Date.now();
        markerData.region = region; 
    } else {
        createTrackMarker(trackId, position, region);
    }
}

function removeStaleMarkers() {
    const now = Date.now();
    const staleThreshold = 3000; // 30 seconds
    let removedCount = 0; 
    
    trackMarkers.forEach((markerData, trackId) => {
        if (now - markerData.lastUpdate > staleThreshold) {
            scene.remove(markerData.mesh);
            trackMarkers.delete(trackId);
            removedCount++;
        }
    });

    if (removedCount > 0) updateLiveUI(trackMarkers.size); 
}

function updateLiveUI(trackCount) {
    const occupancyEl = document.getElementById('ui-iot-occupancy');
    if (occupancyEl) {
        occupancyEl.textContent = `${trackCount} people`;
        
        // This clears any inline colors so your Tailwind 'text-black' class works perfectly!
        occupancyEl.style.backgroundColor = "#00ff88";
    }
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

    if (Math.random() < 0.02) removeStaleMarkers();
    
    // --- THIS REPLACES renderFrame(0) and the Clock Override! ---
    // This raycasts the room names and updates the live clock perfectly.
    renderLiveFrame(); 
    
    // This forces the Occupancy UI to exactly match the active 3D dots.
    updateLiveUI(trackMarkers.size); 
    // ------------------------------------------------------------
    
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

export async function initLiveEngine(container) {
    currentContainer = container; 
    
    // Memory wipe for Next.js SPA transitions
    trackMarkers.forEach(data => scene.remove(data.mesh));
    trackMarkers.clear();

    initScene(container);
    
    if (renderer) {
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
    }

    await initVariables();

    // --- SOCKET CONFIGURATION ---
    setStatus(false);
    socket = io("http://localhost:1767");

    // 🛑 ADD THIS DEBUG BLOCK:
    socket.onAny((eventName, ...args) => {
        console.log(`[SOCKET DEBUG] Received event: "${eventName}"`, args);
    });

    socket.on('connect', () => {
        console.log('✅ Connected to server');
        socket.emit('request_tracking_data');
    });

    socket.on('initial_live_data', (trackingDataArray) => {
        trackingDataArray.forEach(track => {
            const compositeId = `${track.region}_${track.id}`;
            const position = track.region === 'MAIN_VIEW' ? { x: track.x, z: track.z } : { x: track.z, z: track.x };
            updateTrackMarker(compositeId, position, track.region);
        });
        
        // --- FIX 2: TRUST THE 3D ENGINE COUNT ---
        updateLiveUI(trackMarkers.size); 
    });

    socket.on('live_tracking_update', (trackData) => {
        setStatus(true); 
        
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        heartbeatTimer = setTimeout(() => setStatus(false), 10000);

        const compositeId = `${trackData.region}_${trackData.id}`;
        const position = trackData.region === 'MAIN_VIEW' ? { x: trackData.x, z: trackData.z } : { x: trackData.z, z: trackData.x };
        
        updateTrackMarker(compositeId, position, trackData.region);

        // Force the UI to display the exact number of active 3D tracking markers!
        updateLiveUI(trackMarkers.size);
    });

    socket.on('disconnect', () => setStatus(false));
    // ----------------------------

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
    if (socket) socket.disconnect();
    
    currentContainer = null;
    
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        const dom = renderer.domElement;
        if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
    }
}