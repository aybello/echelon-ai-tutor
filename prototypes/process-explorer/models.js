import * as THREE from 'three';
import {createKit, colours as C, movingParticles, route} from './geometry.js';

export const catalogue = [
  {id: 'intake', name: 'Intake & screening', short: 'Intake',
    description: 'Screens capture debris before a low-lift pump moves raw water onward.'},
  {id: 'coagulation', name: 'Coagulation', short: 'Coagulation',
    description: 'Coagulant enters the rapid-mix basin and disperses through the raw water.'},
  {id: 'flocculation', name: 'Flocculation', short: 'Flocculation',
    description: 'Tapered, gentle mixing encourages particles to join into larger floc.'},
  {id: 'sedimentation', name: 'Sedimentation', short: 'Settling',
    description: 'Floc settles to the floor; clarified water crosses the perimeter weir.'},
];

function intake(k) {
  const {root, box, cylinder, mesh, group, pipe, rod, flange, motor, part} = k;
  box([0, -1.69, .3], [14.1, .22, 7], C.base);
  const basin = group([-.3, 0, 0]); k.rectangularTank(9.8, 3.3, basin, C.raw, true);
  box([-5.72, -.83, 0], [1.7, .13, 3.6], 0xa2af9d);
  box([-5.72, .78, 0], [1.7, .025, 3.25], C.raw, root, {transparent: true, opacity: .5, depthWrite: false});
  // Inclined bars span the channel; captured material travels up to a screenings chute.
  const bars = group([-2.1, 0, 0]);
  for (let z = -1.47; z < 1.5; z += .16) rod([.3, -1.15, z], [-.3, 1.65, z], .029, C.steel, bars);
  box([-.3, 1.75, 0], [.5, .16, 3.6], C.steel, bars);
  const rake = group([0, 0, 0], bars);
  rod([0, 0, -1.5], [0, 0, 1.5], .038, C.dark, rake);
  for (let z = -1.45; z < 1.5; z += .16) box([.05, -.055, z], [.18, .12, .022], C.steel, rake);
  const rakeDrive = motor([-.3, 2.21, 0], bars); rakeDrive.scale.setScalar(.6);
  box([-.3, 1.54, 2.03], [.72, .09, 1.1], C.steel, bars);
  box([-.3, .32, 2.68], [1.25, 1.2, 1], 0xa6b2b2, bars);
  box([-.3, .94, 2.68], [1.02, .035, .79], 0x857954, bars);
  const fines = group([.1, 0, 0]);
  for (let z = -1.5; z < 1.55; z += .12) rod([0, -1.15, z], [0, 1.36, z], .013, C.steel, fines);
  for (let y = -1.14; y < 1.4; y += .12) rod([0, y, -1.5], [0, y, 1.5], .013, C.steel, fines);
  for (const z of [-1.58, 1.58]) box([0, .14, z], [.22, 2.85, .18], C.dark, fines);
  box([0, 1.5, 0], [.25, .13, 3.36], C.steel, fines);
  // A submerged vertical pump bowl, drive shaft and above-water motor.
  const pump = group([3.25, 0, 0]);
  box([0, 1.56, 0], [1.5, .2, 3.7], C.steel, pump);
  motor([0, 2.13, 0], pump);
  cylinder([0, .05, 0], .072, 3.6, C.steel, pump);
  const bowl = mesh(new THREE.CylinderGeometry(.47, .63, .68, 36, 1, true), C.pipe, [0, -.71, 0], pump, {side: THREE.DoubleSide, transparent: true, opacity: .28});
  const bell = mesh(new THREE.CylinderGeometry(.63, .77, .16, 36, 1, true), C.dark, [0, -1.09, 0], pump, {side: THREE.DoubleSide});
  const impeller = group([0, -.68, 0], pump);
  cylinder([0, 0, 0], .12, .36, C.steel, impeller);
  for (let i = 0; i < 5; i++) {
    const blade = box([0, 0, 0], [.78, .08, .14], 0xc09451, impeller);
    blade.rotation.y = i * Math.PI / 5; blade.rotation.x = .3;
  }
  pipe([[3.25, -.36, 0], [3.25, 1.18, 0], [5.85, 1.18, 0]], .2);
  flange([4.15, 1.18, 0]); flange([5.3, 1.18, 0]);
  // A simple isolation valve on the discharge line.
  box([4.7, 1.18, 0], [.25, .56, .52], C.pipe);
  cylinder([4.7, 1.7, 0], .035, .6, C.steel);
  k.ring([4.7, 2.02, 0], .28, C.dark, .028);
  const path = route([[-6.4, .55, 0], [-3, .55, 0], [-1.6, .55, 0], [.1, .55, 0], [1.2, .55, 0], [2.2, .1, 0], [3.25, -.86, 0], [3.25, 1.18, 0], [5.85, 1.18, 0]]);
  const debris = movingParticles(k, 28, 0x917b4f, (d, i, t) => {
    const p = (t * .075 + i / 28) % 1, z = Math.sin(i * 2.5) * 1.23;
    if (p < .7) d.position.set(-6.2 + p / .7 * 3.8, .77, z);
    else { const rise = (p - .7) / .3; d.position.set(-2.2 - rise * .28, .77 + rise * .85, z); }
    d.scale.set(1.8, .35, 1); d.rotation.y = i + t * .2;
  }, .09);
  k.updates.push(t => {
    const p = (t * .23) % 1; rake.position.set(.3 - p * .6, -1.12 + p * 2.75, 0);
    impeller.rotation.y = t * 3.2;
  });
  part('Source water', 'Raw water enters with debris and suspended particles.', [-5.4, 1.08, -1.2], [-5.1, .4, 0]);
  part('Coarse screen', 'The rake lifts captured debris out of the channel.', [-2.4, 2.7, 0], [-2.1, .2, 0]);
  part('Fine screen', 'A finer screen intercepts smaller debris before the pump.', [.1, 1.6, -1.55], [.1, .2, 0]);
  part('Low-lift pump', 'The motor drives the submerged impeller through a vertical shaft.', [3.25, 2.85, 0], [3.25, .5, 0]);
  part('Discharge valve', 'The discharge pipe carries screened raw water toward treatment.', [4.8, 2.05, .4], [4.8, 1.2, 0]);
  return {path, width: 15.7, height: 9.4, centre: [0, .15, .3], particles: [debris]};
}

