import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { loadAssets, buildWorld } from "./assets/world.js";
import { renderFrame, livePlayback, createLiveMarker, updateLiveMarker, getFormattedTime } from "./assets/live_simulation.js";
import { scene, camera, renderer, controls } from "./assets/scene.js";

const socket = io();

const container = document.getElementById('model-container');
if (container) {
    container.appendChild(renderer.domElement);
}

const statusEl = document.getElementById('data-status');
let heartbeatTimer = null;

function setStatus(isOnline) {
    if (!statusEl) return;
    
    if (isOnline) {
        if (statusEl.textContent !== "Online") { // Prevent unnecessary DOM updates
            statusEl.textContent = "Online";
            statusEl.style.backgroundColor = "#00ff88"; // Bright Green
            statusEl.style.color = "#000000";
            statusEl.style.boxShadow = "0 0 10px #00ff88"; // Glow effect
        }
    } else {
        statusEl.textContent = "Offline";
        statusEl.style.backgroundColor = "#ff0000"; // Red
        statusEl.style.color = "#ffffff";
        statusEl.style.boxShadow = "none";
        statusEl.style.boxShadow = "0 0 10px #ff0000"; // Glow effect
    }
}

setStatus(false);

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

function createTrackMarker(trackId, position, region) {
    const marker = createLiveMarker(trackId, position, region);
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
        markerData.region = region; // Update region info
    } else {
        createTrackMarker(trackId, position, region);
    }
}

function removeStaleMarkers() {
    const now = Date.now();
    const staleThreshold = 3000; // 30 seconds
    let removedCount = 0; // Track if we actually removed anything
    
    trackMarkers.forEach((markerData, trackId) => {
        if (now - markerData.lastUpdate > staleThreshold) {
            scene.remove(markerData.mesh);
            trackMarkers.delete(trackId);
            console.log(`🗑️ Removed stale marker: ${trackId}`);
            removedCount++;
        }
    });

    // --- FIX: Update the UI count if markers were removed ---
    if (removedCount > 0) {
        updateLiveUI(trackMarkers.size); // Use the current map size
    }
}

function updateLiveUI(trackCount) {
    const occupancyEl = document.getElementById('ui-iot-occupancy');
    if (occupancyEl) {
        occupancyEl.textContent = `${trackCount} people`;
        
        // Optional: Add color logic if you want consistency
        occupancyEl.style.color = (trackCount > 20) ? "#ff4444" : (trackCount === 0 ? "#ffffff" : "#00ff88");
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
        // --- CREATE COMPOSITE ID ---
        const compositeId = `${track.region}_${track.id}`;
        
        let position;
        if (track.region === 'MAIN_VIEW') {
            position = { x: track.x, z: track.z };
        } else {
            position = { x: track.z, z: track.x };
        }
        updateTrackMarker(compositeId, position, track.region);
    });
    updateLiveUI(trackingDataArray.length);
});

socket.on('live_tracking_update', (trackData) => {
    setStatus(true); 
    
    if (heartbeatTimer) clearTimeout(heartbeatTimer);
    
    heartbeatTimer = setTimeout(() => {
        setStatus(false);
    }, 10000);

    // --- CREATE COMPOSITE ID ---
    const compositeId = `${trackData.region}_${trackData.id}`;

    console.log(`📡 Update received for track ${compositeId}: (${trackData.x}, ${trackData.z})`);

    
    let position;
    if (trackData.region === 'MAIN_VIEW') {
        position = { x: trackData.x, z: trackData.z };
    } else {
        position = { x: trackData.z, z: trackData.x };
    }
    
    updateTrackMarker(compositeId, position, trackData.region);
    
    if (trackData.occupancy !== undefined) {
        updateLiveUI(trackData.occupancy);
    }
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
    
    renderFrame(); // Update UI elements like time and occupancy
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