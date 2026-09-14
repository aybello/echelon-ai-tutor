import * as THREE from 'three';

export const colours = {
  concrete: 0xcdd8d9, edge: 0xe7edea, base: 0xadbdc2,
  steel: 0x7693a0, dark: 0x355563, pipe: 0x087e8c,
  water: 0x6abfc7, raw: 0x96aa91, solids: 0xb49a6d,
  chemical: 0xa286be, motor: 0x47758a,
};

export function createKit() {
  const root = new THREE.Group(), materials = new Map();
  const removable = [], exploded = [], parts = [], updates = [];
  function material(colour, extra = {}) {
    const key = JSON.stringify([colour, extra]);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color: colour, roughness: .6, metalness: .08, ...extra,
    }));
    return materials.get(key);
  }
  function mesh(geometry, colour, position, parent = root, extra = {}) {
    const m = new THREE.Mesh(geometry, material(colour, extra));
    m.position.set(...position); m.castShadow = !extra.transparent; m.receiveShadow = true;
    parent.add(m); return m;
  }
  const box = (p, s, c, parent, extra) => mesh(new THREE.BoxGeometry(...s), c, p, parent, extra);
  const cylinder = (p, r, h, c, parent, extra) => mesh(new THREE.CylinderGeometry(r, r, h, 40), c, p, parent, extra);
  function group(p = [0, 0, 0], parent = root) {
    const g = new THREE.Group(); g.position.set(...p); parent.add(g); return g;
  }
  function rod(a, b, r, c = colours.steel, parent = root) {
    const direction = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const m = cylinder(a, r, direction.length(), c, parent, {metalness: .4});
    m.position.addScaledVector(direction, .5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return m;
  }
  function pipe(points, radius = .16, c = colours.pipe, parent = root) {
    const g = group([0, 0, 0], parent);
    points.slice(1).forEach((p, i) => rod(points[i], p, radius, c, g));
    points.slice(1, -1).forEach(p => mesh(new THREE.SphereGeometry(radius, 12, 8), c, p, g));
    return g;
  }
  function ring(p, radius, c = colours.steel, thickness = .05, parent = root) {
    const m = mesh(new THREE.TorusGeometry(radius, thickness, 8, 64), c, p, parent, {metalness: .45});
    m.rotation.x = Math.PI / 2; return m;
  }
  function flange(p, axis = 'x', parent = root) {
    const m = cylinder(p, .25, .1, colours.steel, parent, {metalness: .5});
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    return m;
  }
  function rail(a, b, parent = root) {
    rod(a, b, .025, colours.steel, parent);
    const delta = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const n = Math.ceil(delta.length() / .9);
    for (let i = 0; i <= n; i++) {
      const p = new THREE.Vector3(...a).addScaledVector(delta, i / n);
      rod([p.x, p.y - .5, p.z], p.toArray(), .021, colours.steel, parent);
    }
  }
  function rectangularTank(w, d, parent = root, waterColour = colours.raw, openLeft = false) {
    box([0, -1.43, 0], [w + .35, .3, d + .35], colours.base, parent);
    box([0, -1.25, 0], [w, .1, d], colours.edge, parent);
    box([0, .03, -d / 2], [w + .2, 2.6, .17], colours.concrete, parent);
    for (const x of [-w / 2, w / 2]) if (!(openLeft && x < 0)) box([x, .03, 0], [.17, 2.6, d], colours.concrete, parent);
    const front = box([0, .03, d / 2], [w + .2, 2.6, .17], colours.concrete, parent);
    removable.push(front); front.visible = false;
    box([0, 1.39, -d / 2], [w + .4, .18, .35], colours.edge, parent);
    for (const x of [-w / 2, w / 2]) box([x, 1.39, 0], [.35, .18, d], colours.edge, parent);
    box([0, .8, 0], [w - .2, .025, d - .2], waterColour, parent, {
      transparent: true, opacity: .32, depthWrite: false, roughness: .18,
    });
    rail([-w / 2, 1.97, -d / 2], [w / 2, 1.97, -d / 2], parent);
  }
  function roundTank(radius, parent = root, slopedFloor = false) {
    cylinder([0, slopedFloor ? -1.89 : -1.43, 0], radius + .2, slopedFloor ? .14 : .3, colours.base, parent);
    if (!slopedFloor) cylinder([0, -1.25, 0], radius, .1, colours.edge, parent);
    mesh(new THREE.CylinderGeometry(radius, radius, 2.6, 72, 1, true, .52 * Math.PI, 1.5 * Math.PI), colours.concrete, [0, .03, 0], parent, {side: THREE.DoubleSide});
    const front = mesh(new THREE.CylinderGeometry(radius, radius, 2.6, 32, 1, true, .02 * Math.PI, .5 * Math.PI), colours.concrete, [0, .03, 0], parent, {side: THREE.DoubleSide});
    removable.push(front); front.visible = false;
    ring([0, 1.4, 0], radius, colours.edge, .115, parent);
    cylinder([0, .8, 0], radius - .1, .025, colours.water, parent, {transparent: true, opacity: .32, depthWrite: false});
  }
  function motor(p, parent = root) {
    const g = group(p, parent);
    cylinder([0, .1, 0], .34, .85, colours.motor, g, {metalness: .4});
    for (let i = 0; i < 7; i++) cylinder([0, -.25 + i * .1, 0], .37, .025, colours.steel, g);
    cylinder([0, .59, 0], .36, .13, colours.dark, g);
    box([0, -.42, 0], [.9, .13, .85], colours.steel, g);
    for (const x of [-.33, .33]) for (const z of [-.3, .3]) cylinder([x, -.32, z], .04, .09, colours.dark, g);
    return g;
  }
  function part(name, description, anchor, target = anchor, attached = root) {
    parts.push({name, description, anchor: new THREE.Vector3(...anchor), target: new THREE.Vector3(...target), attached});
  }
  function explode(object, offset) {
    exploded.push({object, origin: object.position.clone(), offset: new THREE.Vector3(...offset)});
  }
  function setExploded(amount) {
    for (const p of exploded) p.object.position.copy(p.origin).addScaledVector(p.offset, amount);
  }
  function setCutaway(value) { removable.forEach(o => o.visible = !value); }
  function dispose() {
    const geometries = new Set(), ownedMaterials = new Set();
    root.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => ownedMaterials.add(m));
    });
    geometries.forEach(g => g.dispose()); ownedMaterials.forEach(m => m.dispose()); root.removeFromParent();
  }
  return {root, mesh, box, cylinder, group, rod, pipe, ring, flange, rail, rectangularTank,
    roundTank, motor, material, part, parts, updates, explode, exploded, setExploded, setCutaway, dispose};
}

export function route(points) {
  const vertices = points.map(p => new THREE.Vector3(...p)), lengths = [0];
  for (let i = 1; i < vertices.length; i++) lengths.push(lengths[i - 1] + vertices[i].distanceTo(vertices[i - 1]));
  const length = lengths.at(-1);
  return {vertices, at(t) {
    const distance = THREE.MathUtils.clamp(t, 0, 1) * length;
    let i = 1; while (i < lengths.length - 1 && distance > lengths[i]) i++;
    const span = lengths[i] - lengths[i - 1];
    return vertices[i - 1].clone().lerp(vertices[i], span ? (distance - lengths[i - 1]) / span : 0);
  }};
}

export function movingParticles(kit, count, colour, update, radius = .055, overlay = false) {
  const particles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(radius, 0),
    overlay ? new THREE.MeshBasicMaterial({color: colour, depthTest: false, depthWrite: false}) : kit.material(colour), count);
  particles.frustumCulled = false; if (overlay) particles.renderOrder = 8;
  kit.root.add(particles); const dummy = new THREE.Object3D();
  const tick = t => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      update(dummy, i, t); dummy.updateMatrix(); particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
  };
  kit.updates.push(tick); tick(0); return particles;
}
