import * as THREE from 'three';
import { initVariables, sendFacilitiesAlert, roomInfo } from './variables.js'; 
// 🌟 ADD setupHeatmap TO THIS LIST!
// import { initScene, setupLiveHeatmap, scene, camera, renderer, controls, composer, heatmapCtx, heatmapTexture, heatmapPlane, heatmapWidth, heatmapHeight } from './scene.js';
import { initScene, scene, camera, renderer, controls, composer } from './scene.js';
import { loadAssets, buildLiveWorld, createMarker, models, createObjectMarker } from './world.js';
import { renderLiveFrame } from './live_simulation.js';
import { liveHeatmapConfig } from './liveHeatmapConfig.js';

let animationFrameId;
let heatmapCanvas, heatmapCtx, heatmapTexture, heatmapPlane, heatmapSize, heatmapWidth, heatmapHeight;
let currentContainer = null;
let trackMarkers = new Map();

// ==========================================
// 🌟 LIVE SETTINGS & STATE
// ==========================================
export const liveSettings = {
    showHeatmap: false // Toggle this from your React UI!
};

let liveIoTData = { temperature: null, ac_state: null, lights_state: null, device_id: 'Live_Room' };
let liveOccupancy = 0;
let lastSecond = -1;
let lastAlertTime = 0;
const ALERT_THRESHOLD = 120; // 120 seconds
const trackers = { acWasted: 0, lightsWasted: 0, tempWarm: 0, tempCold: 0 };

function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
}

// ==========================================
// 🌟 LIVE ALERT TRACKING
// ==========================================
function evaluateLiveAlerts() {
    const nowSec = Math.floor(Date.now() / 1000);
    
    if (nowSec !== lastSecond) {
        lastSecond = nowSec;
        if (liveIoTData.temperature === null && liveIoTData.ac_state === null) return;

        if (liveOccupancy === 0 && liveIoTData.ac_state === 'ON') trackers.acWasted++; 
        else trackers.acWasted = 0;

        if (liveOccupancy === 0 && liveIoTData.lights_state === 'ON') trackers.lightsWasted++; 
        else trackers.lightsWasted = 0;

        if (liveIoTData.temperature > 28) trackers.tempWarm++; 
        else trackers.tempWarm = 0;

        if (liveIoTData.temperature !== null && liveIoTData.temperature < 22) trackers.tempCold++; 
        else trackers.tempCold = 0;

        const roomId = liveIoTData.device_id || "Live_Room";
        const roomInf = roomInfo[roomId];
        let occuAlert = null;
        if (roomInf && liveOccupancy > roomInf.max_occupancy) {
            occuAlert = `Over capacity: ${liveOccupancy}/${roomInf.max_occupancy}`;
        }

        if (nowSec - lastAlertTime >= ALERT_THRESHOLD) {
            const activeAlerts = [];
            const descriptions = [];

            if (trackers.acWasted >= ALERT_THRESHOLD) {
                activeAlerts.push("AC Being Wasted");
                descriptions.push(`AC being wasted with zero occupancy for ${formatTime(trackers.acWasted)}.`);
            }
            if (trackers.lightsWasted >= ALERT_THRESHOLD) {
                activeAlerts.push("Lights Being Wasted");
                descriptions.push(`Lights being wasted with zero occupancy for ${formatTime(trackers.lightsWasted)}.`);
            }
            if (trackers.tempWarm >= ALERT_THRESHOLD) {
                activeAlerts.push("Temperature Too Warm");
                descriptions.push(`Temperature over 28°C (${liveIoTData.temperature.toFixed(1)}°C) for ${formatTime(trackers.tempWarm)}.`);
            }
            if (trackers.tempCold >= ALERT_THRESHOLD) {
                activeAlerts.push("Temperature Too Cold");
                descriptions.push(`Temperature under 22°C (${liveIoTData.temperature.toFixed(1)}°C) for ${formatTime(trackers.tempCold)}.`);
            }
            if (occuAlert) {
                activeAlerts.push("Capacity Breach");
                descriptions.push(occuAlert);
            }

            if (activeAlerts.length > 0) {
                const combinedTitle = activeAlerts.join(" & ");
                const combinedDesc = descriptions.join("\n \n");
                const currentTime = new Date().toLocaleTimeString();
                
                if (typeof sendFacilitiesAlert === 'function') {
                    sendFacilitiesAlert(roomId, combinedTitle, currentTime, combinedDesc);
                }
                lastAlertTime = nowSec;
            }
        }
    }
}

