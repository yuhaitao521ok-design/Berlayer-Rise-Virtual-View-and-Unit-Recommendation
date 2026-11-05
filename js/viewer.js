import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const UNIT_W = 6;
const UNIT_H = 3;
const UNIT_D = 7;
const COL_GAP = 1.4;

function baseColor(unit) {
  const palette = ['#e9d7bd', '#f0e3cd', '#f5ecdd'];
  return palette[unit.floor % palette.length];
}

function addTree(scene, x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 2.2 * scale, 8),
    new THREE.MeshStandardMaterial({ color: '#8a6b4f', roughness: 1 })
  );
  trunk.position.set(x, 1.1 * scale, z);
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.9 * scale, 3.8 * scale, 10),
    new THREE.MeshStandardMaterial({ color: '#7fa267', roughness: 1 })
  );
  leaves.position.set(x, 3.5 * scale, z);
  leaves.castShadow = true;
  scene.add(trunk, leaves);
}

export function createViewer({ canvas, units, onSelect, onError }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error);
    }
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce8f0');
  scene.fog = new THREE.Fog('#dce8f0', 70, 190);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  camera.position.set(27, 19, 31);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 6, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 14;
  controls.maxDistance = 110;

  scene.add(new THREE.HemisphereLight('#eaf4ff', '#b7c7a6', 0.9));
  const sun = new THREE.DirectionalLight('#fff2df', 1.5);
  sun.position.set(32, 46, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const shadowCam = sun.shadow.camera;
  shadowCam.left = -50;
  shadowCam.right = 50;
  shadowCam.top = 50;
  shadowCam.bottom = -50;
  shadowCam.far = 160;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: '#c9d6b8', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.12, 120),
    new THREE.MeshStandardMaterial({ color: '#cfc6b6', roughness: 1 })
  );
  path.position.set(0, 0.06, 18);
  path.receiveShadow = true;
  scene.add(path);

  [-24, -16, 16, 24].forEach((x, i) => addTree(scene, x, 10 + (i % 2) * 8, 1 + (i % 3) * 0.18));
  [-26, -18, 18, 26].forEach((x, i) => addTree(scene, x, -10 - (i % 2) * 6, 1.1 + (i % 2) * 0.2));
  const meshes = [];
  const byId = new Map();
  const baseColors = new Map();
  for (const unit of units) {
    const grid = unit.grid || { col: 0, floor: 0 };
    const x = (grid.col - 1.5) * (UNIT_W + COL_GAP);
    const y = grid.floor * UNIT_H + UNIT_H / 2 + 0.25;
    const material = new THREE.MeshStandardMaterial({
      color: baseColor(unit),
      roughness: 0.72,
      metalness: 0.04,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(UNIT_W, UNIT_H, UNIT_D), material);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.unitId = unit.id;
    scene.add(mesh);
    meshes.push(mesh);
    byId.set(unit.id, { mesh, unit });
    baseColors.set(unit.id, material.color.getHex());

    if (unit.tags.some((tag) => ['balcony', 'terrace', 'garden'].includes(tag))) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(UNIT_W * 0.8, 0.18, 1.6),
        new THREE.MeshStandardMaterial({ color: '#d8c9ae', roughness: 0.9 })
      );
      slab.position.set(x, y - UNIT_H / 2 + 0.12, UNIT_D / 2 + 0.8);
      slab.castShadow = true;
      scene.add(slab);
    }
  }

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(UNIT_W * 4 + COL_GAP * 3 + 1.2, 0.5, UNIT_D + 1.2),
    new THREE.MeshStandardMaterial({ color: '#b9a98e', roughness: 0.9 })
  );
  roof.position.set(0, 3 * UNIT_H + 0.75, 0);
  roof.castShadow = true;
  scene.add(roof);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.3, 4),
    new THREE.MeshStandardMaterial({ color: '#1f4e63', roughness: 0.6 })
  );
  canopy.position.set(0, 3.2, UNIT_D / 2 + 2.6);
  canopy.castShadow = true;
  scene.add(canopy);

  let selectedId = null;
  function highlight(unitId) {
    for (const [id, entry] of byId) {
      const selected = id === unitId;
      entry.mesh.material.color.set(selected ? '#ffb26b' : baseColors.get(id));
      entry.mesh.material.emissive.set(selected ? '#7a3b00' : '#000000');
      entry.mesh.material.emissiveIntensity = selected ? 0.55 : 0;
      entry.mesh.scale.setScalar(selected ? 1.05 : 1);
    }
    selectedId = unitId;
  }

  function focus(unitId) {
    const entry = byId.get(unitId);
    if (!entry) return;
    controls.target.copy(entry.mesh.position);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!down) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved > 6) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0 && typeof onSelect === 'function') {
      onSelect(hits[0].object.userData.unitId);
    }
  });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let frame = 0;
  const tick = () => {
    frame = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  };
  tick();

  return {
    highlight,
    focus,
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
    },
  };
}
