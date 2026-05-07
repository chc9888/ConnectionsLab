// cabinet.js — loads GLB models into each card viewer
// Uses Three.js via importmap (defined in cabinet.html)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Config ──────────────────────────────────────────────
const TOTAL_OBJECTS = 6;

// ─── State ───────────────────────────────────────────────
const inspected = new Set();

// ─── Init all cards ──────────────────────────────────────
const cards = document.querySelectorAll('.object-card');
const progressLabel = document.getElementById('progress-label');
const verdictCta = document.getElementById('verdict-cta');

cards.forEach(card => {
  const id = card.dataset.id;
  const viewerEl = document.getElementById(`viewer-${id}`);

  if (!viewerEl) {
    console.warn(`No viewer element found for data-id="${id}". Make sure id="viewer-${id}" exists.`);
    return;
  }

  setupViewer(viewerEl, id, card);

  viewerEl.addEventListener('mousedown', () => markInspected(card, id));
  viewerEl.addEventListener('touchstart', () => markInspected(card, id), { passive: true });
});

function markInspected(card, id) {
  if (inspected.has(id)) return;
  inspected.add(id);
  card.classList.add('inspected');

  const badge = card.querySelector('.card-badge');
  if (badge) badge.textContent = 'inspected ✓';

  progressLabel.textContent = `${inspected.size} / ${TOTAL_OBJECTS} inspected`;

  if (inspected.size >= TOTAL_OBJECTS) {
    verdictCta.classList.remove('hidden');
    verdictCta.scrollIntoView({ behavior: 'smooth' });
  }
}

// ─── Three.js viewer setup ───────────────────────────────
function setupViewer(container, modelId, card) {
  const width = container.clientWidth || 280;
  const height = container.clientHeight || 240;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMappingExposure = 1.8;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.set(0, 0.5, 2);

  // ─── Lights (bright, even coverage) ──────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 3.0);
  scene.add(ambient);

  const frontLight = new THREE.DirectionalLight(0xffffff, 3.0);
  frontLight.position.set(0, 2, 4);
  scene.add(frontLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
  fillLight.position.set(-3, 1, 1);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
  backLight.position.set(0, -2, -3);
  scene.add(backLight);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;

  // ─── Load GLB ────────────────────────────────────────
  const loader = new GLTFLoader();
  loader.load(
    `models/${modelId}.glb`,
    (gltf) => {
      const model = gltf.scene;

      // 1. Apply rotation FIRST (before bounding box calculation)
      const rotX = parseFloat(card.dataset.rotationX || 0);
      const rotY = parseFloat(card.dataset.rotationY || 0);
      const rotZ = parseFloat(card.dataset.rotationZ || 0);
      model.rotation.x = rotX * (Math.PI / 180);
      model.rotation.y = rotY * (Math.PI / 180);
      model.rotation.z = rotZ * (Math.PI / 180);

      // 2. Now calculate bounding box on the already-rotated model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;

      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      scene.add(model);

      // Hide "loading model…" text
      container.classList.add('loaded');
    },
    undefined,
    (err) => {
      console.warn(`Could not load models/${modelId}.glb`, err);
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, wireframe: true });
      scene.add(new THREE.Mesh(geo, mat));
      container.classList.add('loaded');
    }
  );

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize observer
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);
}
