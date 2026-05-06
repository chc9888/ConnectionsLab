// cabinet.js — loads GLB models into each card viewer
// Uses Three.js via importmap (defined in cabinet.html)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Config ──────────────────────────────────────────────
// Total number of objects the user must inspect before the verdict CTA appears.
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

  // Set up Three.js scene for this card
  setupViewer(viewerEl, id);

  // Mark as inspected when user interacts with the card viewer (mousedown)
  viewerEl.addEventListener('mousedown', () => markInspected(card, id));
  // Also on touch
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
function setupViewer(container, modelId) {
  const width = container.clientWidth || 280;
  const height = container.clientHeight || 240;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.set(0, 0.5, 2);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(1, 2, 3);
  scene.add(dirLight);

  // OrbitControls (drag to rotate)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;

  // Load GLB
  // File expected at: models/<modelId>.glb
  const loader = new GLTFLoader();
  loader.load(
    `models/${modelId}.glb`,
    (gltf) => {
      const model = gltf.scene;

      // Auto-center and auto-scale the model to fit the viewer
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;

      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      scene.add(model);

      // Clear the loading placeholder text
      container.style.setProperty('--loading-text', '""');
    },
    (xhr) => {
      // Progress — optional
    },
    (err) => {
      console.warn(`Could not load models/${modelId}.glb — using placeholder.`, err);
      // Show a simple placeholder cube if model is missing
      const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, wireframe: true });
      scene.add(new THREE.Mesh(geo, mat));
    }
  );

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize observer — handles window resize or layout shifts
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);
}
