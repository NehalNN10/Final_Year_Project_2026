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

function animate(t = 0) {
    requestAnimationFrame(animate);
    
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    if (playback.maxFrames > 0 && playback.playing) {
        playback.frame += dt * SIMULATION_FPS * playback.speed;
        
        if (playback.frame > playback.maxFrames) {
            playback.frame = 0;
        }
        
        renderFrame(Math.floor(playback.frame));

        if (frameController) frameController.updateDisplay();
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();