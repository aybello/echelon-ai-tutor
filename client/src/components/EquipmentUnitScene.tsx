import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentDefinition, EquipmentView } from "@shared/equipmentRegistry";

type Point = [number, number, number];
export interface EquipmentUnitSceneProps {
  equipment: EquipmentDefinition;
  view: EquipmentView;
  activePart: string;
  onSelectPart: (id: string) => void;
  animate: boolean;
}
type SceneProps = Omit<EquipmentUnitSceneProps, "equipment">;
const TEAL = "#0891a3";
const CONCRETE = "#bcc9cd";
const STEEL = "#8fa7b1";
const LIGHT = "#dbe6e9";
const DARK = "#506b78";
const WATER = "#49b9c7";
const SAND = "#b7aa8b";
const ZERO: Point = [0, 0, 0];
const X_AXIS: Point = [0, 0, -Math.PI / 2];
const NO_RAYCAST = () => null;
const PartContext = createContext<{ id: string; active: boolean; select: (id: string) => void } | null>(null);

/** Mesh-level handlers stop bubbling, so one click selects exactly one part. */
function usePartMesh(passive = false) {
  const part = useContext(PartContext);
  return {
    userData: part ? { equipmentPart: part.id } : {},
    ...(passive ? { raycast: NO_RAYCAST } : part ? {
      onClick: (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        part.select(part.id);
      },
    } : {}),
  };
}
function Surface({ color = STEEL, opacity = 1, metalness = 0.25 }: {
  color?: string; opacity?: number; metalness?: number;
}) {
  const part = useContext(PartContext);
  return <meshStandardMaterial color={part?.active ? TEAL : color}
    emissive={part?.active ? TEAL : "#000000"} emissiveIntensity={part?.active ? 0.24 : 0}
    roughness={metalness ? 0.43 : 0.87} metalness={metalness}
    transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} side={THREE.DoubleSide} />;
}
function Part({ id, offset = ZERO, scene, children }: {
  id: string; offset?: Point; scene: SceneProps; children: ReactNode;
}) {
  const value = useMemo(() => ({ id, active: scene.activePart === id, select: scene.onSelectPart }),
    [id, scene.activePart, scene.onSelectPart]);
  return <PartContext.Provider value={value}>
    <group name={`part:${id}`} position={scene.view === "exploded" ? offset : ZERO}>{children}</group>
  </PartContext.Provider>;
}
type SolidProps = { at?: Point; rotation?: Point; color?: string; opacity?: number; passive?: boolean };
function Box({ at = ZERO, size, rotation = ZERO, color, opacity, passive = false }: SolidProps & { size: Point }) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow {...usePartMesh(passive)}>
    <boxGeometry args={size} /><Surface color={color} opacity={opacity} />
  </mesh>;
}
function Cylinder({ at = ZERO, radius, length, rotation = ZERO, color, opacity, passive = false,
  bottom = radius, sides = 24 }: SolidProps & { radius: number; length: number; bottom?: number; sides?: number }) {
  return <mesh position={at} rotation={rotation} castShadow {...usePartMesh(passive)}>
    <cylinderGeometry args={[radius, bottom, length, sides]} /><Surface color={color} opacity={opacity} />
  </mesh>;
}
function Ring({ at = ZERO, radius, tube = 0.055, rotation = ZERO, color }: SolidProps & { radius: number; tube?: number }) {
  return <mesh position={at} rotation={rotation} castShadow {...usePartMesh()}>
    <torusGeometry args={[radius, tube, 8, 40]} /><Surface color={color} />
  </mesh>;
}
function alignment(from: Point, to: Point) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  return { mid: a.clone().add(b).multiplyScalar(0.5), length: a.distanceTo(b),
    quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()) };
}
function Member({ from, to, radius = 0.07, color = STEEL }: {
  from: Point; to: Point; radius?: number; color?: string;
}) {
  const pose = useMemo(() => alignment(from, to), [from, to]);
  return <mesh position={pose.mid} quaternion={pose.quaternion} castShadow {...usePartMesh()}>
    <cylinderGeometry args={[radius, radius, pose.length, 16]} /><Surface color={color} />
  </mesh>;
}
function Tube({ points, radius = 0.1, color = LIGHT }: { points: Point[]; radius?: number; color?: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal"), [points]);
  return <mesh castShadow {...usePartMesh()}>
    <tubeGeometry args={[curve, Math.max(24, points.length * 6), radius, 12, false]} /><Surface color={color} />
  </mesh>;
}
/** Annular, extruded wall, not a zero-thickness transparent cylinder. Axis is X. */
function Shell({ at = ZERO, radius, length, thickness = 0.12, cut = false, color, opacity = 1,
  passive = false }: SolidProps & { radius: number; length: number; thickness?: number; cut?: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape(), inner = radius - thickness;
    const start = cut ? Math.PI : 0, end = cut ? Math.PI * 2.5 : Math.PI * 2;
    s.moveTo(radius * Math.cos(start), radius * Math.sin(start));
    s.absarc(0, 0, radius, start, end, false);
    s.lineTo(inner * Math.cos(end), inner * Math.sin(end));
    s.absarc(0, 0, inner, end, start, true); s.closePath();
    return s;
  }, [radius, thickness, cut]);
  return <mesh position={[at[0] - length / 2, at[1], at[2]]} rotation={[0, Math.PI / 2, 0]}
    castShadow {...usePartMesh(passive)}>
    <extrudeGeometry args={[shape, { depth: length, bevelEnabled: false, curveSegments: 40 }]} />
    <Surface color={color} opacity={opacity} />
  </mesh>;
}
function Flange({ x, y = 0, z = 0, radius = 0.35 }: { x: number; y?: number; z?: number; radius?: number }) {
  return <>
    <Shell at={[x, y, z]} radius={radius} thickness={0.1} length={0.12} color={LIGHT} />
    {[0, 1, 2, 3, 4, 5].map(i => <Cylinder key={i} at={[x, y + Math.sin(i * Math.PI / 3) * (radius - 0.04),
      z + Math.cos(i * Math.PI / 3) * (radius - 0.04)]} radius={0.027} length={0.17} sides={6} rotation={X_AXIS} color={DARK} />)}
  </>;
}
/** Closed UV end head: axial flow port and four sealed sleeve penetrations. */
function UVHead({ x }: { x: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape(); s.absarc(0, 0, 0.96, 0, Math.PI * 2, false);
    for (const [a, b, r] of [[0, 0, 0.24], [-0.38, -0.38, 0.145], [-0.38, 0.38, 0.145],
      [0.38, -0.38, 0.145], [0.38, 0.38, 0.145]]) {
      const hole = new THREE.Path(); hole.absarc(a, b, r, 0, Math.PI * 2, true); s.holes.push(hole);
    }
    return s;
  }, []);
  return <mesh position={[x - 0.05, -0.2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow {...usePartMesh()}>
    <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false, curveSegments: 24 }]} />
    <Surface color={LIGHT} />
  </mesh>;
}
function Water({ at, size }: { at: Point; size: Point }) {
  return <Box at={at} size={size} color={WATER} opacity={0.18} passive />;
}
/** The near wall is removed in Cutaway/Exploded; end ports are actual openings. */
function Tank({ length = 6, width = 3.4, floor = -1.65, top = 0.5, cut, openEnds = false,
  splitFloor = false }: { length?: number; width?: number; floor?: number; top?: number; cut: boolean;
  openEnds?: boolean; splitFloor?: boolean }) {
  const h = top - floor, y = (top + floor) / 2;
  return <>
    {!splitFloor && <Box at={[0, floor - 0.1, 0]} size={[length + 0.4, 0.2, width + 0.4]} color={CONCRETE} />}
    <Box at={[0, y, -width / 2 - 0.1]} size={[length + 0.4, h, 0.2]} color={CONCRETE} />
    {!cut && <Box at={[0, y, width / 2 + 0.1]} size={[length + 0.4, h, 0.2]} color={CONCRETE} />}
    {!openEnds && [-1, 1].map(sign => <group key={sign}>
      {/* Three jambs leave a central side-port gap instead of burying the pipe. */}
      {[-1, 1].map(z => <Box key={z} at={[sign * (length / 2 + 0.1), y, z * (width / 4 + 0.22)]}
        size={[0.2, h, width / 2 - 0.44]} color={CONCRETE} />)}
      <Box at={[sign * (length / 2 + 0.1), top - 0.12, 0]} size={[0.2, 0.24, 0.88]} color={CONCRETE} />
    </group>)}
  </>;
}
function StillArrow({ from, to }: { from: Point; to: Point }) {
  const pose = useMemo(() => alignment(from, to), [from, to]);
  return <group position={pose.mid} quaternion={pose.quaternion}>
    <Cylinder radius={0.024} length={0.36} color={WATER} />
    <Cylinder at={[0, 0.24, 0]} radius={0} bottom={0.11} length={0.18} color={WATER} />
  </group>;
}
/** Mounted only during enabled, assembled motion. No frame-time allocations. */
function TravelArrow({ from, to }: { from: Point; to: Point }) {
  const ref = useRef<THREE.Group>(null), phase = useRef(0.5);
  const pose = useMemo(() => alignment(from, to), [from, to]);
  useFrame((_, delta) => {
    phase.current = (phase.current + Math.min(delta, 0.1) * 0.28) % 1;
    ref.current?.position.set(from[0] + (to[0] - from[0]) * phase.current,
      from[1] + (to[1] - from[1]) * phase.current, from[2] + (to[2] - from[2]) * phase.current);
  });
  return <group ref={ref} position={pose.mid} quaternion={pose.quaternion}>
    <Cylinder radius={0.023} length={0.28} color={WATER} />
    <Cylinder at={[0, 0.2, 0]} radius={0} bottom={0.1} length={0.18} color={WATER} />
  </group>;
}
function Arrow({ from, to, scene }: { from: Point; to: Point; scene: SceneProps }) {
  return scene.animate && scene.view !== "exploded" ? <TravelArrow from={from} to={to} /> : <StillArrow from={from} to={to} />;
}
function Spinning({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.x += Math.min(delta, 0.1) * 1.8; });
  return <group ref={ref}>{children}</group>;
}
function Rotor({ scene, children }: { scene: SceneProps; children: ReactNode }) {
  return scene.animate && scene.view !== "exploded" ? <Spinning>{children}</Spinning> : <group>{children}</group>;
}

