import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1117);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const aspect = window.innerWidth / window.innerHeight;
const d = 20;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  1,
  1000
);
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true;
controls.screenSpacePanning = true;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;

// Floor
const floorGeometry = new THREE.PlaneGeometry(12, 6);
const floorMaterial = new THREE.MeshBasicMaterial({
  color: 0x447c5a,
  side: THREE.DoubleSide,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Walls
const wallHeight = 2;
const wallMaterial = new THREE.MeshBasicMaterial({
  color: 0x999999,
  side: THREE.DoubleSide,
});

const wall1 = new THREE.Mesh(
  new THREE.PlaneGeometry(12, wallHeight),
  wallMaterial
);
wall1.position.y = wallHeight / 2;
wall1.position.z = -3;
scene.add(wall1);

const wall2 = new THREE.Mesh(
  new THREE.PlaneGeometry(12, wallHeight),
  wallMaterial
);
wall2.position.y = wallHeight / 2;
wall2.position.z = 3;
wall2.rotation.y = Math.PI;
scene.add(wall2);

const wall3 = new THREE.Mesh(
  new THREE.PlaneGeometry(6, wallHeight),
  wallMaterial
);
wall3.position.y = wallHeight / 2;
wall3.position.x = -6;
wall3.rotation.y = Math.PI / 2;
scene.add(wall3);

const wall4 = new THREE.Mesh(
  new THREE.PlaneGeometry(6, wallHeight),
  wallMaterial
);
wall4.position.y = wallHeight / 2;
wall4.position.x = 6;
wall4.rotation.y = -Math.PI / 2;
scene.add(wall4);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  const maxRotationY = Math.PI / 2;
  const minRotationY = -Math.PI / 2;

  floor.rotation.y = Math.max(
    minRotationY,
    Math.min(maxRotationY, floor.rotation.y)
  );

  renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Animate an avatar (THREE.Object3D) along a path described by either:
 *  - an array of positions: [{x,y,z}, ...]
 *  - a JSON with frames: { frames: [{ t: <seconds>, pos: {x,y,z} }, ... ], loop: true/false }
 *
 * Options:
 *  - durationPerSegment: number (seconds) used when path is simple array (default 1)
 *  - loop: boolean (default false)
 *  - lookAtMovement: boolean (default true) orient avatar toward motion
 *  - ease: (t) => easedT function (default linear)
 *
 * Returns a controller { stop() } to cancel the animation.
 */
function animateAvatar(avatar, pathOrJson, options = {}) {
  const opts = Object.assign(
    {
      durationPerSegment: 1,
      loop: false,
      lookAtMovement: true,
      ease: (t) => t, // linear
    },
    options
  );

  // Build frames: array of { t: secondsFromStart, pos: THREE.Vector3 }
  let frames = [];
  if (Array.isArray(pathOrJson)) {
    // simple coordinates array
    const arr = pathOrJson;
    const segDur = opts.durationPerSegment;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      frames.push({ t: i * segDur, pos: new THREE.Vector3(p.x, p.y, p.z) });
    }
  } else if (pathOrJson && Array.isArray(pathOrJson.frames)) {
    // JSON with explicit timestamps
    frames = pathOrJson.frames.map((f) => ({
      t: typeof f.t === "number" ? f.t : 0,
      pos: new THREE.Vector3(f.pos.x, f.pos.y, f.pos.z),
    }));
    // If t values are all zero or not strictly increasing, normalize them evenly
    const allZero = frames.every((f) => f.t === 0);
    if (allZero) {
      const segDur = opts.durationPerSegment;
      frames = frames.map((f, i) => ({ t: i * segDur, pos: f.pos }));
    }
  } else {
    throw new Error(
      "Path must be an array of coords or an object with frames[]"
    );
  }

  if (frames.length === 0) return { stop() {} };

  // Ensure frames are sorted by time
  frames.sort((a, b) => a.t - b.t);

  const totalDuration = frames[frames.length - 1].t;
  let running = true;
  let startTime = null;
  let lastSegmentIndex = 0;

  const tmpV = new THREE.Vector3();
  const startV = new THREE.Vector3();
  const endV = new THREE.Vector3();

  function step(now) {
    if (!running) return;
    if (!startTime) startTime = now;
    const elapsed = (now - startTime) / 1000; // seconds
    let t = elapsed;

    if (t >= totalDuration) {
      if (opts.loop) {
        // wrap time
        startTime = now;
        lastSegmentIndex = 0;
        requestAnimationFrame(step);
        return;
      } else {
        // place avatar at final frame and stop
        const last = frames[frames.length - 1];
        avatar.position.copy(last.pos);
        if (opts.lookAtMovement && frames.length >= 2) {
          const before = frames[frames.length - 2].pos;
          tmpV.copy(last.pos).sub(before).normalize();
          if (tmpV.lengthSq() > 0.0001)
            avatar.lookAt(last.pos.clone().add(tmpV));
        }
        return;
      }
    }

    // find segment index where frames[i].t <= t < frames[i+1].t
    let i = lastSegmentIndex;
    while (i < frames.length - 1 && !(frames[i].t <= t && t < frames[i + 1].t))
      i++;
    lastSegmentIndex = Math.max(0, Math.min(i, frames.length - 2));

    const a = frames[lastSegmentIndex];
    const b = frames[lastSegmentIndex + 1];
    const segDur = b.t - a.t;
    const localT = segDur === 0 ? 0 : (t - a.t) / segDur;
    const eased = opts.ease(Math.max(0, Math.min(1, localT)));

    startV.copy(a.pos);
    endV.copy(b.pos);
    tmpV.copy(startV).lerp(endV, eased);
    avatar.position.copy(tmpV);

    if (opts.lookAtMovement) {
      const dir = endV.clone().sub(startV);
      if (dir.lengthSq() > 1e-6) {
        // keep avatar upright: use direction's x,z only for lookAt
        const lookTarget = avatar.position
          .clone()
          .add(new THREE.Vector3(dir.x, 0, dir.z).normalize());
        avatar.lookAt(lookTarget);
      }
    }

    requestAnimationFrame(step);
  }

  const rafId = requestAnimationFrame(step);

  return {
    stop() {
      running = false;
      // no direct cancel for requestAnimationFrame without id; set running false to end loop
    },
  };
}

// --- Add: create some simple avatar meshes and call animateAvatar a few times ---
const makeAvatar = (color = 0xff0000, radius = 0.4) => {
  const mat = new THREE.MeshBasicMaterial({ color });
  const geo = new THREE.SphereGeometry(radius, 16, 12);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = radius; // sit on floor
  scene.add(m);
  return m;
};

// Avatar 1: simple path array (loops)
const avatar1 = makeAvatar(0xff5555);
animateAvatar(
  avatar1,
  [
    { x: -5, y: 0.4, z: -2 },
    { x: -1, y: 0.4, z: 2 },
    { x: 3, y: 0.4, z: -1 },
    { x: -5, y: 0.4, z: -2 }, // back to start
  ],
  { durationPerSegment: 1.2, loop: true, lookAtMovement: true }
);

// Avatar 2: explicit timestamped frames (no loop)
const avatar2 = makeAvatar(0x5599ff);
animateAvatar(avatar2, {
  frames: [
    { t: 0, pos: { x: 4, y: 0.4, z: 2 } },
    { t: 1.5, pos: { x: 2, y: 0.4, z: 0 } },
    { t: 3.0, pos: { x: 0, y: 0.4, z: -2 } },
    { t: 4.5, pos: { x: -2, y: 0.4, z: 0 } },
    { t: 6.0, pos: { x: 4, y: 0.4, z: 2 } }, // finish
  ],
  loop: false,
  lookAtMovement: true,
  ease: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t), // smooth ease in/out
});

// Avatar 3: square patrol (loop)
const avatar3 = makeAvatar(0x55ff88);
animateAvatar(
  avatar3,
  [
    { x: -2, y: 0.4, z: 1 },
    { x: 2, y: 0.4, z: 1 },
    { x: 2, y: 0.4, z: -1 },
    { x: -2, y: 0.4, z: -1 },
    { x: -2, y: 0.4, z: 1 },
  ],
  { durationPerSegment: 0.8, loop: true, lookAtMovement: true }
);

// Start the animation loop
animate();