function coagulation(k) {
  const {root, box, cylinder, mesh, group, pipe, rod, motor, part} = k;
  box([-.7, -1.69, 0], [12, .22, 8.2], C.base); k.roundTank(2.4);
  // Fixed baffles reduce bulk rotation and help distribute mixing energy.
  for (let i = 0; i < 4; i++) {
    const b = group(); b.rotation.y = i * Math.PI / 2;
    box([0, -.05, -2.12], [.55, 2.4, .12], C.steel, b);
  }
  box([0, 1.61, 0], [1.05, .17, 5.05], C.steel);
  k.rail([-.5, 2.2, -2.42], [-.5, 2.2, 2.42]);
  const drive = motor([0, 2.25, 0]); k.explode(drive, [0, 2.5, 0]);
  const shaft = group([0, .4, 0]); cylinder([0, 0, 0], .07, 2.9, C.steel, shaft); k.explode(shaft, [0, 1.05, 0]);
  const rotor = group([0, -.7, 0]); cylinder([0, 0, 0], .22, .22, C.steel, rotor);
  for (let i = 0; i < 4; i++) {
    const blade = group([0, 0, 0], rotor); blade.rotation.y = i * Math.PI / 2;
    const fin = box([.57, 0, 0], [.91, .11, .35], C.pipe, blade); fin.rotation.x = .45;
  }
  // Chemical storage and metering stay on their own contained skid.
  const skid = group([-4.1, 0, -1.45]);
  box([0, -1.23, 0], [2.8, .12, 2.9], C.edge, skid);
  for (const x of [-1.38, 1.38]) box([x, -.87, 0], [.12, .7, 2.9], C.concrete, skid);
  for (const z of [-1.38, 1.38]) box([0, -.87, z], [2.8, .7, .12], C.concrete, skid);
  cylinder([0, .03, 0], .72, 2.5, 0xc2c2af, skid);
  cylinder([0, 1.31, 0], .75, .1, C.steel, skid);
  cylinder([0, 1.44, 0], .19, .17, C.dark, skid);
  box([.93, -.71, .75], [.45, .56, .45], C.motor, skid);
  const chemicalLine = [[-4.1, -.72, -.82], [-3.2, -.72, -.82], [-3.2, 1.25, -.82], [-2.9, 1.25, 0], [-2.9, .62, 0]];
  pipe(chemicalLine, .052, C.chemical);
  pipe([[-5.9, .62, 0], [-2.4, .62, 0]]); k.flange([-3.5, .62, 0]);
  pipe([[2.3, .67, 0], [4.65, .67, 0]]); k.flange([3.45, .67, 0]);
  const path = route([[-5.9, .62, 0], [-2.4, .62, 0], [-1.55, .45, 0], [-.75, -.65, -.8], [.8, -.5, -.6], [1.1, .42, .65], [-.8, .38, .9], [-1.15, -.3, -.5], [.6, -.6, -.7], [1.75, .35, 0], [2.3, .67, 0], [4.65, .67, 0]]);
  const suspended = movingParticles(k, 180, C.solids, (d, i, t) => {
    const a = i * 2.4 + t * (1.2 + i % 3 * .09), r = .45 + (i % 11) * .13;
    d.position.set(Math.cos(a) * r, -.88 + ((i * .17 + t * .38) % 1) * 1.52, Math.sin(a) * r);
    d.scale.setScalar(.5 + (i % 4) * .12);
  }, .06);
  const doseRoute = route(chemicalLine);
  const dosing = movingParticles(k, 15, C.chemical, (d, i, t) => d.position.copy(doseRoute.at((t * .16 + i / 15) % 1)), .044, true);
  k.updates.push(t => rotor.rotation.y = t * 4);
  part('Chemical feed', 'The metering pump delivers coagulant to the injection point.', [-4.1, 1.7, -1.45], [-4.1, .15, -1.4]);
  part('Injection point', 'Coagulant enters immediately before rapid mixing.', [-2.9, 1.48, 0], [-2.9, .7, 0]);
  part('Mixer drive', 'The motor turns the shaft and submerged impeller.', [0, .75, 0], [0, 0, 0], drive);
  part('Impeller & baffles', 'The impeller disperses coagulant; fixed baffles limit bulk swirling.', [.95, .5, 1.2], [0, -.5, 0]);
  part('To flocculation', 'Destabilized particles leave for a gentler mixing stage.', [3.8, 1.05, .4], [3.4, .6, 0]);
  return {path, width: 14.4, height: 10.5, centre: [-.4, .4, 0], particles: [suspended, dosing]};
}

