import { worldObjects } from "./assets/world.js";
import { renderFrame, playback, loadSimulationData } from "./assets/simulation.js";
import { setupGUI } from "./assets/ui.js";
import { scene, camera, renderer, controls } from "./assets/scene.js";

let frameController;
const guiRefs = setupGUI();
frameController = guiRefs.frameController;

loadSimulationData(() => {
    if (frameController) {
        frameController.max(playback.maxFrames);
        frameController.updateDisplay();
    }
});

function animate() {
    requestAnimationFrame(animate);

    if (playback.maxFrames > 0 && playback.playing) {
        playback.frame += (0.167 * playback.speed);
        
        if (playback.frame > playback.maxFrames) {
            playback.frame = 0;
        }
        
        renderFrame(Math.floor(playback.frame));
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate();