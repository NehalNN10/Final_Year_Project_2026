import * as THREE from "three";
import { scene } from "./scene.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export function createObject(z, x, rot, object){
    loader.load(
        object,
        function (gltf) {
            const model = gltf.scene;

            model.position.set(x, 0, z);
            model.scale.set(1, 1, 1); 
            model.rotation.y = rot; 

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
        }
    );
}

// const loader = new GLTFLoader();

// loader.load(
//     './files/model.glb', // 1. Path to your file
//     function (gltf) {
//         const model = gltf.scene;

//         // 2. Transform the model
//         model.position.set(0, 0.5, 0); // X, Y, Z
//         model.scale.set(1, 1, 1);      // Scale it if it's too big/small
//         model.rotation.y = Math.PI / 2; // Rotate if needed

//         // 3. Optional: Force the model to be bright (if lighting is still tricky)
//         model.traverse((child) => {
//             if (child.isMesh) {
//                 // Determine if you want shadows
//                 child.castShadow = true;
//                 child.receiveShadow = true;
//             }
//         });

//         scene.add(model);
//         console.log("Model loaded successfully!");
//     },
//     function (xhr) {
//         // Optional: Loading progress
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//     },
//     function (error) {
//         console.error('An error happened loading the model:', error);
//     }
// );

export const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x447c5a, side: THREE.DoubleSide }),
    wall: new THREE.MeshStandardMaterial({ color: 0x999999, side: THREE.DoubleSide }),
    wood: new THREE.MeshStandardMaterial({ color: 0x462416, side: THREE.DoubleSide }),
    white: new THREE.MeshStandardMaterial({ color: 0xffffffff, side: THREE.DoubleSide }),
    glass: new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }),
    pillar: new THREE.MeshStandardMaterial({ color: 0xd1b100, side: THREE.DoubleSide }),
    bench: new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide }),
    buggy: new THREE.MeshStandardMaterial({ color: 0x880000, side: THREE.DoubleSide })
};

export function createFloor(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    scene.add(mesh);
    return mesh
}

export const wallThickness = 0.15;
export const wallHeight = 2;

export function createWall(w, h, x, z, material) {
    const geo = new THREE.BoxGeometry(w, wallHeight, h);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, wallHeight/2, z);
    scene.add(mesh);
    return mesh;
}

export function createObject2(w, h, z, x, material) {
    const geo = new THREE.BoxGeometry(w, 0.5, h);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, 0.5/2, z);
    scene.add(mesh);
    return mesh;
}

export function createMarker(z, x, color, radius = 0.1, label = '') {
    const geom = new THREE.SphereGeometry(radius, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, radius, z);
    mesh.position.y= 0.5;

    let alpha = label === '' ? 0 : 0.15;

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    ctx.font = '100px League Spartan';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, size / 2, size / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const smat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(smat);
    sprite.scale.set(0.8, 0.4, 1);  
    sprite.position.set(x, radius + 0.4, z);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(sprite);
    scene.add(group);

    group.marker = mesh;
    group.label = sprite;
    return group;
}

export const models = {
    white_table: './models/table.glb',
    workbench: './models/workbench.glb',
    pillar: './models/pillar.glb',
    donut: './models/donut.glb',
}