function VoluteWall({ shape, inspectTop }: { shape: THREE.Shape; inspectTop: boolean }) {
  return <mesh position={[-1, -0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow {...usePartMesh(inspectTop)}>
    <extrudeGeometry args={[shape, { depth: 0.6, bevelEnabled: false }]} /><Surface opacity={inspectTop ? 0.2 : 1} />
  </mesh>;
}

function Pump(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  const volute = useMemo(() => {
    const shape = new THREE.Shape();
    // Increasing-radius spiral chamber carries the radial impeller discharge.
    for (let i = 0; i <= 64; i++) {
      const t = i / 64, a = t * Math.PI * 2, r = 0.94 + 0.25 * t;
      if (!i) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
      else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    for (let i = 64; i >= 0; i--) {
      const t = i / 64, a = t * Math.PI * 2, r = 0.78 + 0.25 * t;
      shape.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    shape.closePath(); return shape;
  }, []);
  return <group>
    <Box at={[0.35, -1.55, 0]} size={[6.3, 0.22, 2.5]} color={CONCRETE} />
    <Part id="suction" scene={scene} offset={[-1.1, 0, 0]}>
      <Shell at={[-2.35, -0.1, 0]} radius={0.29} thickness={0.065} length={2.6} color={LIGHT} />
      <Flange x={-3.6} y={-0.1} /><Flange x={-1.08} y={-0.1} />
      <Arrow from={[-3.3, 0.26, 0]} to={[-1.35, 0.26, 0]} scene={scene} />
    </Part>
    <Part id="casing" scene={scene} offset={[0.15, 0, 0]}>
      <VoluteWall shape={volute} inspectTop={scene.view === "top"} />
      {/* Section the near head so the +X/+Z camera can see the impeller. */}
      <Shell at={[-0.42, -0.1, 0]} radius={1.1} thickness={0.86} length={0.1}
        cut={cut} color={STEEL} opacity={cut ? 1 : 0.23} passive={!cut} />
      <Shell at={[-1.03, -0.1, 0]} radius={1.09} thickness={0.28} length={0.12} color={LIGHT} />
      {!cut && <Shell at={[-1.04, -0.1, 0]} radius={0.82} thickness={0.54} length={0.05}
        color={LIGHT} opacity={0.19} passive />}
      <Box at={[-0.7, -1.31, 0]} size={[0.9, 0.3, 1.4]} color={STEEL} />
    </Part>
    <Part id="impeller" scene={scene} offset={[-0.85, 0, 0]}>
      <group position={[-0.79, -0.1, 0]}><Rotor scene={scene}>
        <Cylinder radius={0.69} length={0.09} rotation={X_AXIS} color={DARK} />
        <Cylinder at={[-0.13, 0, 0]} radius={0.23} length={0.28} rotation={X_AXIS} color={LIGHT} />
        {Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[i * Math.PI * 2 / 7, 0, 0]}>
          <Tube points={[[-0.1, 0.22, 0], [-0.1, 0.4, 0.1], [-0.1, 0.58, 0.24]]} radius={0.064} color={LIGHT} />
        </group>)}
      </Rotor></group>
    </Part>
    <Part id="shaft" scene={scene} offset={[0.8, 0, 0]}>
      <Cylinder at={[0.5, -0.1, 0]} radius={0.095} length={2.6} rotation={X_AXIS} color={LIGHT} />
      <Cylinder at={[1.36, -0.1, 0]} radius={0.22} length={0.34} rotation={X_AXIS} color={DARK} />
      <Box at={[0.38, -0.56, 0]} size={[0.85, 0.62, 0.52]} color={STEEL} />
    </Part>
    <Part id="motor" scene={scene} offset={[1.2, 0, 0]}>
      <Cylinder at={[2.62, -0.1, 0]} radius={0.56} length={1.65} rotation={X_AXIS} color={STEEL} />
      {Array.from({ length: 9 }, (_, i) => <Shell key={i} at={[1.96 + i * 0.15, -0.1, 0]}
        radius={0.6} thickness={0.06} length={0.05} color={DARK} />)}
      <Box at={[2.62, 0.54, 0]} size={[0.5, 0.3, 0.48]} color={LIGHT} />
      <Box at={[2.62, -1.05, 0]} size={[1.65, 0.72, 0.9]} color={STEEL} />
    </Part>
    <Part id="discharge" scene={scene} offset={[0.75, 0.6, 0]}>
      {/* Tangential outlet at the top of the volute, never an axial second nozzle. */}
      <Tube points={[[-0.65, 0.98, 0.36], [-0.65, 1.3, 0.36], [-0.65, 1.78, 0.36]]} radius={0.2} />
      <Ring at={[-0.65, 1.75, 0.36]} radius={0.28} rotation={[Math.PI / 2, 0, 0]} color={LIGHT} />
      <Arrow from={[-0.28, 1.0, 0.36]} to={[-0.28, 1.7, 0.36]} scene={scene} />
    </Part>
  </group>;
}

function GravityFilter(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  return <group>
    <Tank length={4.8} width={3.2} floor={-1.65} top={0.98} cut={cut} />
    <Part id="inlet" scene={scene} offset={[-0.65, 0.5, 0]}>
      <Shell at={[-3.05, 0.35, 0]} radius={0.22} thickness={0.05} length={1.4} color={LIGHT} />
      <Flange x={-3.65} y={0.35} radius={0.29} />
      <Box at={[-2.02, 0.21, 0]} size={[0.5, 0.1, 0.9]} color={STEEL} />
      <Arrow from={[-3.5, 0.7, 0]} to={[-2.55, 0.7, 0]} scene={scene} />
    </Part>
    <Part id="supernatant" scene={scene} offset={[0, 1.55, 0]}>
      <Water at={[0, 0.085, 0]} size={[4.75, 0.67, 3.15]} />
      {/* Selectable waterline strip/gauge, not a raycast-blocking water box. */}
      <Box at={[-1.45, 0.42, -1.58]} size={[1.4, 0.045, 0.07]} color={WATER} />
      <Box at={[-1.98, 0.18, -1.53]} size={[0.08, 0.48, 0.08]} color={LIGHT} />
      <Arrow from={[-0.9, 0.39, 0.65]} to={[-0.9, -0.15, 0.65]} scene={scene} />
    </Part>
    <Part id="media" scene={scene} offset={[0, 0.45, 0]}>
      <Box at={[0, -0.7, 0]} size={[4.75, 0.9, 3.15]} color={SAND} />
      <Box at={[0, -1.25, 0]} size={[4.75, 0.2, 3.15]} color={STEEL} />
      {Array.from({ length: 32 }, (_, i) => <Cylinder key={i}
        at={[-2.12 + (i % 8) * 0.6, -0.225, -1.16 + Math.floor(i / 8) * 0.76]}
        radius={0.06} length={0.035} sides={7} color={i % 2 ? SAND : "#a39b87"} />)}
    </Part>
    <Part id="underdrain" scene={scene} offset={[0, 0.22, 1.78]}>
      <Member from={[-2.15, -1.49, 0]} to={[2.35, -1.49, 0]} radius={0.12} color={LIGHT} />
      {Array.from({ length: 8 }, (_, i) => <group key={i}>
        <Member from={[-2.05 + i * 0.58, -1.48, -1.4]} to={[-2.05 + i * 0.58, -1.48, 1.4]} radius={0.065} color={LIGHT} />
        {[-1.1, -0.55, 0.55, 1.1].map(z => <Cylinder key={z} at={[-2.05 + i * 0.58, -1.405, z]}
          radius={0.033} length={0.06} color={DARK} />)}
      </group>)}
      {/* External wash-water branch exposes the collector even in assembled view. */}
      <Tube points={[[-2.15, -1.49, 0], [-2.15, -1.49, 1.85], [-2.15, 0.1, 1.85]]}
        radius={0.09} color={LIGHT} />
      <Cylinder at={[-2.15, -0.2, 1.85]} radius={0.16} length={0.2} color={STEEL} />
    </Part>
    <Part id="wash-trough" scene={scene} offset={[0, 1.6, -0.55]}>
      <Box at={[0.7, 0.59, 0]} size={[0.62, 0.12, 3.15]} color={LIGHT} />
      {[-1, 1].map(s => <Box key={s} at={[0.7 + s * 0.31, 0.79, 0]}
        size={[0.09, 0.4, 3.15]} color={STEEL} />)}
      <Tube points={[[0.7, 0.65, -1.5], [0.7, 0.65, -2.0], [1.65, 0.65, -2.0]]} radius={0.1} />
    </Part>
    <Part id="outlet" scene={scene} offset={[0.45, 0.4, 0]}>
      <Shell at={[3.02, -1.49, 0]} radius={0.18} thickness={0.05} length={1.55} color={LIGHT} />
      <Flange x={3.73} y={-1.49} radius={0.25} />
      <Arrow from={[2.65, -1.19, 0]} to={[3.63, -1.19, 0]} scene={scene} />
    </Part>
  </group>;
}

function ContactTank(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  const path: Point[] = [[-2.65, 0.21, -1.22], [-2.22, 0.21, 1.22], [-1.2, 0.21, 1.22],
    [-1.2, 0.21, -1.22], [0, 0.21, -1.22], [0, 0.21, 1.22],
    [1.2, 0.21, 1.22], [1.2, 0.21, -1.22], [2.65, 0.21, -1.22]];
  return <group>
    <Part id="contact-zone" scene={scene} offset={[0, 0, 0]}>
      <Tank length={6} width={3.4} floor={-1.65} top={0.4} cut={cut} openEnds />
      {/* End walls have ports in the first/last lanes, not the middle lane. */}
      {[-1, 1].map(s => <group key={s}>
        <Box at={[s * 3.1, -0.63, 0.42]} size={[0.2, 2.05, 2.56]} color={CONCRETE} />
        <Box at={[s * 3.1, -1.23, -1.28]} size={[0.2, 0.84, 0.84]} color={CONCRETE} />
        <Box at={[s * 3.1, 0.27, -1.28]} size={[0.2, 0.26, 0.84]} color={CONCRETE} />
      </group>)}
      <Water at={[0, -0.73, 0]} size={[5.95, 1.7, 3.35]} />
      {/* Explicit diagrammatic direction markers above water, not simulated trajectories. */}
      {path.slice(0, -1).map((p, i) => <Arrow key={i} from={p} to={path[i + 1]} scene={scene} />)}
    </Part>
    <Part id="baffles" scene={scene} offset={[0, 1.5, 0]}>
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => <Box key={x}
        at={[x, -0.65, i % 2 ? 0.425 : -0.425]} size={[0.16, 2, 2.55]} color={LIGHT} />)}
    </Part>
    <Part id="inlet" scene={scene} offset={[-0.5, 0.7, 0]}>
      <Shell at={[-3.53, -0.35, -1.22]} radius={0.23} thickness={0.05} length={1.05} color={LIGHT} />
      <Flange x={-4.0} y={-0.35} z={-1.22} radius={0.3} />
    </Part>
    <Part id="outlet" scene={scene} offset={[0.45, 0.7, 0]}>
      <Shell at={[3.55, -0.35, -1.22]} radius={0.23} thickness={0.05} length={1.1} color={LIGHT} />
      <Flange x={4.0} y={-0.35} z={-1.22} radius={0.3} />
    </Part>
    <Part id="sample-point" scene={scene} offset={[0, 1.35, 0.6]}>
      <Member from={[3.55, -0.35, -1.22]} to={[3.55, 0.63, -1.22]} radius={0.045} color={LIGHT} />
      <Tube points={[[3.55, 0.63, -1.22], [3.55, 0.63, -0.85], [3.55, 0.45, -0.75]]} radius={0.04} />
      <Cylinder at={[3.55, 0.31, -1.22]} radius={0.095} length={0.16} color={DARK} />
      <Ring at={[3.55, 0.44, -1.22]} radius={0.13} rotation={[Math.PI / 2, 0, 0]} color={STEEL} />
    </Part>
  </group>;
}

function UVReactor(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  return <group>
    <Box at={[0, -1.5, 0]} size={[5.3, 0.2, 2.4]} color={CONCRETE} />
    <Part id="reactor" scene={scene} offset={[0, 0.85, -1.6]}>
      <Shell at={[0, -0.2, 0]} radius={0.96} length={4.2} cut={cut} color={STEEL} opacity={cut ? 1 : 0.22} passive={!cut} />
      {[-2.1, 2.1].map(x => <group key={x}><UVHead x={x} />
        <Ring at={[x, -0.2, 0]} radius={0.95} tube={0.065} rotation={[0, Math.PI / 2, 0]} color={LIGHT} />
      </group>)}
      {[-1.45, 1.45].map(x => <Box key={x} at={[x, -1.26, 0]} size={[0.35, 0.43, 1.2]} color={STEEL} />)}
    </Part>
    <Part id="inlet" scene={scene} offset={[-0.65, 0, 0]}>
      <Shell at={[-2.95, -0.2, 0]} radius={0.24} thickness={0.055} length={1.7} color={LIGHT} />
      <Flange x={-3.73} y={-0.2} radius={0.33} />
      <Arrow from={[-3.55, 0.16, 0]} to={[-2.35, 0.16, 0]} scene={scene} />
    </Part>
    <Part id="lamps" scene={scene} offset={[-0.4, 0.75, 0.75]}>
      {[-0.38, 0.38].flatMap(y => [-0.38, 0.38].map(z => <group key={`${y}:${z}`}>
        <Cylinder at={[0, y - 0.2, z]} radius={0.053} length={4.55} rotation={X_AXIS} color={LIGHT} />
        <Cylinder at={[-2.37, y - 0.2, z]} radius={0.08} length={0.25} rotation={X_AXIS} color={DARK} />
      </group>))}
    </Part>
    <Part id="sleeves" scene={scene} offset={[0.35, -0.1, 1.5]}>
      {[-0.38, 0.38].flatMap(y => [-0.38, 0.38].map(z => <group key={`${y}:${z}`}>
        <Shell at={[0, y - 0.2, z]} radius={0.14} thickness={0.025} length={4.35} color={WATER} opacity={0.25} passive />
        {[-2.2, 2.2].map(x => <Shell key={x} at={[x, y - 0.2, z]} radius={0.16}
          thickness={0.055} length={0.14} color={LIGHT} />)}
      </group>))}
    </Part>
    <Part id="sensor" scene={scene} offset={[0, 0.8, 1.1]}>
      <Member from={[0.85, 0.3, 0.6]} to={[0.85, 0.3, 1.2]} radius={0.075} color={LIGHT} />
      <Box at={[0.85, 0.3, 1.3]} size={[0.37, 0.3, 0.25]} color={DARK} />
      <Ring at={[0.85, 0.3, 0.83]} radius={0.13} color={STEEL} />
    </Part>
    <Part id="outlet" scene={scene} offset={[0.65, 0, 0]}>
      <Shell at={[2.95, -0.2, 0]} radius={0.24} thickness={0.055} length={1.7} color={LIGHT} />
      <Flange x={3.73} y={-0.2} radius={0.33} />
      <Arrow from={[2.35, 0.16, 0]} to={[3.55, 0.16, 0]} scene={scene} />
    </Part>
  </group>;
}

