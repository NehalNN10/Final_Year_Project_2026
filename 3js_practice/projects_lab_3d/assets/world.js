import * as THREE from "three";
import { scene } from "./scene.js";

export const materials = {
    floor: new THREE.MeshBasicMaterial({ color: 0x447c5a, side: THREE.DoubleSide }),
    wall: new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide }),
    wood: new THREE.MeshBasicMaterial({ color: 0x462416, side: THREE.DoubleSide }),
    white: new THREE.MeshBasicMaterial({ color: 0xffffffff, side: THREE.DoubleSide }),
    glass: new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }),
    pillar: new THREE.MeshBasicMaterial({ color: 0xd1b100, side: THREE.DoubleSide }),
    bench: new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
    buggy: new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.DoubleSide })
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

export const wallThickness = 0.35;
export const wallHeight = 2;

export function createWall(w, h, x, z, material) {
    const geo = new THREE.BoxGeometry(w, wallHeight, h);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, wallHeight/2, z);
    scene.add(mesh);
    return mesh;
}

export function createObject(w, h, z, x, material) {
    const geo = new THREE.BoxGeometry(w, 1, h);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, 1/2, z);
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

    pillar: createWall(1, 1, 1.75, 2.5, materials.pillar),
    table_p1: createObject(1, 4.5, -1, 2.5, materials.white),
    table_p2: createObject(1, 4.5, 5.5, 2.5, materials.white),

    table_v1: createObject(3, 1, -4, 6, materials.white),
    table_v2: createObject(3, 1, -1, 6, materials.white),
    table_v3: createObject(3, 1, 1.75, 6, materials.white),
    table_v4: createObject(3, 1, 4.55, 6, materials.white),
    table_v5: createObject(3, 1, 7.35, 6, materials.white),

    workbench_v1: createObject(1.8, 4.75, -1.1, 0.12, materials.bench),
    workbench_v2: createObject(1.8, 4.75, 4.65, 0.12, materials.bench),
    workbench_v3: createObject(1.8, 4.75, -1.1, -3.15, materials.bench),
    workbench_v4: createObject(1.8, 4.75, 4.65, -3.15, materials.bench),

    shelf: createObject(1.05, 0.6, -3.8, 0.3, materials.table),

    buggy: createObject(1.8, 0.8, -8, -5, materials.buggy),
};