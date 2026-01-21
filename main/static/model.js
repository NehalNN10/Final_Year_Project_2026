import { worldObjects } from "./assets/world.js";
import { renderFrame, playback, loadSimulationData } from "./assets/simulation.js";
import { setupGUI } from "./assets/ui.js";
import { scene, camera, renderer, controls } from "./assets/scene.js";

let frameController;
const guiRefs = setupGUI();
frameController = guiRefs.frameController;

// 1. Define how many simulation frames should play per second
const SIMULATION_FPS = 10;
let lastTime = 0;

const container = document.getElementById('model-container');

// 2. Attach the renderer to it
if (container) {
    container.appendChild(renderer.domElement);
} else {
    console.error("Missing #canvas-container in HTML");
}

// 3. Smart Resizing (Handles window resize AND flex layout changes)
const resizeObserver = new ResizeObserver(() => {
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Only update if dimensions are valid
    if (width > 0 && height > 0) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
});

// Start watching the container
resizeObserver.observe(container);

loadSimulationData(() => {
    if (frameController) {
        frameController.max(playback.maxFrames);
        frameController.updateDisplay();
    }
});

const uiBoxes = document.querySelectorAll('.tracker-ui');

uiBoxes.forEach(box => {
    const header = box.querySelector('h3');
    if (header) {
        header.addEventListener('click', () => {
            // Toggle the class on the PARENT container
            box.classList.toggle('collapsed');
        });
    }
});

const START_HOUR = 0;
const START_MIN = 0;
const START_SEC = 0;

const liveMode = document.getElementById('live').textContent.trim();
const LIVE_MODE = liveMode === 'true'; 
const LOOP_DURATION_SECONDS = 120; // Loops every 2 minutes

if (LIVE_MODE) {
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            // Get current frame
            const currentFrame = Math.floor(playback.frame);
            // Go to replay page with frame number in URL
            window.location.href = `/model_replay?frame=${currentFrame}`;
        });
    }
}

if (!LIVE_MODE) {
    // Check if there is a frame number in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const startFrame = urlParams.get('frame');

    if (startFrame) {
        // Set the simulation to that specific frame
        playback.frame = parseInt(startFrame, 10);

        playback.maxFrames = playback.frame;
        
        // PAUSE immediately so the user can see that exact moment
        playback.playing = false; 

        // Update the GUI Slider (if it loaded)
        if (frameController) {
            frameController.updateDisplay();
        }
    
        renderFrame(playback.frame);
    }
}

let lastRenderedFrame = -1;

function getLiveFrame() {
    // 1. Get current time in seconds
    const now = Date.now() / 1000;

    // 2. Calculate where we are in the 120-second loop
    // e.g., if it's 12:00:10 PM, result is 10.
    const currentLoopSeconds = now % LOOP_DURATION_SECONDS;

    // 3. Convert to Frame Number
    return currentLoopSeconds * SIMULATION_FPS;
}

function animate(t = 0) {
    requestAnimationFrame(animate);
    
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    if (playback.maxFrames > 0) {
        
        if (LIVE_MODE) {
            // --- LIVE LOOP MODE ---
            const targetFrame = getLiveFrame();
            
            // Safety: Don't go beyond the model's actual data length
            // (e.g., if model only has 60s of data but loop is 120s, hold at end)
            if (targetFrame > playback.maxFrames) {
                playback.frame = playback.maxFrames;
            } else {
                playback.frame = targetFrame;
            }
            
            playback.playing = true;

        } else if (playback.playing) {
            // --- MANUAL MODE ---
            playback.frame += dt * SIMULATION_FPS * playback.speed;
            if (playback.frame > playback.maxFrames) {
                playback.frame = 0;
            }
        }
        
        // --- RENDERING ---
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

animate();