function BarScreen(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  return <group>
    {(["upstream", "downstream"] as const).map((id, i) => <Part key={id} id={id} scene={scene}
      offset={[i ? 0.65 : -0.65, 0, 0]}>
      <group position={[i ? 1.45 : -1.55, 0, 0]}>
        <Tank length={i ? 3.1 : 2.9} width={2.2} floor={-1.4} top={0.3} cut={cut} openEnds />
        <Water at={[0, -0.8, 0]} size={[i ? 3.1 : 2.9, 1.05, 2.18]} />
        <Arrow from={[-0.85, -0.21, 0.6]} to={[0.85, -0.21, 0.6]} scene={scene} />
      </group>
    </Part>)}
    <Part id="bars" scene={scene} offset={[0, 0.65, -0.6]}>
      {/* Bars span the whole wetted depth across the channel, inclined to flow. */}
      {Array.from({ length: 17 }, (_, i) => <Member key={i} from={[-0.65, -1.38, -1.03 + i * 0.129]}
        to={[0.65, 1.23, -1.03 + i * 0.129]} radius={0.035} color={LIGHT} />)}
      {[-1.13, 1.13].map(z => <Member key={z} from={[-0.69, -1.38, z]} to={[0.69, 1.34, z]} radius={0.08} color={STEEL} />)}
      <Member from={[-0.65, -1.36, -1.1]} to={[-0.65, -1.36, 1.1]} radius={0.07} color={STEEL} />
    </Part>
    <Part id="rake" scene={scene} offset={[0.2, 1.35, 0.65]}>
      <Box at={[0.31, 0.62, 0]} size={[0.18, 0.16, 2.26]} color={DARK} />
      {Array.from({ length: 16 }, (_, i) => <Member key={i} from={[0.22, 0.56, -0.97 + i * 0.129]}
        to={[0.06, 0.25, -0.97 + i * 0.129]} radius={0.025} color={LIGHT} />)}
      {[-1.17, 1.17].map(z => <group key={z}>
        <Member from={[-0.56, -1.25, z]} to={[0.75, 1.38, z]} radius={0.035} color={DARK} />
        <Cylinder at={[0.75, 1.32, z]} radius={0.15} length={0.11} rotation={[Math.PI / 2, 0, 0]} color={STEEL} />
      </group>)}
      <Box at={[0.73, 1.41, 0]} size={[0.42, 0.3, 0.55]} color={STEEL} />
    </Part>
    <Part id="screenings" scene={scene} offset={[0.55, 0.75, 0]}>
      <Box at={[1.48, 1.02, 0]} size={[1.65, 0.12, 1.7]} rotation={[0, 0, -0.27]} color={LIGHT} />
      {[-0.87, 0.87].map(z => <Box key={z} at={[1.48, 1.14, z]} size={[1.65, 0.25, 0.1]}
        rotation={[0, 0, -0.27]} color={STEEL} />)}
      <Box at={[2.45, 0.55, 0]} size={[0.65, 0.58, 1.8]} color={STEEL} />
      {[0, 1, 2, 3, 4].map(i => <Box key={i} at={[1.15 + i * 0.2, 1.18 - i * 0.06, (i % 3 - 1) * 0.25]}
        size={[0.15, 0.07, 0.14]} rotation={[0, i * 0.5, 0]} color={DARK} />)}
    </Part>
  </group>;
}

