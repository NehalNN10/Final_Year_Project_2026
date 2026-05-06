import { initVariables } from './variables.js';
import { initScene, scene, camera, renderer, controls, setupHeatmap, composer } from './scene.js';
import { loadAssets, buildStaticWorld} from './world.js';
import { loadSimulationData, renderFrame, playback, chunkState, fetchChunk, pruneOldFrames } from './simulation.js';
import { FPS, LOOP_DURATION, fetchIotChunk, pruneOldIotFrames, iotState, resetIotBuffer } from './variables.js';
import next from 'next';

let animationFrameId;
let lastTime = 0;
let lastRenderedFrame = -1;
let currentContainer = null;

let isScrubBuffering = false;

function getLiveFrame() {
    const now = Date.now() / 1000;
    const currentLoopSeconds = now % LOOP_DURATION;
    return currentLoopSeconds * FPS;
}

function animate(t = 0) {
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

    const dt = (t - lastTime) / 1000;
    lastTime = t;

    // If we are executing a massive Scrub wipe, freeze the simulation logic 
    // but SKIP to the bottom so the camera still moves!
    if (!isScrubBuffering && playback.maxFrames > 0) {
        
        const liveEl = document.getElementById('live');
        const LIVE_MODE = liveEl ? liveEl.textContent.trim() === 'true' : false;

        if (LIVE_MODE) {
            const targetFrame = getLiveFrame();
            if (targetFrame > playback.maxFrames) playback.frame = playback.maxFrames;
            else playback.frame = targetFrame;
            playback.playing = true;
        } 
        
        const currentFrameIdx = Math.floor(playback.frame);
        const currentSecond = Math.floor(currentFrameIdx / FPS);

        const framesRemaining = chunkState.loadedEndFrame - currentFrameIdx;
        if (framesRemaining < 500 && !chunkState.isFetchingChunk) {
            const nextStart = Math.max(chunkState.loadedEndFrame + 1, currentFrameIdx);
            const nextEnd = Math.min(nextStart + (FPS * 60), playback.maxFrames); // Cap at max
            
            if (nextStart < playback.maxFrames) fetchChunk(nextStart, nextEnd);
        }

        const iotSecondsRemaining = iotState.loadedEnd - currentSecond;
        const maxSeconds = playback.maxFrames / FPS;

        if (iotSecondsRemaining < 30 && !iotState.isFetching) {
            const nextStart = iotState.loadedEnd;
            const nextEnd = Math.min(nextStart + 60, maxSeconds); // Cap at max
            
            if (nextStart < maxSeconds) fetchIotChunk(nextStart, nextEnd);
        }

        // --- 2. DETECT STATE ---
        const playheadDelta = Math.abs(currentFrameIdx - lastRenderedFrame);
        const isScrub = playheadDelta > 10 && lastRenderedFrame !== -1;

        const isTrackMissing = currentFrameIdx < chunkState.loadedStartFrame || currentFrameIdx >= chunkState.loadedEndFrame;
        const isIotMissing = currentSecond < iotState.loadedStart || currentSecond >= iotState.loadedEnd;

        // --- 3. EXECUTE STATE ---
        if (isScrub && (isTrackMissing || isIotMissing) && chunkState.loadedEndFrame > 0) {
            
            // STATE A: THE SCRUB JUMP (Also naturally handles the video looping to 0!)
            console.log(`Scrub jump detected to frame ${currentFrameIdx}! Re-buffering...`);
            isScrubBuffering = true;
            Promise.all([
                isTrackMissing ? loadSimulationData(null, currentFrameIdx) : Promise.resolve(),
                isIotMissing ? resetIotBuffer(currentSecond) : Promise.resolve()
            ]).then(() => isScrubBuffering = false);

        } else if (isTrackMissing || isIotMissing) {
            // STATE B: NATURAL BUFFER PAUSE
            // Do nothing until data drops in.
        } else {
            // STATE C: WE HAVE DATA! RENDER AND ADVANCE!
            renderFrame(currentFrameIdx);
            
            // 🚨 RELAXED PRUNING: Keep 60 seconds of history so you can scrub backward safely!
            const cleanupThreshold = currentFrameIdx - (FPS * 60);
            if (cleanupThreshold > chunkState.loadedStartFrame) pruneOldFrames(cleanupThreshold);

            const iotCleanupThreshold = currentSecond - 60;
            if (iotCleanupThreshold > iotState.loadedStart) pruneOldIotFrames(iotCleanupThreshold);

            // Advance the Playhead
            if (playback.playing && !LIVE_MODE) {
                playback.frame += dt * FPS * playback.speed;
                if (playback.frame > playback.maxFrames) playback.frame = 0; // The natural loop reset!
            }

            // Sync the UI Scrubber
            if (currentFrameIdx !== lastRenderedFrame) {
                lastRenderedFrame = currentFrameIdx;
                
                const currentSecondStr = (currentFrameIdx / FPS).toFixed(2);
                const scrubber = document.getElementById('frame-scrubber');
                if (scrubber && !scrubber.matches(':active')) scrubber.value = currentSecondStr;
                
                const scrubText = document.getElementById('frame-scrubber-text');
                if (scrubText && document.activeElement !== scrubText) scrubText.value = currentSecondStr;
            }
        }
    }
    
    // --- ALWAYS RENDER THE CAMERA ---
    // (This keeps the 3D world interactive even when paused/buffering!)
    if (controls) controls.update();
    if (renderer && scene && camera) composer.render(scene, camera);
}

export async function initThreeEngine(container) {
    currentContainer = container; 

    window.playback = playback;
    
    playback.maxFrames = FPS * LOOP_DURATION;
    playback.playing = true;
    playback.speed = 1;
    lastRenderedFrame = -1;
    
    initScene(container);
    
    if (renderer) {
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
    }

    // --- 1. DETERMINE LIVE MODE & INITIAL POSITION ---
    const liveEl = document.getElementById('live');
    const LIVE_MODE = liveEl ? liveEl.textContent.trim() === 'true' : false;

    let initialSecond = LIVE_MODE ? Math.floor((Date.now() / 1000) % LOOP_DURATION) : 0;

    // --- 2. REPLAY URL LOGIC ---
    if (!LIVE_MODE) {
        const urlParams = new URLSearchParams(window.location.search);
        
        const startSecondParam = urlParams.get('start'); 
        const endSecondParam = urlParams.get('end');
        const frameParam = urlParams.get('frame'); 

        if (startSecondParam) {
            initialSecond = parseInt(startSecondParam, 10);
            playback.playing = true; 
            
            if (endSecondParam) {
                playback.maxFrames = parseInt(endSecondParam, 10) * FPS; 
            }
        } else if (frameParam) {
            initialSecond = Math.floor(parseInt(frameParam, 10) / FPS);
            playback.maxFrames = parseInt(frameParam, 10); 
            playback.playing = false; // Start paused
        }
    }

    const initialFrame = initialSecond * FPS;
    playback.frame = initialFrame;

    console.log("LIVE_MODE:", LIVE_MODE, "| initialSecond:", initialSecond, "| initialFrame:", initialFrame);

    // --- 3. PRE-LOAD DATA (USING initialSecond!) ---
    await initVariables(initialSecond);

    try {
        await loadAssets();
        console.log("Assets ready. Building world...");
        buildStaticWorld(); 
        setupHeatmap(playback.showHeatmap);
    } catch (err) {
        console.error("Critical Error loading assets:", err);
    }

    await loadSimulationData(() => {
        const scrubber = document.getElementById('frame-scrubber');
        if (scrubber) {
            scrubber.max = (playback.maxFrames / FPS).toFixed(2); 
            scrubber.value = (playback.frame / FPS).toFixed(2);
        }
        const scrubText = document.getElementById('frame-scrubber-text');
        if (scrubText) {
            scrubText.value = (playback.frame / FPS).toFixed(2);
        }
    }, initialFrame); // <-- Pass the initial frame here so the buffer starts downloading from the right spot!

    // --- 4. START ENGINE ---
    animate();
}

export function destroyThreeEngine() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    currentContainer = null;
    
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        const dom = renderer.domElement;
        if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
    }
}