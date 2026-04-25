import * as THREE from "three";
import { scene } from "./scene.js";

export const materials = {
    floor: new THREE.MeshBasicMaterial({ color: 0x447c5a, side: THREE.DoubleSide }),
    floor2: new THREE.MeshBasicMaterial({ color: 0x928f83, side: THREE.DoubleSide }),
    wall: new THREE.MeshBasicMaterial({ color: 0xbbbbbb, side: THREE.DoubleSide }),
    wood: new THREE.MeshBasicMaterial({ color: 0x462416, side: THREE.DoubleSide }),
    glass: new THREE.MeshBasicMaterial({ color: 0xffffffff, side: THREE.DoubleSide }),
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

export function createWall(w, h, z, x, material) {
    const wallGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(wallGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    mesh.position.y = 0.00001;
    scene.add(mesh);
    return mesh
}

export function createObject(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z;
    mesh.position.x = x;
    mesh.position.y = 0.02;
    scene.add(mesh);
    return mesh
}

export function createMarker(z, x, color, radius = 0.1, label = '') {
    const geom = new THREE.CircleGeometry(radius, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, radius, z);
    mesh.position.y= 0.05;

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

export const wallThickness = 0.35;

export const worldObjects = {

    floor1 : createFloor(7.5, 4.25, 0, 3.75, materials.floor2),

    workbench_v1: createObject(2.375, 0.9, 4.25/2 -0.9/2, 7.5 - 0.4 - 2.375/2, materials.bench),
    workbench_v2: createObject(2.375, 0.9, 4.25/2 -0.9/2, 7.5 - 0.8 - 2.375*3/2, materials.bench),

    b_bench: createObject(1.3, 0.6, -4.25/2 +0.6/2, 2.4+ 1.3/2, materials.bench),
    w_bench: createObject(1.3, 0.8, -4.25/2 +0.8/2, 2.4+ 1.3*3/2 + 1.02, materials.glass),
    s_bench: createObject(0.8, 0.6, -4.25/2 +0.6/2, 2.4+ 1.3*2 + 1.02 + 0.8/2 + 0.25, materials.glass),

    wall_1: createObject(0.35, 4.6, -0.35/2, -0.35/2, materials.glass),
    wall_2: createObject(0.35, 4.6, -0.35/2, 7.5+0.35/2, materials.glass),
    wall_3: createObject(7.5, 0.35, -4.25/2 - 0.35/2, 7.5/2, materials.glass),
};