function GritChamber(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  const screw = useMemo(() => Array.from({ length: 145 }, (_, i): Point => {
    const t = i / 144, a = t * Math.PI * 2 * 9;
    return [0.21 * Math.cos(a), 2.45 * t - 1.225, 0.21 * Math.sin(a)];
  }), []);
  const incline = useMemo(() => alignment([0.6, -1.45, 2.15], [2.2, 0.42, 2.15]), []);
  return <group>
    <Part id="chamber" scene={scene}>
      <Tank length={6} width={2.2} floor={-1.18} top={0.4} cut={cut} openEnds splitFloor />
      <Box at={[-1.35, -1.28, 0]} size={[3.3, 0.2, 2.6]} color={CONCRETE} />
      <Box at={[2.52, -1.28, 0]} size={[0.96, 0.2, 2.6]} color={CONCRETE} />
      <Water at={[0, -0.67, 0]} size={[6, 0.95, 2.18]} />
      <Arrow from={[-2.4, -0.15, 0.45]} to={[2.5, -0.15, 0.45]} scene={scene} />
    </Part>
    <Part id="inlet" scene={scene} offset={[-0.5, 0.4, 0]}>
      <Box at={[-3.45, -1.08, 0]} size={[0.9, 0.18, 2.3]} color={CONCRETE} />
      {[-1.15, 1.15].map(z => <Box key={z} at={[-3.45, -0.36, z]} size={[0.9, 1.6, 0.18]} color={CONCRETE} />)}
      <Arrow from={[-3.8, -0.15, 0]} to={[-3.05, -0.15, 0]} scene={scene} />
    </Part>
    <Part id="grit-hopper" scene={scene} offset={[0, 0.35, 0.8]}>
      {/* Four thick sloping panels form a mineral-grit pocket below the channel floor. */}
      {[-1, 1].map(s => <group key={s}>
        <Box at={[1.2 + s * 0.54, -1.48, 0]} size={[0.12, 0.79, 1.75]}
          rotation={[0, 0, s * -0.72]} color={STEEL} />
        {(!cut || s === -1) && <Box at={[1.2, -1.48, s * 0.61]} size={[1.72, 0.79, 0.12]}
          rotation={[s * 0.65, 0, 0]} color={STEEL} />}
      </group>)}
      <Box at={[1.2, -1.84, 0]} size={[0.68, 0.12, 0.8]} color={STEEL} />
      <Box at={[1.2, -1.73, 0]} size={[0.64, 0.1, 0.72]} color={SAND} />
      {Array.from({ length: 12 }, (_, i) => <Cylinder key={i} at={[0.98 + (i % 4) * 0.14, -1.65,
        -0.24 + Math.floor(i / 4) * 0.2]} radius={0.04} length={0.07} sides={6} color={SAND} />)}
    </Part>
    <Part id="classifier" scene={scene} offset={[0.35, 0.6, 0.55]}>
      <Tube points={[[1.2, -1.8, 0], [1.2, -1.8, 1.4], [0.6, -1.45, 2.15]]} radius={0.1} color={STEEL} />
      <group position={incline.mid} quaternion={incline.quaternion}>
        <group rotation={[0, 0, Math.PI / 2]}><Shell radius={0.31} thickness={0.065} length={2.45}
          cut color={LIGHT} /></group>
        <Cylinder radius={0.055} length={2.5} color={DARK} />
        <Tube points={screw} radius={0.043} color={STEEL} />
        <Cylinder at={[0, 1.43, 0]} radius={0.23} length={0.38} color={DARK} />
      </group>
      <Box at={[2.65, 0.23, 2.15]} size={[0.73, 0.5, 0.72]} color={STEEL} />
      <Box at={[2.65, 0.49, 2.15]} size={[0.61, 0.08, 0.6]} color={SAND} />
      <Member from={[1.7, -1.35, 2.15]} to={[1.7, -0.1, 2.15]} radius={0.075} color={STEEL} />
    </Part>
    <Part id="outlet" scene={scene} offset={[0.5, 0.4, 0]}>
      <Box at={[3.45, -1.08, 0]} size={[0.9, 0.18, 2.3]} color={CONCRETE} />
      {[-1.15, 1.15].map(z => <Box key={z} at={[3.45, -0.36, z]} size={[0.9, 1.6, 0.18]} color={CONCRETE} />)}
      <Arrow from={[3.05, -0.15, 0]} to={[3.8, -0.15, 0]} scene={scene} />
    </Part>
  </group>;
}