// ==========================================
// 🌟 LIVE HEATMAP SETUP (replaces setupHeatmap for live stream)
// ==========================================
function setupLiveHeatmap(showHeatmap) {
    const { floorWidth, floorDepth, bounds, floorVertices, heatmap } = liveHeatmapConfig;
    
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

    // Create floor shape from liveHeatmapConfig
    const floorShape = new THREE.Shape();
    floorVertices.forEach((vertex, idx) => {
        if (idx === 0) {
            floorShape.moveTo(vertex[0], vertex[1]);
        } else {
            floorShape.lineTo(vertex[0], vertex[1]);
        }
    });

    const customGeometry = new THREE.ShapeGeometry(floorShape);
    const posAttribute = customGeometry.attributes.position;
    const uvAttribute = customGeometry.attributes.uv;

    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);

        const u = (x - bounds.xMin) / floorWidth; 
        const v = 1.0 - ((y - bounds.zMin) / floorDepth); 

        uvAttribute.setXY(i, u, v);
    }

    heatmapPlane = new THREE.Mesh(
        customGeometry,
        new THREE.MeshBasicMaterial({
            map: heatmapTexture,
            transparent: true,
            opacity: heatmap.opacity,
            depthWrite: false,
        })
    );

    heatmapPlane.material.opacity = showHeatmap ? 1 : 0;
    heatmapPlane.rotation.x = -Math.PI / 2;
    heatmapPlane.rotation.z = -Math.PI / 2;
    heatmapPlane.position.set(0, 0.1, 0);                  
    
    scene.add(heatmapPlane);
}

// ==========================================
// 🌟 LIVE HEATMAP ENGINE
// ==========================================
let density = new Float32Array(liveHeatmapConfig.heatmap.gridSize * liveHeatmapConfig.heatmap.gridSize);
const smoothSigma = 4.0;
const radius = Math.ceil(3 * smoothSigma);
const weightCache = new Float32Array((radius * 2 + 1) * (radius * 2 + 1));
let heatmapThrottle = 0;

for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
        const w = Math.exp(-(dx*dx + dy*dy) / (2 * smoothSigma * smoothSigma));
        weightCache[(dy + radius) * (radius * 2 + 1) + (dx + radius)] = w;
    }
}

export function updateHeatmap(markers) {
    const gridCols = liveHeatmapConfig.heatmap.gridSize;
    const gridRows = liveHeatmapConfig.heatmap.gridSize;
    const { xMin, xMax, zMin, zMax } = liveHeatmapConfig.bounds;
    const { densityCap, coolingFactor } = liveHeatmapConfig.heatmap;

    for (let i = 0; i < density.length; i++) {
        density[i] *= coolingFactor; 
    }

    markers.forEach(marker => {
        const gx = Math.floor(((marker.x - xMin) / (xMax - xMin)) * gridCols);
        const gy = Math.floor(((marker.z - zMin) / (zMax - zMin)) * gridRows);
        if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
            density[gy * gridCols + gx] += 1; // Accumulate density
        }
    });

    const smoothed = new Float32Array(gridCols * gridRows);

    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            let sum = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < gridCols && ny >= 0 && ny < gridRows) {
                        const w = weightCache[(dy + radius) * (radius * 2 + 1) + (dx + radius)];
                        sum += density[ny * gridCols + nx] * w;
                    }
                }
            }
            smoothed[y * gridCols + x] = sum;
        }
    }
    
    const normalized = smoothed.map(d => Math.min(d / densityCap, 1.0));

    const imageData = heatmapCtx.createImageData(heatmapWidth, heatmapHeight);
    const data = imageData.data;

    const colorStops = [
        { t: 0.00, r: 0,   g: 0,   b: 150, a: 80  }, 
        { t: 0.15, r: 0,   g: 0,   b: 255, a: 120 }, 
        { t: 0.35, r: 0,   g: 255, b: 255, a: 160 }, 
        { t: 0.55, r: 0,   g: 255, b: 0,   a: 200 }, 
        { t: 0.80, r: 255, g: 255, b: 0,   a: 220 }, 
        { t: 1.00, r: 255, g: 0,   b: 0,   a: 245 }, 
    ];

    function sampleColor(t) {
        let lo = colorStops[0];
        let hi = colorStops[colorStops.length - 1];
        for (let i = 0; i < colorStops.length - 1; i++) {
            if (t >= colorStops[i].t && t <= colorStops[i + 1].t) {
                lo = colorStops[i];
                hi = colorStops[i + 1];
                break;
            }
        }
        const f = (hi.t === lo.t) ? 0 : (t - lo.t) / (hi.t - lo.t);
        return {
            r: Math.round(lo.r + f * (hi.r - lo.r)),
            g: Math.round(lo.g + f * (hi.g - lo.g)),
            b: Math.round(lo.b + f * (hi.b - lo.b)),
            a: Math.round(lo.a + f * (hi.a - lo.a)),
        };
    }

    for (let py = 0; py < heatmapHeight; py++) {
        for (let px = 0; px < heatmapWidth; px++) {
            const gx = (px / heatmapWidth) * gridCols;
            const gy = (py / heatmapHeight) * gridRows;

            const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, gridCols - 1);
            const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, gridRows - 1);
            const fx = gx - x0, fy = gy - y0;

            const d00 = normalized[y0 * gridCols + x0];
            const d10 = normalized[y0 * gridCols + x1];
            const d01 = normalized[y1 * gridCols + x0];
            const d11 = normalized[y1 * gridCols + x1];
            const densityValue = (d00*(1-fx) + d10*fx)*(1-fy) + (d01*(1-fx) + d11*fx)*fy;

            const { r, g, b, a } = sampleColor(densityValue);
            
            const idx = (py * heatmapWidth + px) * 4;
            data[idx]   = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = a;
        }
    }

    heatmapCtx.putImageData(imageData, 0, 0);
    heatmapTexture.needsUpdate = true;
}