function flocculation(k) {
  const {root, box, cylinder, group, pipe, rod, motor, part} = k;
  box([0, -1.7, 0], [14.5, .24, 7.7], C.base); k.rectangularTank(12, 4.6, root, 0x96b6b1);
  // Partitions alternate their openings; the route passes through the gaps.
  box([-2, .04, .4], [.15, 2.62, 3.8], C.concrete);
  box([2, .04, -.4], [.15, 2.62, 3.8], C.concrete);
  const wheels = [];
  [-4, 0, 4].forEach((x, i) => {
    const rotor = group([x, -.1, 0]); wheels.push(rotor);
    const shaft = cylinder([0, 0, 0], .075, 5.35, C.steel, rotor); shaft.rotation.x = Math.PI / 2;
    for (let blade = 0; blade < 4; blade++) {
      const g = group([0, 0, 0], rotor); g.rotation.z = blade * Math.PI / 2;
      box([.89, 0, 0], [.18, .38, 3.5], C.pipe, g);
      for (const z of [-1.25, 1.25]) box([.45, 0, z], [.95, .075, .09], C.steel, g);
    }
    for (const z of [-2.28, 2.28]) {
      box([x, -.55, z], [.46, 1.35, .3], C.steel);
      const bearing = cylinder([x, -.1, z], .18, .4, C.dark); bearing.rotation.x = Math.PI / 2;
    }
    const drive = motor([x, -.1, -2.93]); drive.rotation.x = Math.PI / 2; drive.scale.setScalar(.85);
    k.explode(drive, [0, 1.5, -1]);
    part(['First mixing cell', 'Middle mixing cell', 'Final mixing cell'][i],
      ['Initial gentle mixing brings destabilized particles together.', 'Floc grows as particles collide and attach.', 'Slower mixing helps preserve the larger floc.'][i],
      [x, 1.78, -.85], [x, -.2, 0]);
  });
  box([0, -1.02, -3.12], [12.5, .18, 1.1], C.edge);
  pipe([[-7.1, .6, 0], [-6, .6, 0]]); pipe([[6, .6, 0], [7.1, .6, 0]]);
  const path = route([[-7.1, .6, 0], [-5.7, .6, 0], [-4.6, .35, -.7], [-3.1, .35, -1.93], [-1.6, .35, -1.93], [-.65, .35, -.3], [.65, .35, 1.93], [2.45, .35, 1.93], [3.2, .35, .95], [4.5, .35, .4], [5.6, .6, 0], [7.1, .6, 0]]);
  // Five-lobed floc clusters grow with distance along the illustrated flow path.
  const flocs = movingParticles(k, 450, C.solids, (d, i, t) => {
    const cluster = Math.floor(i / 5), lobe = i % 5;
    const p = (t * .028 + cluster / 90) % 1;
    const location = path.at(p), size = .38 + p * 1.2;
    // Mixing motion belongs inside the basin, not outside the inlet/outlet pipe.
    const mixing = Math.max(0, Math.min(1, (5.8 - Math.abs(location.x)) / .55));
    d.position.copy(location);
    d.position.y += (Math.sin(cluster * 2.1 + t * .8) * .49 - .15) * mixing;
    d.position.z += Math.sin(cluster * 2.9) * .1 * mixing;
    if (lobe) {
      d.position.x += Math.cos(lobe * 1.6) * .065 * size;
      d.position.z += Math.sin(lobe * 1.6) * .065 * size;
      d.position.y += (lobe % 2 ? -.03 : .03) * size;
    }
    d.scale.setScalar(size);
  }, .049);
  k.updates.push(t => wheels.forEach((w, i) => w.rotation.z = t * [.85, .55, .3][i]));
  part('Alternating baffles', 'Openings guide water through all three mixing cells.', [-1.95, 1.65, 1.45], [-2, .25, 0]);
  part('To sedimentation', 'Larger floc leaves the basin for gravity settling.', [6.5, 1, .4], [5.8, .4, 0]);
  return {path, width: 16.5, height: 10.2, centre: [0, .12, -.1], particles: [flocs]};
}