export const worldObjects = {

    floor1: createFloor(14, 11.5, 3, 2, materials.floor),
    floor2: createFloor(18, 6, -5.75, 0, materials.floor),
    
    wallx1: createWall(wallThickness, 6.5, 9 + wallThickness/2, -5.5, materials.wall),
    doorx1: createWall(wallThickness, 1, 9 + wallThickness/2, -1.75, materials.wood),
    wallx2: createWall(wallThickness, 5.5, 9 + wallThickness/2, 1.5, materials.wall),
    doorx2: createWall(wallThickness, 1, 9 + wallThickness/2, 4.75, materials.wood),
    wallx3: createWall(wallThickness, 3.5, 9 + wallThickness/2, 7, materials.wall),

    wallx4: createWall(wallThickness, 6 + wallThickness, -9 - wallThickness/2, -5.75 + wallThickness/2, materials.wall),
    wallx5: createWall(wallThickness, 4, -5 - wallThickness/2, -0.75, materials.wall),
    doorx3: createWall(wallThickness, 1, -5 - wallThickness/2, 1.75, materials.glass),
    wallx6: createWall(wallThickness, 6.5, -5 - wallThickness/2, 5.5, materials.wall),

    wallz1: createWall(18 + wallThickness*2, wallThickness, 0, -8.75 - wallThickness/2, materials.wall),

    doorz1: createWall(4 - wallThickness, wallThickness, -7 - wallThickness/2, -2.75 + wallThickness/2, materials.glass),

    wallz2: createWall(2 + wallThickness, wallThickness, -4 - wallThickness/2, 8.75 + wallThickness/2, materials.wall),
    doorz2: createWall(5.5, wallThickness, -0.25, 8.75 + wallThickness/2,  materials.glass),
    wallz3: createWall(6.5 + wallThickness, wallThickness, 5.75 + wallThickness/2, 8.75 + wallThickness/2, materials.wall),

    pillar: createObject(1.75, 2.5, 0, models.pillar),
    table_p11: createObject(0.5, 2.5, Math.PI / 2, models.white_table),
    table_p12: createObject(-1, 2.5, Math.PI / 2, models.white_table),
    table_p13: createObject(-2.5, 2.5, Math.PI / 2, models.white_table),
    table_p21: createObject(4, 2.5, Math.PI / 2, models.white_table),
    table_p22: createObject(5.5, 2.5, Math.PI / 2, models.white_table),
    table_p23: createObject(7, 2.5, Math.PI / 2, models.white_table),

    table_v11: createObject(-4, 5.25, 0, models.white_table),
    table_v12: createObject(-4, 6.75, 0, models.white_table),
    table_v21: createObject(-1, 5.25, 0, models.white_table),
    table_v22: createObject(-1, 6.75, 0, models.white_table),
    table_v31: createObject(1.75, 5.25, 0, models.white_table),
    table_v32: createObject(1.75, 6.75, 0, models.white_table),
    table_v41: createObject(4.55, 5.25, 0, models.white_table),
    table_v42: createObject(4.55, 6.75, 0, models.white_table),
    table_v51: createObject(7.35, 5.25, 0, models.white_table),
    table_v52: createObject(7.35, 6.75, 0, models.white_table),

    workbench_v11: createObject(-2.285, -0.33, Math.PI / 2, models.workbench),
    workbench_v12: createObject(0.085, -0.33, Math.PI / 2, models.workbench),
    workbench_v13: createObject(-2.285, 0.57, -Math.PI / 2, models.workbench),
    workbench_v14: createObject(0.085, 0.57, -Math.PI / 2, models.workbench),
    workbench_v21: createObject(3.465, -0.33, Math.PI / 2, models.workbench),
    workbench_v22: createObject(5.835, -0.33, Math.PI / 2, models.workbench),
    workbench_v23: createObject(3.465, 0.57, -Math.PI / 2, models.workbench),
    workbench_v24: createObject(5.835, 0.57, -Math.PI / 2, models.workbench),
    workbench_v31: createObject(-2.285, -3.6, Math.PI / 2, models.workbench),
    workbench_v32: createObject(0.085, -3.6, Math.PI / 2, models.workbench),
    workbench_v33: createObject(-2.285, -2.7, -Math.PI / 2, models.workbench),
    workbench_v34: createObject(0.085, -2.7, -Math.PI / 2, models.workbench),
    workbench_v31: createObject(3.465, -3.6, Math.PI / 2, models.workbench),
    workbench_v32: createObject(5.835, -3.6, Math.PI / 2, models.workbench),
    workbench_v33: createObject(3.465, -2.7, -Math.PI / 2, models.workbench),
    workbench_v34: createObject(5.835, -2.7, -Math.PI / 2, models.workbench),
    // donut: createObject(-6, 4.5, 0, models.donut),

    shelf: createObject2(1.05, 0.6, -3.8, 0.3, materials.table),

    buggy: createObject2(1.8, 0.8, -8, -5, materials.buggy),
};