// ==========================================
// 🌟 AVATAR & OCCLUSION LOGIC
// ==========================================
function createOccludedLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'; 
    ctx.roundRect ? ctx.roundRect(0, 0, 256, 64, 16) : ctx.fillRect(0, 0, 256, 64);
    ctx.fill();
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OCCLUDED', 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    
    sprite.scale.set(1.5, 0.375, 1); 
    sprite.position.set(0, 1.5, 0); 
    sprite.name = "occlusionLabel"; 
    
    return sprite;
}

function applyOcclusionStyle(mesh, isOccluded) {
    let label = mesh.getObjectByName("occlusionLabel");

    if (isOccluded) {
        if (!label) {
            label = createOccludedLabel();
            mesh.add(label);
        }
    } else {
        if (label) {
            mesh.remove(label);
            label.material.map.dispose();
            label.material.dispose();
        }
    }
}

function updateTrackMarker(trackId, position, region, isOccluded) {
    if (trackMarkers.has(trackId)) {
        const markerData = trackMarkers.get(trackId);
        markerData.mesh.position.set(position.x, 0, position.z);
        markerData.position = position;
        markerData.region = region; 
        
        applyOcclusionStyle(markerData.mesh, isOccluded);
    } else {
        createTrackMarker(trackId, position, region, isOccluded);
    }
}

function createTrackMarker(trackId, position, region, isOccluded) {
    let hash = 0;
    for (let i = 0; i < trackId.length; i++) hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
    const colorHex = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`).getHex();

    const marker = createMarker(position.x, position.z, colorHex, 0.2, trackId); 
    scene.add(marker);
    
    trackMarkers.set(trackId, {
        mesh: marker,
        trackId: trackId,
        position: position,
        region: region
    });
    
    applyOcclusionStyle(marker, isOccluded);
    return marker;
}

// ==========================================
// 🌟 RENDER LOOP
// ==========================================
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
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
    evaluateLiveAlerts(); // Evaluate IoT alerts every frame
    
    if (controls) controls.update();
    if (renderer && scene && camera) composer.render();
}

export async function initLiveEngine(container) {
    currentContainer = container; 
    
    trackMarkers.forEach(data => scene.remove(data.mesh));
    trackMarkers.clear();

    initScene(container);

    setupLiveHeatmap(liveSettings.showHeatmap);

    camera.position.set(3.75, 6, 6);
    camera.lookAt(3.75, 0, 0);
    controls.target.set(3.75, 0, 0);
    
    if (renderer) {
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
    }

    await initVariables();

    // 🌟 BRIDGE 1: YOLO Data (Handles Heatmap & Avatars)
    window.updateLiveAvatars = (detectionsArray, currentCount) => {
        if (!scene) return;
        if (currentCount !== undefined) liveOccupancy = currentCount;

        const currentFrameIds = new Set();

        if (!liveSettings.showHeatmap) {
            // STANDARD AVATAR RENDER
            if (heatmapPlane) heatmapPlane.material.opacity = 0; // Hide heatmap
        
            detectionsArray.forEach(trackData => {
                const compositeId = `${trackData.region}_${trackData.id}`;
                currentFrameIds.add(compositeId);
                const position = { x: trackData.x, z: trackData.z };
                
                updateTrackMarker(compositeId, position, trackData.region, trackData.is_occluded);
                
                if(trackMarkers.has(compositeId)) {
                    trackMarkers.get(compositeId).mesh.visible = true;
                }
            });

            // Cleanup stale avatars
            trackMarkers.forEach((markerData, trackId) => {
                if (!currentFrameIds.has(trackId)) {
                    scene.remove(markerData.mesh);
                    trackMarkers.delete(trackId);
                }
            });
            
        } else {
            // HEATMAP RENDER
            if (heatmapPlane) heatmapPlane.material.opacity = 1; // Show heatmap
    
            // 1. Hide all avatars
            trackMarkers.forEach(markerData => markerData.mesh.visible = false);
            
            // 2. Throttle heatmap heavy math (run every 5 frames)
            heatmapThrottle++;
            if (heatmapThrottle >= 5) {
                updateHeatmap(detectionsArray);
                heatmapThrottle = 0;
            }
        }
    };

    // 🌟 BRIDGE 2: ESP32 IoT Data
    window.updateLiveSensorData = (iotData) => {
        if (iotData) liveIoTData = iotData;
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
    
    window.updateLiveAvatars = null;
    window.updateLiveSensorData = null; 
    currentContainer = null;
    
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        const dom = renderer.domElement;
        if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
    }
}