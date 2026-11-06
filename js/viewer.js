import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const FLOOR_H = 0.62;
const TOWER_W = 9;
const TOWER_D = 9;
const TOWER_GAP = 3.2;

/** Sample-unit colours echo the HDB brochure legend. */
const TYPE_COLORS = {
  '2RF-T1': '#f6b26b',
  '2RF-T2': '#e07b5f',
  '3R': '#9fc98a',
  '4R': '#f2d96b',
};

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

export function createViewer({ canvas, blocks = [], units = [], onSelect, onError }) {
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
  scene.fog = new THREE.Fog('#dce8f0', 120, 340);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 800);
  camera.position.set(54, 44, 68);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 18, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 26;
  controls.maxDistance = 200;

  scene.add(new THREE.HemisphereLight('#eaf4ff', '#b7c7a6', 0.9));
  const sun = new THREE.DirectionalLight('#fff2df', 1.5);
  sun.position.set(70, 110, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const shadowCam = sun.shadow.camera;
  shadowCam.left = -130;
  shadowCam.right = 130;
  shadowCam.top = 130;
  shadowCam.bottom = -130;
  shadowCam.far = 420;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(460, 460),
    new THREE.MeshStandardMaterial({ color: '#c9d6b8', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.12, 200),
    new THREE.MeshStandardMaterial({ color: '#cfc6b6', roughness: 1 })
  );
  path.position.set(0, 0.06, 42);
  path.receiveShadow = true;
  scene.add(path);

  [-46, -30, 30, 46].forEach((x, i) => addTree(scene, x, 26 + (i % 2) * 12, 1 + (i % 3) * 0.18));
  [-48, -32, 32, 48].forEach((x, i) => addTree(scene, x, -20 - (i % 2) * 10, 1.1 + (i % 2) * 0.2));

  // Six residential blocks with real storey counts (massing is indicative).
  const towerSpacing = TOWER_W + TOWER_GAP;
  const baseX = -((blocks.length - 1) * towerSpacing) / 2;
  const towerMaterial = new THREE.MeshStandardMaterial({ color: '#8d9aa8', roughness: 0.68, metalness: 0.08 });
  const finMaterial = new THREE.MeshStandardMaterial({ color: '#5c6b7a', roughness: 0.7, metalness: 0.1 });
  const terraceMaterial = new THREE.MeshStandardMaterial({ color: '#e8e2d2', roughness: 0.9 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: '#7fa267', roughness: 1 });

  blocks.forEach((block, index) => {
    const x = baseX + index * towerSpacing;
    const height = block.storeys * FLOOR_H;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W, height, TOWER_D), towerMaterial);
    tower.position.set(x, height / 2, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W * 0.45, height, TOWER_D + 0.5), finMaterial);
    fin.position.set(x, height / 2, 0);
    fin.castShadow = true;
    scene.add(fin);

    for (const storey of block.skyTerraces || []) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 1.4, 0.5, TOWER_D + 1.4), terraceMaterial);
      slab.position.set(x, storey * FLOOR_H, 0);
      slab.castShadow = true;
      scene.add(slab);
    }

    if (block.roofGarden) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 1.2, 0.7, TOWER_D + 1.2), roofMaterial);
      roof.position.set(x, height + 0.35, 0);
      roof.castShadow = true;
      scene.add(roof);
    }
  });

  // Clickable flat-type sample units, placed on blocks where they really exist.
  const meshes = [];
  const byId = new Map();
  const baseColors = new Map();
  for (const unit of units) {
    const blockId = unit.grid && unit.grid.block;
    const blockIndex = Math.max(0, blocks.findIndex((b) => b.id === blockId));
    const x = baseX + blockIndex * towerSpacing;
    const y = (unit.grid && unit.grid.floor ? unit.grid.floor : 10) * FLOOR_H;
    const color = TYPE_COLORS[unit.id] || '#f6b26b';
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 1, 2.2, TOWER_D + 1), material);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    mesh.userData.unitId = unit.id;
    scene.add(mesh);
    meshes.push(mesh);
    byId.set(unit.id, { mesh, unit });
    baseColors.set(unit.id, color);
  }

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