function LiftStation(scene: SceneProps) {
  return <group>
    <Part id="wet-well" scene={scene}>
      {/* Permanent inspection section keeps both bottom pumps visible at low camera angles. */}
      <Tank length={4.2} width={3.2} floor={-1.8} top={0.85} cut />
      <Water at={[0, -1.09, 0]} size={[4.15, 1.4, 3.15]} />
      <Box at={[1.55, -0.39, -1.57]} size={[0.65, 0.04, 0.065]} color={WATER} />
    </Part>
    <Part id="inlet" scene={scene} offset={[-0.75, 0.55, 0]}>
      <Shell at={[-2.87, -0.15, 0]} radius={0.3} thickness={0.065} length={1.65} color={LIGHT} />
      <Flange x={-3.6} y={-0.15} radius={0.39} />
      <Arrow from={[-3.4, 0.3, 0]} to={[-2.2, 0.3, 0]} scene={scene} />
    </Part>
    <Part id="pump" scene={scene} offset={[0, 0.3, 1.75]}>
      {[-0.75, 0.75].map(x => <group key={x}>
        <Cylinder at={[x, -1.43, 0.25]} radius={0.33} length={0.38} color={DARK} />
        <Cylinder at={[x, -0.99, 0.25]} radius={0.25} length={0.6} color={STEEL} />
        <Ring at={[x, -0.65, 0.25]} radius={0.17} tube={0.035} color={LIGHT} />
        <Box at={[x, -1.7, 0.25]} size={[0.76, 0.15, 0.7]} color={STEEL} />
        <Member from={[x, -1.43, 0.25]} to={[x, -1.43, 0.65]} radius={0.13} color={LIGHT} />
      </group>)}
    </Part>
    <Part id="riser" scene={scene} offset={[0.5, 1.1, -0.55]}>
      {[-0.75, 0.75].map(x => <group key={x}>
        <Tube points={[[x, -1.43, 0.65], [x, -1.2, 0.65], [x, 0.85, 0.65], [x, 1.05, 0.35],
          [x, 1.05, -1.45]]} radius={0.12} />
        <Member from={[x, 1.05, -1.95]} to={[x, 1.05, -2.35]} radius={0.12} color={LIGHT} />
        <Arrow from={[x + 0.22, -0.6, 0.65]} to={[x + 0.22, 0.6, 0.65]} scene={scene} />
      </group>)}
      <Member from={[-0.75, 1.05, -2.35]} to={[2.85, 1.05, -2.35]} radius={0.16} color={LIGHT} />
      <Flange x={2.8} y={1.05} z={-2.35} radius={0.26} />
    </Part>
    <Part id="check-valve" scene={scene} offset={[0.7, 1.8, -0.7]}>
      {[-0.75, 0.75].map(x => <group key={x}>
        <Cylinder at={[x, 1.05, -1.7]} radius={0.22} length={0.5} rotation={[Math.PI / 2, 0, 0]} color={STEEL} />
        <Cylinder at={[x, 1.28, -1.7]} radius={0.17} length={0.12} color={LIGHT} />
        <Box at={[x + 0.18, 1.11, -1.7]} size={[0.1, 0.15, 0.22]} color={DARK} />
        {[-1.46, -1.94].map(z => <Ring key={z} at={[x, 1.05, z]} radius={0.23} color={LIGHT} />)}
      </group>)}
    </Part>
    <Part id="level-sensor" scene={scene} offset={[-0.15, 1.65, 0]}>
      <Member from={[1.35, 1.12, 0.8]} to={[1.35, -0.25, 0.8]} radius={0.035} color={LIGHT} />
      <Box at={[1.35, 1.12, 0.8]} size={[0.3, 0.25, 0.25]} color={DARK} />
      <Cylinder at={[1.35, -0.24, 0.8]} radius={0.115} length={0.2} color={LIGHT} />
      <Member from={[1.35, 1.25, 0.8]} to={[1.35, 1.25, 1.8]} radius={0.05} color={STEEL} />
    </Part>
  </group>;
}

