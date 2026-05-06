import * as THREE from "three";
import { createMarker } from './world.js';
import { FPS, LOOP_DURATION, iot, getRoom, roomInfo } from "./variables.js";
import { camera } from "./scene.js";
import { heatmapCtx, heatmapTexture, heatmapWidth, heatmapHeight } from "./scene.js";

export const playback = {
    frame: 0,
    maxFrames: FPS * LOOP_DURATION,
    playing: true,
    speed: 1,
    showHeatmap: false
};

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0);
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const intersectionPoint = new THREE.Vector3();

export const trackers = { acWasted: {}, lightsWasted: {}, tempWarm: {}, tempCold: {} };
export const roomLastAlertTime = {};
export let lastSecond = -1;

export const chunkState = {
    loadedStartFrame: 0,
    loadedEndFrame: 0,
    isFetchingChunk: false
};

let globalTrackFrames = [];
let globalTrackData = new Map();
let globalCountData = new Map();
let trackMarkers = new Map();

function getDate(dateElement) {
    if (!dateElement) return;
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    dateElement.innerHTML = now.toLocaleDateString('en-US', options);
}

export async function fetchChunk(startFrame, endFrame) {
    if (chunkState.isFetchingChunk) return;
    chunkState.isFetchingChunk = true;

    try {
        const response = await fetch(`http://localhost:1767/api/tracks?start=${startFrame}&end=${endFrame}`);
        const data = await response.json();

        data.forEach(row => {
            const frame = row.frame;
            const id = `${row.track_id}_${row.camera}`;
            const x = parseFloat(row.three_x);
            const z = parseFloat(row.three_z);

            if (!globalTrackData.has(frame)) globalTrackData.set(frame, []);
            globalTrackData.get(frame).push({ id, x, z });

            if (!trackMarkers.has(id)) {
                let hash = 0;
                for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
                const colorHex = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`).getHex();
                
                const marker = createMarker(0, 0, colorHex, 0.2, id);
                marker.visible = false;
                trackMarkers.set(id, marker);
            }
        });

        chunkState.loadedStartFrame = startFrame;
        if (endFrame > chunkState.loadedEndFrame) chunkState.loadedEndFrame = endFrame;

        globalTrackFrames = Array.from(globalTrackData.keys()).sort((a, b) => a - b);

    } catch (e) {
        console.error("Failed to fetch chunk:", e);
    } finally {
        chunkState.isFetchingChunk = false;
    }
}

export function pruneOldFrames(beforeFrame) {
    for (let [keyFrame] of globalTrackData.entries()) {
        if (keyFrame < beforeFrame) {
            globalTrackData.delete(keyFrame);
        }
    }
    globalTrackFrames = Array.from(globalTrackData.keys()).sort((a, b) => a - b);
    chunkState.loadedStartFrame = beforeFrame;
}

export function renderFrame(index) {
    const uiElements = {
        uiOccupancy: document.getElementById('ui-iot-occupancy'),
        uiOccuHeader: document.getElementById('ui-iot-occu-header'),
        uiTemp: document.getElementById('ui-iot-temp'),
        uiAC: document.getElementById('ui-iot-ac'),
        uiLights: document.getElementById('ui-iot-lights'),
        uiDate: document.getElementById('ui-iot-date'),
        uiTime: document.getElementById('ui-iot-time'),
        uiName: document.getElementById('ui-room-name'),
        uiID: document.getElementById('ui-room-id'),
        uiFloor: document.getElementById('ui-room-floor'),
        uiCoords: document.getElementById('ui-coords')
    };

    const deptEl = document.getElementById('department');
    const department = deptEl ? deptEl.textContent.trim() : "Security";

    trackMarkers.forEach(m => m.visible = false);

    raycaster.setFromCamera(screenCenter, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane, intersectionPoint);
    const room = hit ? getRoom(intersectionPoint.x, intersectionPoint.z) : null;
    const roomInf = room ? roomInfo[room] : null;
    const seconds = Math.floor(playback.frame / FPS);
    let row = null;

    if (room && iot && iot[room] instanceof Map) {
        row = iot[room].get(seconds) || null;
    }

    if (roomInf) {
        if (uiElements.uiName) uiElements.uiName.innerText = roomInf.name;
        if (uiElements.uiID) uiElements.uiID.innerText = roomInf.room_id;
        if (uiElements.uiFloor) uiElements.uiFloor.innerText = roomInf.room_floor;
    } else {
        if (uiElements.uiName) uiElements.uiName.innerText = "--";
        if (uiElements.uiID) uiElements.uiID.innerText = "--";
        if (uiElements.uiFloor) uiElements.uiFloor.innerText = "--";
    }

    if (row) {
        if (department !== "Security") {
            if (uiElements.uiTemp) {
                const t = row.temperature;
                uiElements.uiTemp.innerText = t + "°C";
                if (t <= 20) uiElements.uiTemp.style.backgroundColor = "#0088ff";
                else if (t <= 22) uiElements.uiTemp.style.backgroundColor = "#00ffff";
                else if (t <= 28) uiElements.uiTemp.style.backgroundColor = "#00ff88";
                else if (t <= 30) uiElements.uiTemp.style.backgroundColor = "#ff8800";
                else uiElements.uiTemp.style.backgroundColor = "#f00";
            }
            if (uiElements.uiAC) {
                const ac = row.ac;
                uiElements.uiAC.innerText = ac ? "ON" : "OFF";
                uiElements.uiAC.style.backgroundColor = ac ? "#00ff88" : "#ff4444";
            }
            if (uiElements.uiLights) {
                const l = row.lights;
                uiElements.uiLights.innerText = l ? "ON" : "OFF";
                uiElements.uiLights.style.backgroundColor = l ? "#00ff88" : "#ff4444";
            }
        }

        if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
            const l = row.occupancy;
            if (department === "Facilities") {
                uiElements.uiOccuHeader.innerText = "Status: ";
                uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
                uiElements.uiOccupancy.style.backgroundColor = (l > 0) ? "#ff4444" : "#00ff88";
            } else {
                uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
                uiElements.uiOccupancy.innerText = l;
                uiElements.uiOccupancy.style.backgroundColor = (l > room.max_occupancy) ? "#ff4444" : (l === 0 ? "#fff" : "#00ff88");
            }
        }
    } else {
        if (uiElements.uiTemp) { uiElements.uiTemp.innerText = "--"; uiElements.uiTemp.style.backgroundColor = "#ffffff"; }
        if (uiElements.uiAC) { uiElements.uiAC.innerText = "--"; uiElements.uiAC.style.backgroundColor = "#ffffff"; }
        if (uiElements.uiLights) { uiElements.uiLights.innerText = "--"; uiElements.uiLights.style.backgroundColor = "#ffffff"; }
        if (uiElements.uiOccupancy) { uiElements.uiOccupancy.innerText = "--"; uiElements.uiOccupancy.style.backgroundColor = "#ffffff"; }
    }

    if (uiElements.uiDate) getDate(uiElements.uiDate);

    if (uiElements.uiTime) {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000);
        const secondsIntoCycle = nowSeconds % LOOP_DURATION;
        const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
        const frameTime = new Date(cycleStartTime.getTime() + seconds * 1000);
        uiElements.uiTime.innerText = frameTime.toLocaleTimeString();
    }

    // --- Alert tracking ---
    const currentSeconds = Math.floor(Date.now() / 1000);
    if (currentSeconds !== lastSecond) {
        lastSecond = currentSeconds;

        Object.keys(iot).forEach(roomId => {
            if (!iot[roomId] || !(iot[roomId] instanceof Map)) return;
            const row = iot[roomId].get(seconds);
            if (!row) return;

            const threshold = 120;
            const occuCount = row.occu !== undefined ? parseInt(row.occu) : parseInt(row.occupancy);
            const isAcOn = (row.ac === true || row.ac === "On" || row.ac === "ON");
            const isLightsOn = (row.lights === true || row.lights === "On" || row.lights === "ON");
            const currentTemp = parseFloat(row.temperature);

            if (occuCount === 0 && isAcOn) trackers.acWasted[roomId] = (trackers.acWasted[roomId] || 0) + 1;
            else trackers.acWasted[roomId] = 0;

            if (occuCount === 0 && isLightsOn) trackers.lightsWasted[roomId] = (trackers.lightsWasted[roomId] || 0) + 1;
            else trackers.lightsWasted[roomId] = 0;

            if (currentTemp > 28) trackers.tempWarm[roomId] = (trackers.tempWarm[roomId] || 0) + 1;
            else trackers.tempWarm[roomId] = 0;

            if (currentTemp < 22) trackers.tempCold[roomId] = (trackers.tempCold[roomId] || 0) + 1;
            else trackers.tempCold[roomId] = 0;

            const lastAlert = roomLastAlertTime[roomId] || 0;
            if (currentSeconds - lastAlert >= 120) {
                const activeAlerts = [];
                const descriptions = [];
                const formatTime = (totalSec) => {
                    const m = Math.floor(totalSec / 60);
                    const s = totalSec % 60;
                    return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
                };

                if (trackers.acWasted[roomId] >= threshold) {
                    activeAlerts.push("AC Being Wasted");
                    descriptions.push(`AC being wasted with zero occupancy for ${formatTime(trackers.acWasted[roomId])}.`);
                }
                if (trackers.lightsWasted[roomId] >= threshold) {
                    activeAlerts.push("Lights Being Wasted");
                    descriptions.push(`Lights being wasted with zero occupancy for ${formatTime(trackers.lightsWasted[roomId])}.`);
                }
                if (trackers.tempWarm[roomId] >= threshold) {
                    activeAlerts.push("Temperature Too Warm");
                    descriptions.push(`Temperature over 28°C (${currentTemp.toFixed(1)}°C) for ${formatTime(trackers.tempWarm[roomId])}.`);
                }
                if (trackers.tempCold[roomId] >= threshold) {
                    activeAlerts.push("Temperature Too Cold");
                    descriptions.push(`Temperature under 22°C (${currentTemp.toFixed(1)}°C) for ${formatTime(trackers.tempCold[roomId])}.`);
                }

                if (activeAlerts.length > 0) {
                    const combinedTitle = activeAlerts.join(" & ");
                    const combinedDesc = descriptions.join("\n \n");
                    sendFacilitiesAlert(roomId, combinedTitle, getTime(), combinedDesc);
                    roomLastAlertTime[roomId] = currentSeconds;
                }
            }
        });
    }

    const detections = globalTrackData.get(index) || [];
    const allmarkers = [];

    if (department !== "Facilities") {
        if (!playback.showHeatmap) {
            detections.forEach(d => {
                const marker = trackMarkers.get(d.id);
                if (marker) {
                    marker.position.x = d.z;
                    marker.position.z = d.x;
                    marker.visible = true;
                }
            });
        } else {
            detections.forEach(d => allmarkers.push(d));

            if (typeof window.heatmapThrottle === 'undefined') window.heatmapThrottle = 0;
            window.heatmapThrottle++;
            if (window.heatmapThrottle >= 5) {
                updateHeatmap(allmarkers);
                window.heatmapThrottle = 0;
            }
        }
    }
}

// --- Heatmap ---
let density = new Float32Array(80 * 80);
const smoothSigma = 4.0;
const radius = Math.ceil(3 * smoothSigma);
const weightCache = new Float32Array((radius * 2 + 1) * (radius * 2 + 1));
for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
        const w = Math.exp(-(dx * dx + dy * dy) / (2 * smoothSigma * smoothSigma));
        weightCache[(dy + radius) * (radius * 2 + 1) + (dx + radius)] = w;
    }
}

export function updateHeatmap(markers) {
    const gridCols = 80, gridRows = 80;
    const xMin = -8.75, xMax = 16.5;
    const zMin = -9, zMax = 9;

    const coolingFactor = 0.98;
    for (let i = 0; i < density.length; i++) density[i] *= coolingFactor;

    markers.forEach(marker => {
        const gx = Math.floor(((marker.x - xMin) / (xMax - xMin)) * gridCols);
        const gy = Math.floor(((marker.z - zMin) / (zMax - zMin)) * gridRows);
        if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
            density[gy * gridCols + gx] += 1;
        }
    });

    const smoothed = new Float32Array(gridCols * gridRows);
    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            let sum = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < gridCols && ny >= 0 && ny < gridRows) {
                        sum += density[ny * gridCols + nx] * weightCache[(dy + radius) * (radius * 2 + 1) + (dx + radius)];
                    }
                }
            }
            smoothed[y * gridCols + x] = sum;
        }
    }

    const densityCap = 120;
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
        let lo = colorStops[0], hi = colorStops[colorStops.length - 1];
        for (let i = 0; i < colorStops.length - 1; i++) {
            if (t >= colorStops[i].t && t <= colorStops[i + 1].t) { lo = colorStops[i]; hi = colorStops[i + 1]; break; }
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
            const densityValue = (d00 * (1 - fx) + d10 * fx) * (1 - fy) + (d01 * (1 - fx) + d11 * fx) * fy;
            const { r, g, b, a } = sampleColor(densityValue);
            const idx = (py * heatmapWidth + px) * 4;
            data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
        }
    }

    heatmapCtx.putImageData(imageData, 0, 0);
    heatmapTexture.needsUpdate = true;
}

export async function loadSimulationData(onLoadComplete, startFrame = 0) {
    globalTrackFrames = [];
    globalTrackData.clear();
    
    // Reset the bounds so the engine knows it's a fresh jump!
    chunkState.loadedStartFrame = startFrame;
    chunkState.loadedEndFrame = startFrame;
    chunkState.isFetchingChunk = false;

    // Fetch just the current chunk, strictly capped at the absolute maxFrame
    const endFrame = Math.min(startFrame + (FPS * 60), playback.maxFrames);
    await fetchChunk(startFrame, endFrame);

    if (onLoadComplete) onLoadComplete();
}