function sedimentation(k) {
  const {root, box, cylinder, mesh, group, pipe, rod, part} = k;
  box([0, -2.08, .2], [13.2, .24, 11.2], C.base); k.roundTank(3.65, root, true);
  // A shallow sloped floor meets the central sludge hopper.
  mesh(new THREE.CylinderGeometry(3.54, .38, .68, 72, 1, true), 0xbaa780, [0, -1.28, 0], root, {side: THREE.DoubleSide});
  cylinder([0, -1.57, 0], .4, .52, C.solids);
  // Perimeter weir, launder and clearly separated effluent outlet.
  k.ring([0, .82, 0], 3.35, 0x99b3b8, .16);
  for (let i = 0; i < 64; i++) {
    const a = i * Math.PI / 32;
    const tooth = box([Math.sin(a) * 3.17, .95, Math.cos(a) * 3.17], [.095, .2, .055], C.edge);
    tooth.rotation.y = a;
  }
  const feedwell = mesh(new THREE.CylinderGeometry(.67, .67, 1.45, 40, 1, true), C.steel, [0, .28, 0], root, {side: THREE.DoubleSide});
  pipe([[-6, .72, 0], [-4.1, .72, 0], [-4.1, 1.18, 0], [0, 1.18, 0], [0, .65, 0]], .2);
  k.flange([-4.8, .72, 0]);
  pipe([[3.48, .83, 0], [5.65, .83, 0]], .19); k.flange([4.65, .83, 0]);
  box([0, 1.6, 0], [.7, .15, 7.55], C.steel);
  k.rail([-.33, 2.17, -3.66], [-.33, 2.17, 3.66]);
  const drive = k.motor([0, 2.23, 0]); k.explode(drive, [0, 2.3, 0]);
  cylinder([0, .24, 0], .08, 3.65, C.steel);
  const scraper = group([0, 0, 0]);
  for (const sign of [-1, 1]) {
    rod([0, -.75, 0], [sign * 3.03, -.68, 0], .048, C.steel, scraper);
    rod([0, .75, 0], [sign * 3.03, -.68, 0], .024, C.steel, scraper);
    for (let j = 1; j <= 5; j++) {
      const x = sign * j * .56, y = -1.62 + Math.abs(x) / 3.5 * .68 + .16;
      const blade = box([x, y, .03], [.56, .18, .1], C.steel, scraper);
      blade.rotation.y = sign * -.22;
    }
  }
  const skimmer = group([0, 0, 0], scraper);
  rod([0, .87, 0], [0, .87, 3.01], .028, C.steel, skimmer);
  box([0, .83, 2.15], [.12, .17, 1.7], C.steel, skimmer);
  // Primary solids are routed to residuals handling, not to the effluent pipe.
  const sludgePath = route([[0, -1.73, 0], [0, -1.73, 4.3], [2.45, -1.73, 4.3], [2.45, -.85, 4.3]]);
  pipe(sludgePath.vertices.map(v => v.toArray()), .1, C.solids);
  cylinder([2.45, -.33, 4.3], .39, 1.2, 0xb8ad99);
  const path = route([[-6, .72, 0], [-4.1, .72, 0], [-4.1, 1.18, 0], [0, 1.18, 0], [0, -.45, 0], [1.08, -.3, .65], [2.2, .25, .7], [3.1, .84, .55], [3.4, .84, 0], [5.65, .83, 0]]);
  const solids = movingParticles(k, 180, C.solids, (d, i, t) => {
    const p = (t * .037 + i / 180) % 1, a = i * 2.4, outer = .8 + (i % 13) * .17;
    const r = p < .65 ? outer : outer * (1 - (p - .65) / .35);
    const floor = -1.6 + r / 3.5 * .68;
    const y = p < .65 ? .56 + (floor - .56) * (p / .65) : floor;
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.scale.setScalar(.65 + i % 4 * .16);
  }, .063);
  const sludge = movingParticles(k, 22, C.solids, (d, i, t) => d.position.copy(sludgePath.at((t * .08 + i / 22) % 1)), .047, true);
  k.updates.push(t => scraper.rotation.y = t * .1);
  part('Feedwell', 'The feedwell directs incoming flow into the settling zone.', [-.62, 1.23, .68], [0, .05, 0]);
  part('Drive & scraper', 'The slow scraper moves settled sludge toward the central hopper.', [0, .82, 0], [0, 0, 0], drive);
  part('Sludge hopper', 'Collected sludge leaves through its own withdrawal pipe.', [1.25, -1.1, 3.8], [0, -1.25, 1.2]);
  part('Weir & launder', 'Clarified water crosses the perimeter weir into the collection channel.', [2.45, 1.47, 2.1], [2.4, .75, 2.1]);
  part('To filtration', 'Clarified water travels onward for filtration and disinfection.', [5.1, 1.1, .35], [4.55, .85, 0]);
  return {path, width: 15.2, height: 12, centre: [0, .25, .3], particles: [solids, sludge]};
}

export function buildModel(index) {
  const kit = createKit();
  const model = [intake, coagulation, flocculation, sedimentation][index](kit);
  const flow = movingParticles(kit, 72, 0x2ba4ae, (d, i, t) => d.position.copy(model.path.at((t * .056 + i / 72) % 1)), .04, true);
  const tracer = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 10), new THREE.MeshBasicMaterial({color: 0xe9b043, depthTest: false, depthWrite: false}));
  tracer.renderOrder = 9; kit.root.add(tracer);
  const tracerRing = new THREE.Mesh(new THREE.TorusGeometry(.22, .022, 8, 32), new THREE.MeshBasicMaterial({color: 0xf0bc59, depthTest: false, depthWrite: false}));
  tracer.add(tracerRing); tracerRing.renderOrder = 10;
  model.particles.push(flow, tracer);
  return {...kit, ...model, tracer, tracerRing, ...catalogue[index]};
}
