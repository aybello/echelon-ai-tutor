import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {buildModel} from './models.js';

export function mountExplorer(root) {
  if (!root) return () => {};
  const q = id => root.querySelector('#' + id), view = q('pe-view'), status = q('pe-error');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'}); }
  catch {
    status.textContent = '3D graphics are unavailable in this browser. The existing Process Guides are still available.';
    root.dataset.graphicsUnavailable = 'true'; q('pe-status').textContent = 'Unavailable';
    root.querySelectorAll('button,input,select').forEach(el => el.disabled = true);
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img'); view.prepend(canvas);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .1, 180);
  scene.add(new THREE.HemisphereLight(0xedfaff, 0x6c827a, 2));
  const sun = new THREE.DirectionalLight(0xfff7e9, 2.6); sun.position.set(-8, 17, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.normalBias = .025;
  Object.assign(sun.shadow.camera, {left: -10, right: 10, top: 9, bottom: -9, near: .5, far: 45}); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc0edff, 1.2); fill.position.set(10, 7, -9); scene.add(fill);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false; controls.minDistance = 3; controls.maxDistance = 95;
  controls.minPolarAngle = .12; controls.maxPolarAngle = Math.PI * .48;
  controls.zoomSpeed = .7; controls.rotateSpeed = .65;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 26;
  let model, index = 0, selected = -1, running = false, progress = 0, time = 0;
  let exploded = false, cutaway = true, lost = false, disposed = false, visible = true;
  let raf = null, last = 0, lastDraw = 0, lastShadow = 0, cameraTween = null;
  let labelButtons = [];
  const listeners = [];
  function listen(el, name, fn) { el.addEventListener(name, fn); listeners.push(() => el.removeEventListener(name, fn)); }
  function point(part, key) { return part.attached.localToWorld(part[key].clone()); }
  function homePose() {
    const aspect = view.clientWidth / Math.max(view.clientHeight, 1);
    const extent = Math.max(model.width / Math.max(aspect, .2), model.height + (exploded ? 3.5 : 0));
    const distance = extent / (2 * Math.tan(Math.PI / 10)) * 1.12;
    const target = new THREE.Vector3(...model.centre); if (exploded) target.y += .8;
    return {target, position: target.clone().add(new THREE.Vector3(.34, .65, 1).normalize().multiplyScalar(distance))};
  }
  function partPose(i) {
    const target = point(model.parts[i], 'target');
    const distance = Math.max(7.6, 6.8 / Math.max(camera.aspect, .35));
    return {target, position: target.clone().add(new THREE.Vector3(.7, .7, 1).normalize().multiplyScalar(distance))};
  }
  function move(pose, animate = true) {
    if (!animate || reduce.matches) {
      cameraTween = null; camera.position.copy(pose.position); controls.target.copy(pose.target); controls.update(); draw(); return;
    }
    cameraTween = {start: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), ...pose};
    schedule();
  }
  function labels() {
    const w = view.clientWidth, h = view.clientHeight;
    const placed = [];
    model.root.updateMatrixWorld(true);
    model.parts.forEach((part, i) => {
      const p = point(part, 'anchor').project(camera), button = labelButtons[i];
      let x = (p.x + 1) * .5 * w, y = (1 - p.y) * .5 * h;
      const show = p.z < 1 && p.z > -1 && x > 15 && x < w - 15 && y > 37 && y < h - 40;
      button.hidden = !show; if (!show) return;
      // Small numbered targets avoid overlapping long equipment names.
      for (let pass = 0; pass < 5 && placed.some(a => Math.abs(x - a.x) < 43 && Math.abs(y - a.y) < 43); pass++) y -= 44;
      y = Math.max(58, y); x = Math.max(25, Math.min(w - 25, x)); placed.push({x, y});
      button.style.left = x + 'px'; button.style.top = y + 'px';
    });
  }
  function draw() {
    if (lost || disposed || !root.isConnected || !model) return;
    model.tracerRing.quaternion.copy(camera.quaternion);
    if (performance.now() - lastShadow > 350) { renderer.shadowMap.needsUpdate = true; lastShadow = performance.now(); }
    renderer.render(scene, camera); renderer.shadowMap.autoUpdate = false; labels();
    if (renderer.info.render.calls > 0) { status.hidden = true; canvas.dataset.rendered = 'true'; }
    canvas.dataset.geometries = String(renderer.info.memory.geometries);
  }
  function ui() {
    q('pe-play').textContent = running ? 'Pause process' : progress === 1 ? 'Replay process' : progress ? 'Resume process' : 'Run process';
    q('pe-play').disabled = exploded || lost;
    q('pe-status').textContent = lost ? 'Restoring graphics' : exploded ? 'Inspecting parts' : running ? 'Running' : progress === 1 ? 'Complete' : progress ? 'Paused' : 'Ready';
    q('pe-cutaway').setAttribute('aria-pressed', String(cutaway));
    q('pe-explode').hidden = model.exploded.length === 0;
    q('pe-explode').setAttribute('aria-pressed', String(exploded));
    q('pe-home').setAttribute('aria-pressed', String(selected === -1));
    q('pe-title').textContent = model.name;
    q('pe-inspect').value = String(selected);
    q('pe-detail').textContent = selected < 0 ? (exploded ? 'Drive components separated for inspection.' : model.description) : model.parts[selected].description;
    q('pe-progress').value = String(Math.round(progress * 1000));
    q('pe-progress').disabled = exploded || lost;
    q('pe-percent').textContent = Math.round(progress * 100) + '%';
    q('pe-progress').setAttribute('aria-valuetext', Math.round(progress * 100) + '% of the illustrative process');
    root.querySelectorAll('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.model) === index)));
    labelButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === selected)));
  }
  function updateModel() {
    model.updates.forEach(fn => fn(time)); model.tracer.position.copy(model.path.at(progress));
    canvas.dataset.processTime = time.toFixed(3); canvas.dataset.progress = progress.toFixed(5);
    canvas.dataset.model = model.id; canvas.dataset.exploded = String(exploded);
  }
  function selectPart(i) {
    selected = i; ui(); move(i < 0 ? homePose() : partPose(i));
  }
  function loadModel(next) {
    running = false; cameraTween = null; progress = 0; time = 0; last = 0; selected = -1; exploded = false;
    if (model) model.dispose();
    index = next; model = buildModel(next); scene.add(model.root); model.setCutaway(cutaway);
    canvas.setAttribute('aria-label', 'Interactive 3D ' + model.name.toLowerCase() + '. ' + model.description);
    q('pe-labels').replaceChildren(); q('pe-inspect').replaceChildren(); labelButtons = [];
    const whole = new Option('Whole process', '-1'); q('pe-inspect').add(whole);
    model.parts.forEach((part, i) => {
      q('pe-inspect').add(new Option((i + 1) + ' · ' + part.name, String(i)));
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pe-marker'; b.textContent = String(i + 1);
      b.setAttribute('aria-label', 'Inspect ' + part.name); b.onclick = () => selectPart(i);
      q('pe-labels').append(b); labelButtons.push(b);
    });
    updateModel(); renderer.shadowMap.needsUpdate = true; ui(); resize(); move(homePose(), false);
  }
  function tick(now) {
    raf = null; if (disposed || lost || !root.isConnected) return;
    const dt = last ? Math.min((now - last) / 1000, .2) : 0; last = now;
    if (running && visible && !document.hidden) {
      progress = Math.min(1, progress + dt / DURATION); time += dt; updateModel();
      q('pe-progress').value = String(Math.round(progress * 1000)); q('pe-percent').textContent = Math.round(progress * 100) + '%';
      q('pe-progress').setAttribute('aria-valuetext', Math.round(progress * 100) + '% of the illustrative process');
      if (progress === 1) { running = false; ui(); }
    }
    if (cameraTween) {
      const v = cameraTween, p = Math.min(1, (now - v.start) / 650), s = p * p * (3 - 2 * p);
      camera.position.lerpVectors(v.from, v.position, s); controls.target.lerpVectors(v.fromTarget, v.target, s); controls.update();
      if (p === 1) cameraTween = null;
    }
    if (now - lastDraw > 32 || !running) { draw(); lastDraw = now; }
    if (cameraTween || (running && visible && !document.hidden)) schedule(); else last = 0;
  }
  function schedule() { if (raf === null && !lost && !disposed) raf = requestAnimationFrame(tick); }
  function resize() {
    const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    move(selected < 0 ? homePose() : partPose(selected), false);
  }
  listen(q('pe-play'), 'click', () => {
    if (progress === 1) { progress = 0; time = 0; updateModel(); }
    running = !running; last = 0; ui(); schedule();
  });
  listen(q('pe-progress'), 'input', e => { running = false; progress = Number(e.target.value) / 1000; time = progress * DURATION; updateModel(); ui(); draw(); });
  listen(q('pe-cutaway'), 'click', () => { cutaway = !cutaway; model.setCutaway(cutaway); renderer.shadowMap.needsUpdate = true; ui(); draw(); });
  listen(q('pe-explode'), 'click', () => {
    running = false; exploded = !exploded; selected = -1; model.setExploded(exploded ? 1 : 0);
    model.particles.forEach(o => o.visible = !exploded); renderer.shadowMap.needsUpdate = true; ui(); move(homePose());
  });
  listen(q('pe-home'), 'click', () => selectPart(-1));
  listen(q('pe-inspect'), 'change', e => selectPart(Number(e.target.value)));
  root.querySelectorAll('[data-model]').forEach(b => listen(b, 'click', () => loadModel(Number(b.dataset.model))));
  controls.addEventListener('start', () => cameraTween = null);
  controls.addEventListener('change', () => { if (!running && !cameraTween) draw(); });
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(view);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; last = 0; if (visible) schedule(); }); intersection.observe(view);
  listen(document, 'visibilitychange', () => { last = 0; if (!document.hidden) schedule(); });
  listen(canvas, 'webglcontextlost', e => {
    e.preventDefault(); lost = true; running = false; canvas.dataset.rendered = 'false';
    status.textContent = 'Restoring the 3D graphics session…'; status.hidden = false; ui();
  });
  listen(canvas, 'webglcontextrestored', () => { lost = false; renderer.shadowMap.needsUpdate = true; ui(); resize(); draw(); });
  const themeObserver = new MutationObserver(draw); themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['class', 'data-theme', 'style']});
  try { loadModel(0); }
  catch (e) { status.textContent = 'The model could not load: ' + e.message; status.hidden = false; }
  return () => {
    disposed = true; if (raf !== null) cancelAnimationFrame(raf);
    listeners.forEach(fn => fn()); resizeObserver.disconnect(); intersection.disconnect(); themeObserver.disconnect();
    controls.dispose(); model?.dispose(); sun.shadow.map?.dispose(); renderer.dispose(); canvas.remove();
  };
}

mountExplorer(document.getElementById('echelon-process-batch-one'));
