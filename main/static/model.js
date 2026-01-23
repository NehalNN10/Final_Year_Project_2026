// Import the new functions from world.js
import { loadAssets, buildWorld } from "./assets/world.js";
import { renderFrame, playback, loadSimulationData } from "./assets/simulation.js";
import { setupGUI } from "./assets/ui.js";
import { scene, camera, renderer, controls } from "./assets/scene.js";

let frameController;
const guiRefs = setupGUI();
frameController = guiRefs.frameController;

const SIMULATION_FPS = 10;
let lastTime = 0;

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

// Mode Logic
const liveMode = document.getElementById('live') ? document.getElementById('live').textContent.trim() : 'false';
const LIVE_MODE = liveMode === 'true'; 
const LOOP_DURATION_SECONDS = 120; 

if (LIVE_MODE) {
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            const currentFrame = Math.floor(playback.frame);
            window.location.href = `/model_replay?frame=${currentFrame}`;
        });
    }
} else {
    // Replay Mode Setup
    const urlParams = new URLSearchParams(window.location.search);
    const startFrame = urlParams.get('frame');
    if (startFrame) {
        playback.frame = parseInt(startFrame, 10);
        playback.maxFrames = playback.frame;
        playback.playing = false; 
        if (frameController) frameController.updateDisplay();
        renderFrame(playback.frame);
    }
}

// --- INITIALIZATION CHAIN ---
// 1. Load Simulation Data (CSV)
loadSimulationData(() => {
    if (frameController) {
        frameController.max(playback.maxFrames);
        frameController.updateDisplay();
    }
});

// 2. Load 3D Assets -> Then Build World -> Then Start Animate
loadAssets().then(() => {
    console.log("Assets ready. Building world...");
    buildWorld(); // Creates the tables/walls using the loaded assets
    animate();    // Start the loop
}).catch(err => {
    console.error("Critical Error loading assets:", err);
});

// --- ANIMATION LOOP ---
let lastRenderedFrame = -1;

function getLiveFrame() {
    const now = Date.now() / 1000;
    const currentLoopSeconds = now % LOOP_DURATION_SECONDS;
    return currentLoopSeconds * SIMULATION_FPS;
}

function animate(t = 0) {
    requestAnimationFrame(animate);
    
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    if (playback.maxFrames > 0) {
        if (LIVE_MODE) {
            const targetFrame = getLiveFrame();
            if (targetFrame > playback.maxFrames) playback.frame = playback.maxFrames;
            else playback.frame = targetFrame;
            playback.playing = true;
        } else if (playback.playing) {
            playback.frame += dt * SIMULATION_FPS * playback.speed;
            if (playback.frame > playback.maxFrames) playback.frame = 0;
        }
        
        const currentFrameIdx = Math.floor(playback.frame);
        if (currentFrameIdx !== lastRenderedFrame) {
            renderFrame(currentFrameIdx);
            lastRenderedFrame = currentFrameIdx;
            if (frameController) frameController.updateDisplay();
        }
    }
    controls.update();
    renderer.render(scene, camera);
}