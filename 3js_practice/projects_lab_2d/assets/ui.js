import * as THREE from "three";
import { camera, controls, scene } from "./scene.js";
import { materials, worldObjects } from "./world.js";
import { playback, renderFrame } from "./simulation.js";

const gui = new dat.GUI({ autoPlace: false }); 

const container = document.getElementById('gui-container');
if (container) {
    container.appendChild(gui.domElement);
}

export const params = {
    x: 0,
    z: 0,
    y: 20,
    rotation: 0, 
    darkMode: true
};

export function setupGUI(frameUpdateCallback) {
    const camFolder = gui.addFolder('Camera Controls');

    const updateLabel = (controller, newText) => {
        if (!controller) return;
        controller.name(newText);
        const dom = controller.domElement.parentElement.querySelector('.property-name');
        if (dom) dom.innerText = newText;
    };

    const updateButtonColor = (controller, bg, text) => {
        if (!controller) return;
        const dom = controller.domElement.parentElement.querySelector('.property-name');
        if (dom) {
            dom.style.setProperty('background-color', bg, 'important');
            dom.style.setProperty('color', text, 'important');
        }
    };

    let playBtn;
    let darkMode;

    const funcs = { 
        rewind: () => { playback.frame -= 50; if(playback.frame < 0) playback.frame = 0; },
        ff: () => { playback.frame += 50; },
        play: () => { 
            playback.playing = !playback.playing; 
            const label = playback.playing ? "Pause" : "Play";
            updateLabel(playBtn, label);
        },
        reset: () => { playback.frame = 0; playback.speed = 1; },
        dark: () => {
            params.darkMode = !params.darkMode;
            
            // 1. Scene Changes
            scene.background = new THREE.Color(params.darkMode ? 0x131314 : 0xffffff);
            const doorMat = params.darkMode ? materials.glass : materials.bench; 
            if(worldObjects.doorx3) worldObjects.doorx3.material = doorMat;
            if(worldObjects.doorz1) worldObjects.doorz1.material = doorMat;
            if(worldObjects.doorz2) worldObjects.doorz2.material = doorMat;

            // 2. UI Text Change
            const label = params.darkMode ? "Light Mode" : "Dark Mode";
            updateLabel(darkMode, label);

            // 3. UI Color Change
            if (!params.darkMode) {
                // Active Light Mode -> Make Button White
                updateButtonColor(darkMode, '#ffffff', '#000000');
            } else {
                // Active Dark Mode -> Make Button Dark
                updateButtonColor(darkMode, '#222222', '#ffffff');
            }
        },
        resetView: () => { 
            params.x = 0; 
            params.z = 0; 
            params.rotation = 0; 
            camera.position.set(0, 20, 0.1); 
            camera.lookAt(0, 0, 0); 
            controls.target.set(0, 0, 0);
        }
    };

    const rotate = camFolder.add(params, 'rotation', -Math.PI, Math.PI, 0.1)
        .name("Rotate View")
        .listen()
        .onChange((angle) => {
            const dx = camera.position.x - controls.target.x;
            const dz = camera.position.z - controls.target.z;
            const radius = Math.sqrt(dx * dx + dz * dz);
            camera.position.x = controls.target.x + radius * Math.sin(angle);
            camera.position.z = controls.target.z + radius * Math.cos(angle);
            controls.update();
        });

    const posX = camFolder.add(params, 'x', -50, 50, 0.1).name("Position X").listen().onChange((val) => {
        const delta = val - controls.target.x;
        controls.target.x = val;
        camera.position.x += delta;
    });

    const posZ = camFolder.add(params, 'z', -50, 50, 0.1).name("Position Z").listen().onChange((val) => {
        const delta = val - controls.target.z;
        controls.target.z = val;
        camera.position.z += delta;
    });

    const resetCam = camFolder.add(funcs, 'resetView').name("Reset Camera");

    darkMode = camFolder.add(funcs, 'dark').name("Dark Mode");

    const resetBtn = resetCam.domElement.parentNode.parentNode;
    const darkBtn = darkMode.domElement.parentNode.parentNode;

    const setSideBySideCam = (row) => {
        row.style.width = "50%";
        row.style.float = "left";
        row.style.clear = "none"; 
        row.style.boxSizing = "border-box"; 
        row.style.borderLeft = "none";  
        row.style.textAlign = "center";
        row.style.alignItems = "center";
        row.style.justifyContent = "center";
    };

    setSideBySideCam(resetBtn);
    setSideBySideCam(darkBtn);
    
    const frameController = camFolder.add(playback, 'frame', 0, 100, 1)
        .name("Scrubber")
        .listen()
        .onChange((val) => {
            renderFrame(Math.floor(val));
        });

    const rwBtn = camFolder.add(funcs, 'rewind').name("<< -50");
    playBtn = camFolder.add(funcs, 'play').name("Pause");
    const ffBtn = camFolder.add(funcs, 'ff').name("+50 >>");
    
    const rwRow = rwBtn.domElement.parentNode.parentNode;
    const ffRow = ffBtn.domElement.parentNode.parentNode;
    const playRow = playBtn.domElement.parentNode.parentNode;

    const setSideBySideAnim = (row) => {
        row.style.width = "33.3%";
        row.style.float = "left";
        row.style.clear = "none"; 
        row.style.boxSizing = "border-box"; 
        row.style.borderLeft = "none";  
        row.style.textAlign = "center";
        row.style.alignItems = "center";
        row.style.justifyContent = "center";
    };

    setSideBySideAnim(rwRow);
    setSideBySideAnim(playRow);
    setSideBySideAnim(ffRow);

    const speed = camFolder.add(playback, 'speed', 0.1, 5, 0.1).name("Speed").listen();
    const resetPlay = camFolder.add(funcs, 'reset').name("Reset Playback");
    
    camFolder.open();

    return { frameController };
}