function ReducingValve(scene: SceneProps) {
  const cut = scene.view === "cutaway" || scene.view === "exploded";
  const spring = useMemo(() => Array.from({ length: 97 }, (_, i): Point => {
    const t = i / 96, a = t * Math.PI * 12;
    return [1.2 + 0.12 * Math.cos(a), 1.27 + 0.4 * t, 0.95 + 0.12 * Math.sin(a)];
  }), []);
  return <group>
    <Box at={[0, -1.45, 0]} size={[6.5, 0.2, 2.8]} color={CONCRETE} />
    <Part id="inlet" scene={scene} offset={[-0.7, 0, 0]}>
      <Shell at={[-2.25, -0.45, 0]} radius={0.3} thickness={0.07} length={2.8} color={LIGHT} />
      <Flange x={-3.55} y={-0.45} radius={0.42} />
      <Arrow from={[-3.2, 0, 0]} to={[-1.25, 0, 0]} scene={scene} />
    </Part>
    <Part id="diaphragm" scene={scene} offset={[0, 1.15, -0.65]}>
      {/* Globe-pattern body/seat with a diaphragm-controlled plug, not a gate. */}
      <group position={[0, -0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Shell radius={0.86} thickness={0.14} length={1.4} cut={cut} color={STEEL} opacity={cut ? 1 : 0.27} passive={!cut} />
      </group>
      <Ring at={[0, -0.62, 0]} radius={0.4} tube={0.06} rotation={[Math.PI / 2, 0, 0]} color={LIGHT} />
      <Cylinder at={[0, -0.42, 0]} radius={0.37} length={0.1} color={DARK} />
      {/* A stepped partition routes inlet below, outlet above the horizontal seat. */}
      <group position={[0, -0.63, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Shell radius={0.72} thickness={0.32} length={0.09} color={LIGHT} />
      </group>
      <Box at={[-0.66, -0.11, 0]} size={[0.08, 0.96, 0.73]} color={STEEL} />
      <Box at={[0.66, -0.88, 0]} size={[0.08, 0.41, 0.73]} color={STEEL} />
      <Member from={[0, -0.42, 0]} to={[0, 0.47, 0]} radius={0.07} color={LIGHT} />
      <Cylinder at={[0, 0.43, 0]} radius={0.84} length={0.085} color={DARK} />
      <Ring at={[0, 0.46, 0]} radius={0.87} tube={0.085} rotation={[Math.PI / 2, 0, 0]} color={LIGHT} />
      {/* Upper bonnet encloses the pilot-controlled chamber above the membrane. */}
      <group position={[0, 0.83, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Shell radius={0.83} thickness={0.11} length={0.66} cut={cut} color={LIGHT} opacity={cut ? 1 : 0.23} passive={!cut} />
      </group>
      <Cylinder at={[0, 1.17, 0]} radius={0.81} length={0.1} color={STEEL} />
      {Array.from({ length: 10 }, (_, i) => <Cylinder key={i} at={[Math.cos(i * Math.PI / 5) * 0.87,
        0.53, Math.sin(i * Math.PI / 5) * 0.87]} radius={0.04} length={0.23} sides={6} color={DARK} />)}
      <Box at={[0, -1.28, 0]} size={[1.1, 0.22, 1.2]} color={STEEL} />
    </Part>
    <Part id="strainer" scene={scene} offset={[-0.45, 0.55, 0.65]}>
      {/* Small Y-strainer in upstream PILOT supply only; main bore is unobstructed. */}
      <Member from={[-1.8, 0.78, 0.95]} to={[-1.12, 0.78, 0.95]} radius={0.09} color={STEEL} />
      <Member from={[-1.48, 0.78, 0.95]} to={[-1.26, 0.48, 0.95]} radius={0.12} color={LIGHT} />
      <Cylinder at={[-1.25, 0.47, 0.95]} radius={0.14} length={0.1} color={DARK} />
    </Part>
    <Part id="pilot" scene={scene} offset={[0.55, 0.55, 0.75]}>
      <Tube points={[[-2.0, -0.45, 0.1], [-2.0, 0.35, 0.75], [-1.8, 0.78, 0.95]]} radius={0.04} />
      <Tube points={[[-1.12, 0.78, 0.95], [0.4, 0.78, 0.95], [1.2, 0.91, 0.95]]} radius={0.04} />
      <Cylinder at={[1.2, 1.03, 0.95]} radius={0.23} length={0.35} color={STEEL} />
      <Cylinder at={[1.2, 1.21, 0.95]} radius={0.28} length={0.08} color={LIGHT} />
      <Tube points={[[1.0, 1.03, 0.95], [0.4, 1.35, 0.75], [0, 1.35, 0], [0, 1.18, 0]]} radius={0.045} />
      <Tube points={[[1.4, 1.03, 0.95], [2.5, 0.95, 0.95], [2.5, -0.45, 0.1]]} radius={0.035} />
    </Part>
    <Part id="spring" scene={scene} offset={[0.55, 1.05, 0.75]}>
      {/* Adjustment spring belongs to the downstream-sensing pilot, not main seat. */}
      <Tube points={spring} radius={0.024} color={DARK} />
      <group position={[1.2, 1.47, 0.95]} rotation={[0, 0, Math.PI / 2]}>
        <Shell radius={0.2} thickness={0.035} length={0.43} cut={cut} color={LIGHT} opacity={cut ? 1 : 0.2} passive={!cut} />
      </group>
      <Cylinder at={[1.2, 1.72, 0.95]} radius={0.21} length={0.11} color={STEEL} />
      <Cylinder at={[1.2, 1.86, 0.95]} radius={0.07} length={0.2} sides={6} color={DARK} />
    </Part>
    <Part id="outlet" scene={scene} offset={[0.7, 0, 0]}>
      <Shell at={[2.25, -0.45, 0]} radius={0.3} thickness={0.07} length={2.8} color={LIGHT} />
      <Flange x={3.55} y={-0.45} radius={0.42} />
      <Arrow from={[1.25, 0, 0]} to={[3.2, 0, 0]} scene={scene} />
    </Part>
  </group>;
}

/**
 * Conceptual teaching assemblies, deliberately not CAD or hydraulic simulations.
 * Stage owns Canvas/camera/lights/controls and reduced-motion. Slug dispatch keeps
 * this module compatible until the parent extends the registry's sceneId union.
 * Unknown slugs render nothing rather than silently showing unrelated equipment.
 */
export default function EquipmentUnitScene({ equipment, ...scene }: EquipmentUnitSceneProps) {
  switch (equipment.slug) {
    case "centrifugal-pump": return <Pump {...scene} />;
    case "rapid-gravity-filter": return <GravityFilter {...scene} />;
    case "chlorine-contact-tank": return <ContactTank {...scene} />;
    case "uv-reactor": return <UVReactor {...scene} />;
    case "bar-screen": return <BarScreen {...scene} />;
    case "grit-chamber": return <GritChamber {...scene} />;
    case "lift-station": return <LiftStation {...scene} />;
    case "pressure-reducing-valve": return <ReducingValve {...scene} />;
    default: return null;
  }
}
