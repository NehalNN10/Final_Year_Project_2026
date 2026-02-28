import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { loadAssets, buildWorld } from "./assets/world.js";
import { livePlayback, createLiveMarker, updateLiveMarker, getFormattedTime } from "./assets/live_simulation.js";
import { scene, camera, renderer, controls } from "./assets/scene.js";

const socket = io();

const container = document.getElementById('model-container');
if (container) {
    container.appendChild(renderer.domElement);
}

// Smart Resizing
const resizeObserver = new ResizeObserver(() => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
});
resizeObserver.observe(container);

let trackMarkers = new Map(); // Store markers by track ID

function createTrackMarker(trackId, position) {
    const marker = createLiveMarker(trackId, position);
    scene.add(marker);
    trackMarkers.set(trackId, {
        mesh: marker,
        trackId: trackId,
        position: position,
        lastUpdate: Date.now()
    });
    return marker;
}

function updateTrackMarker(trackId, position) {
    if (trackMarkers.has(trackId)) {
        const markerData = trackMarkers.get(trackId);
        markerData.mesh.position.set(position.x, 0.3, position.z);
        markerData.position = position;
        markerData.lastUpdate = Date.now();
    } else {
        createTrackMarker(trackId, position);
    }
}

function removeStaleMarkers() {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    
    trackMarkers.forEach((markerData, trackId) => {
        if (now - markerData.lastUpdate > staleThreshold) {
            scene.remove(markerData.mesh);
            trackMarkers.delete(trackId);
            console.log(`🗑️ Removed stale marker: ${trackId}`);
        }
    });
}

function updateLiveUI(trackCount) {
    const occupancyEl = document.getElementById('ui-occupancy');
    const timeEl = document.getElementById('ui-iot-time');
    
    if (occupancyEl) {
        occupancyEl.textContent = `${trackCount} people`;
    }
    if (timeEl) {
        timeEl.textContent = getFormattedTime();
    }
}

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('✅ Connected to server');
    socket.emit('request_tracking_data');
});

socket.on('initial_live_data', (trackingDataArray) => {
    console.log('📥 Initial tracking data received:', trackingDataArray.length, 'tracks');
    trackingDataArray.forEach(track => {
        updateTrackMarker(track.id, { x: track.x, z: track.z });
    });
    updateLiveUI(trackMarkers.size);
});

socket.on('live_tracking_update', (trackData) => {
    console.log(`📡 Update received for track ${trackData.id}: (${trackData.x}, ${trackData.z})`);
    updateTrackMarker(trackData.id, { x: trackData.x, z: trackData.z });
    updateLiveUI(trackMarkers.size);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
});

// --- INITIALIZATION CHAIN (same pattern as model.js) ---
// 1. Load 3D Assets -> Then Build World -> Then Start Animate
loadAssets().then(() => {
    console.log("Assets ready. Building world...");
    buildWorld(); // Creates the tables/walls using the loaded assets
    animate();    // Start the loop
}).catch(err => {
    console.error("Critical Error loading assets:", err);
});

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    // Remove stale markers every ~5 seconds (~2% chance per frame at 60fps)
    if (Math.random() < 0.02) {
        removeStaleMarkers();
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
});

console.log('🎥 Live model initialized');