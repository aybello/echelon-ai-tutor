import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type {
  EquipmentDefinition,
  EquipmentView,
} from "@shared/equipmentRegistry";
import {
  createTankEndShape,
  EQUIPMENT_TANK_PORTS,
  type TankEndPorts,
  type TankPort,
} from "../lib/equipmentTankGeometry";
import { createPRVBodyGeometry, PRV_BODY } from "../lib/equipmentValveGeometry";
import {
  createPumpVoluteGeometry,
  PUMP_DISCHARGE,
} from "../lib/equipmentPumpGeometry";
import {
  createGritFloorShape,
  createGritHopperGeometry,
  GRIT_HOPPER,
} from "../lib/equipmentGritGeometry";

type Point = [number, number, number];
export interface EquipmentUnitSceneProps {
  equipment: EquipmentDefinition;
  view: EquipmentView;
  activePart: string;
  onSelectPart: (id: string) => void;
  animate: boolean;
}
type SceneProps = Omit<EquipmentUnitSceneProps, "equipment">;
const TEAL = "#0891a3",
  STEEL = "#92aab5",
  LIGHT = "#dce7eb",
  DARK = "#455f70",
  CONCRETE = "#bbc9ce",
  WATER = "#48b8c5",
  SAND = "#bbac8e",
  TRIM = "#397c85";
const PI = Math.PI,
  TAU = 2 * PI,
  ZERO: Point = [0, 0, 0],
  X: Point = [0, 0, -PI / 2],
  Z: Point = [PI / 2, 0, 0],
  TURN: Point = [0, PI / 2, 0];
const seq = (n: number) => Array.from({ length: n }, (_, i) => i);
const section = (s: SceneProps) =>
  s.view === "exploded" || s.view === "cutaway";
const NO_RAYCAST = () => null;
const PartContext = createContext<{
  id: string;
  active: boolean;
  select: (id: string) => void;
} | null>(null);
function Part({
  id,
  scene,
  offset = ZERO,
  children,
}: {
  id: string;
  scene: SceneProps;
  offset?: Point;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ id, active: id === scene.activePart, select: scene.onSelectPart }),
    [id, scene.activePart, scene.onSelectPart]
  );
  return (
    <PartContext.Provider value={value}>
      <group
        name={`part:${id}`}
        position={scene.view === "exploded" ? offset : ZERO}
      >
        {children}
      </group>
    </PartContext.Provider>
  );
}
function usePartMesh(passive = false) {
  const p = useContext(PartContext);
  return {
    userData: p ? { equipmentPart: p.id } : {},
    ...(passive || !p
      ? { raycast: NO_RAYCAST }
      : {
          onClick: (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            p.select(p.id);
          },
        }),
  };
}
function Surface({
  color = STEEL,
  opacity = 1,
}: {
  color?: string;
  opacity?: number;
}) {
  const p = useContext(PartContext),
    mineral = color === CONCRETE || color === SAND;
  return (
    <meshStandardMaterial
      color={p?.active ? TEAL : color}
      emissive={p?.active ? TEAL : "#000000"}
      emissiveIntensity={p?.active ? 0.24 : 0}
      roughness={mineral ? 0.86 : 0.42}
      metalness={mineral ? 0 : 0.24}
      opacity={opacity}
      transparent={opacity < 1}
      depthWrite={opacity === 1}
      side={THREE.DoubleSide}
    />
  );
}
type Solid = {
  at?: Point;
  rot?: Point;
  color?: string;
  opacity?: number;
  passive?: boolean;
};
function Box({
  at = ZERO,
  rot = ZERO,
  size,
  color,
  opacity,
  passive,
}: Solid & { size: Point }) {
  return (
    <mesh
      position={at}
      rotation={rot}
      castShadow
      receiveShadow
      {...usePartMesh(passive)}
    >
      <boxGeometry args={size} />
      <Surface color={color} opacity={opacity} />
    </mesh>
  );
}
function Cylinder({
  at = ZERO,
  rot = ZERO,
  r,
  h,
  b = r,
  n = 28,
  color,
}: Solid & { r: number; h: number; b?: number; n?: number }) {
  return (
    <mesh position={at} rotation={rot} castShadow {...usePartMesh()}>
      <cylinderGeometry args={[r, b, h, n]} />
      <Surface color={color} />
    </mesh>
  );
}
function alignment(a: Point, b: Point) {
  const start = new THREE.Vector3(...a),
    d = new THREE.Vector3(...b).sub(start);
  return {
    mid: start.addScaledVector(d, 0.5),
    h: d.length(),
    q: new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize()
    ),
  };
}
function Member({
  a,
  b,
  r = 0.055,
  color,
}: {
  a: Point;
  b: Point;
  r?: number;
  color?: string;
}) {
  const pose = alignment(a, b);
  return (
    <group position={pose.mid} quaternion={pose.q}>
      <Cylinder r={r} h={pose.h} color={color} />
    </group>
  );
}
function Tube({
  points,
  r = 0.08,
  color = LIGHT,
}: {
  points: Point[];
  r?: number;
  color?: string;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
    [points]
  );
  return (
    <mesh castShadow {...usePartMesh()}>
      <tubeGeometry
        args={[curve, Math.max(24, points.length * 2), r, 12, false]}
      />
      <Surface color={color} />
    </mesh>
  );
}
function circle(
  s: THREE.Shape | THREE.Path,
  x: number,
  y: number,
  r: number,
  reverse = false
) {
  s.absarc(x, y, r, 0, TAU, reverse);
}
function hole(s: THREE.Shape, x: number, y: number, r: number) {
  const p = new THREE.Path();
  circle(p, x, y, r, true);
  s.holes.push(p);
}
function Plate({
  shape,
  depth,
  at = ZERO,
  rot = ZERO,
  color,
  opacity,
  passive,
  name,
}: Solid & { shape: THREE.Shape; depth: number; name?: string }) {
  return (
    <mesh
      name={name}
      position={at}
      rotation={rot}
      castShadow
      receiveShadow
      {...usePartMesh(passive)}
    >
      <extrudeGeometry
        args={[shape, { depth, bevelEnabled: false, curveSegments: 32 }]}
      />
      <Surface color={color} opacity={opacity} />
    </mesh>
  );
}
// Local axis X; section removes the near/top quadrant without capping the bore.
function Shell({
  at = ZERO,
  r,
  h,
  t = 0.06,
  cut = false,
  color = LIGHT,
  opacity,
  passive,
}: Solid & { r: number; h: number; t?: number; cut?: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (!cut) {
      circle(s, 0, 0, r);
      hole(s, 0, 0, r - t);
    } else {
      s.absarc(0, 0, r, PI, 2.5 * PI, false);
      s.lineTo(0, r - t);
      s.absarc(0, 0, r - t, 2.5 * PI, PI, true);
      s.closePath();
    }
    return s;
  }, [r, t, cut]);
  return (
    <Plate
      at={[at[0] - h / 2, at[1], at[2]]}
      rot={TURN}
      shape={shape}
      depth={h}
      color={color}
      opacity={opacity}
      passive={passive}
    />
  );
}
function Flange({ at, r, bore }: { at: Point; r: number; bore: number }) {
  return (
    <group position={at}>
      <Shell r={r} t={r - bore} h={0.12} />
      {seq(6).map(i => (
        <Cylinder
          key={i}
          at={[
            0,
            (r - 0.043) * Math.cos((i * PI) / 3),
            (r - 0.043) * Math.sin((i * PI) / 3),
          ]}
          rot={X}
          r={0.027}
          h={0.165}
          n={6}
          color={DARK}
        />
      ))}
    </group>
  );
}
function Nozzle({
  at,
  r,
  h,
  sign,
  t = 0.05,
}: {
  at: Point;
  r: number;
  h: number;
  sign: number;
  t?: number;
}) {
  return (
    <group position={at}>
      <Shell r={r} h={h} t={t} />
      <Flange at={[sign * (h / 2 - 0.06), 0, 0]} r={r + 0.09} bore={r - t} />
    </group>
  );
}
// Primitive geometries are not owned by R3F. Dispose replaced section meshes as well as final ones.
function Fabrication({
  geometry,
  name,
  color,
}: {
  geometry: THREE.BufferGeometry;
  name: string;
  color?: string;
}) {
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name={name} castShadow receiveShadow {...usePartMesh()}>
      <primitive object={geometry} attach="geometry" />
      <Surface color={color} />
    </mesh>
  );
}
function Wall({
  x,
  w,
  f,
  top,
  port,
}: {
  x: number;
  w: number;
  f: number;
  top: number;
  port?: TankPort;
}) {
  const shape = useMemo(
    () => createTankEndShape(w, f, top, port),
    [w, f, top, port]
  );
  return (
    <Plate
      at={[x - 0.1, 0, 0]}
      rot={TURN}
      depth={0.2}
      shape={shape}
      color={CONCRETE}
    />
  );
}
function Tank({
  l,
  w,
  f,
  top,
  cut,
  ports,
  split = false,
}: {
  l: number;
  w: number;
  f: number;
  top: number;
  cut: boolean;
  ports?: TankEndPorts;
  split?: boolean;
}) {
  return (
    <>
      {!split && (
        <Box
          at={[0, f - 0.1, 0]}
          size={[l + 0.4, 0.2, w + 0.4]}
          color={CONCRETE}
        />
      )}
      {(cut ? [-1] : [-1, 1]).map(sign => (
        <group key={sign}>
          <Box
            at={[0, (f + top) / 2, sign * (w / 2 + 0.1)]}
            size={[l + 0.4, top - f, 0.2]}
            color={CONCRETE}
          />
          <Box
            at={[0, top + 0.032, sign * (w / 2 + 0.1)]}
            size={[l + 0.4, 0.064, 0.22]}
            color={STEEL}
          />
        </group>
      ))}
      {ports &&
        [-1, 1].map(s => (
          <Wall
            key={s}
            x={s * (l / 2 + 0.1)}
            w={w}
            f={f}
            top={top}
            port={s < 0 ? ports.left : ports.right}
          />
        ))}
    </>
  );
}
function Water({ at, size }: { at: Point; size: Point }) {
  return <Box at={at} size={size} color={WATER} opacity={0.17} passive />;
}
function Glyph() {
  return (
    <>
      <Cylinder r={0.025} h={0.26} color={WATER} />
      <Cylinder at={[0, 0.18, 0]} r={0} b={0.09} h={0.16} color={WATER} />
    </>
  );
}
function Travel({ a, b }: { a: Point; b: Point }) {
  const ref = useRef<THREE.Group>(null),
    phase = useRef(0.5),
    p = alignment(a, b);
  useFrame((_, dt) => {
    const t = (phase.current = (phase.current + Math.min(dt, 0.1) * 0.28) % 1);
    ref.current?.position.set(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    );
  });
  return (
    <group ref={ref} position={p.mid} quaternion={p.q}>
      <Glyph />
    </group>
  );
}
function Arrow({ a, b, s }: { a: Point; b: Point; s: SceneProps }) {
  const p = alignment(a, b);
  return s.animate && s.view !== "exploded" ? (
    <Travel a={a} b={b} />
  ) : (
    <group position={p.mid} quaternion={p.q}>
      <Glyph />
    </group>
  );
}
function Spinning({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.x += Math.min(dt, 0.1) * 1.8;
  });
  return <group ref={ref}>{children}</group>;
}
function Skid({ l, w, x = 0 }: { l: number; w: number; x?: number }) {
  return (
    <group position={[x, 0, 0]}>
      <Box at={[0, -1.58, 0]} size={[l, 0.24, w]} color={CONCRETE} />
      {[-1, 1].map(s => (
        <Box
          key={s}
          at={[0, -1.4, s * w * 0.29]}
          size={[l - 0.28, 0.12, 0.16]}
          color={DARK}
        />
      ))}
    </group>
  );
}
function Pump(s: SceneProps) {
  const cut = section(s),
    volute = useMemo(createPumpVoluteGeometry, []),
    p = PUMP_DISCHARGE;
  const wheel = (
    <>
      <Cylinder r={0.69} h={0.08} rot={X} color={DARK} />
      <Cylinder at={[-0.08, 0, 0]} r={0.105} h={0.14} rot={X} />
      {seq(7).map(i => (
        <group key={i} rotation={[(i * TAU) / 7, 0, 0]}>
          <Tube
            points={[
              [-0.1, 0.22, 0],
              [-0.1, 0.42, 0.09],
              [-0.1, 0.59, 0.24],
            ]}
            r={0.063}
          />
        </group>
      ))}
    </>
  );
  return (
    <>
      <Skid x={0.35} l={6.4} w={2.15} />
      <Part scene={s} id="suction" offset={[-1.1, 0, 0]}>
        <Nozzle at={[-2.35, -0.1, 0]} r={0.29} h={2.6} sign={-1} />
        <Flange at={[-1.1, -0.1, 0]} r={0.38} bore={0.24} />
        <Arrow a={[-3.32, 0.29, 0]} b={[-1.45, 0.29, 0]} s={s} />
      </Part>
      <Part scene={s} id="casing" offset={[0.1, 0.55, -0.8]}>
        <Fabrication geometry={volute} name="pump-ported-volute" />
        <Shell at={[-1.035, -0.1, 0]} r={1.09} t={0.85} h={0.1} cut={cut} />
        <Shell
          at={[-0.385, -0.1, 0]}
          r={1.1}
          t={0.93}
          h={0.09}
          cut={cut}
          color={STEEL}
        />
        <Box at={[-0.7, -1.22, 0]} size={[0.95, 0.32, 1.42]} color={STEEL} />
      </Part>
      <Part scene={s} id="impeller" offset={[-0.96, 0.25, 0.35]}>
        <group position={[-0.78, -0.1, 0]}>
          {s.animate && s.view !== "exploded" ? (
            <Spinning>{wheel}</Spinning>
          ) : (
            wheel
          )}
        </group>
        {!cut && (
          <group position={[-0.7, 0, 1.01]} rotation={[0.2, 0, 0]}>
            <Cylinder r={0.21} h={0.12} rot={Z} color={TRIM} />
            <Cylinder
              at={[0, 0, 0.075]}
              r={0.09}
              h={0.07}
              n={6}
              rot={Z}
              color={LIGHT}
            />
          </group>
        )}
      </Part>
      <Part scene={s} id="shaft" offset={[0.55, 0.75, 0.6]}>
        <Cylinder
          at={[0.51, -0.1, 0]}
          r={0.096}
          h={2.6}
          rot={X}
          color={LIGHT}
        />
        <Cylinder at={[0.49, -0.1, 0]} r={0.25} h={0.68} rot={X} />
        <Box at={[0.49, -0.82, 0]} size={[0.56, 1.08, 0.54]} />
        <Box at={[0.49, -1.33, 0]} size={[0.84, 0.13, 1.4]} />
        {[1.28, 1.5].map(x => (
          <Cylinder
            key={x}
            at={[x, -0.1, 0]}
            r={0.215}
            h={0.2}
            rot={X}
            color={TRIM}
          />
        ))}
      </Part>
      <Part scene={s} id="motor" offset={[1.15, 0, 0]}>
        <Cylinder at={[2.55, -0.1, 0]} r={0.55} h={1.67} rot={X} />
        {seq(12).map(i => (
          <group
            key={i}
            position={[2.52, -0.1, 0]}
            rotation={[(i * PI) / 6, 0, 0]}
          >
            <Box at={[0, 0.55, 0]} size={[1.28, 0.12, 0.056]} color={LIGHT} />
          </group>
        ))}
        <Cylinder at={[3.42, -0.1, 0]} r={0.58} h={0.25} rot={X} color={TRIM} />
        <Box at={[2.48, 0.53, 0]} size={[0.56, 0.31, 0.48]} color={DARK} />
        {[2.04, 3.04].map(x => (
          <Box key={x} at={[x, -0.97, 0]} size={[0.32, 0.78, 1.38]} />
        ))}
      </Part>
      <Part scene={s} id="discharge" offset={[0.7, 0.75, 0]}>
        <group
          position={[p.x, (p.bottom + p.top) / 2, p.z]}
          rotation={[0, 0, PI / 2]}
        >
          <Nozzle at={ZERO} r={p.radius} h={p.top - p.bottom} sign={1} />
        </group>
        <Arrow a={[-0.25, 1.06, p.z]} b={[-0.25, 1.65, p.z]} s={s} />
      </Part>
    </>
  );
}
function GravityFilter(s: SceneProps) {
  const spec = EQUIPMENT_TANK_PORTS.filter;
  return (
    <>
      <Tank
        l={4.8}
        w={3.2}
        f={spec.floor}
        top={0.98}
        ports={spec.ends}
        cut={section(s)}
      />
      <Part scene={s} id="inlet" offset={[-0.65, 0.5, 0]}>
        <Nozzle at={[-3.05, 0.35, 0]} r={0.22} h={1.4} sign={-1} />
        <Box at={[-2.09, 0.12, 0]} size={[0.64, 0.09, 0.94]} />
        <Arrow a={[-3.52, 0.72, 0]} b={[-2.63, 0.72, 0]} s={s} />
      </Part>
      <Part scene={s} id="supernatant" offset={[0, 1.55, 0]}>
        <Water at={[0, 0.085, 0]} size={[4.78, 0.67, 3.18]} />
        <Box
          at={[-1.68, 0.58, -1.53]}
          size={[0.24, 0.88, 0.09]}
          color={LIGHT}
        />
        {seq(5).map(i => (
          <Box
            key={i}
            at={[-1.68, 0.24 + 0.16 * i, -1.469]}
            size={[i % 2 ? 0.09 : 0.17, 0.028, 0.04]}
            color={DARK}
          />
        ))}
        <Arrow a={[-1, 0.55, 0.5]} b={[-1, -0.12, 0.5]} s={s} />
      </Part>
      <Part scene={s} id="media" offset={[0, 0.72, -0.2]}>
        <Box at={[0, -0.63, 0]} size={[4.76, 0.76, 3.16]} color={SAND} />
        <Box at={[0, -1.1, 0]} size={[4.76, 0.18, 3.16]} color={DARK} />
        <Box at={[0, -1.27, 0]} size={[4.76, 0.16, 3.16]} color={STEEL} />
        {seq(24).map(i => (
          <Cylinder
            key={i}
            at={[-2.12 + (i % 8) * 0.59, -0.248, -1 + (i % 3) * 1.01]}
            r={0.066}
            h={0.04}
            n={7}
            color="#aa9c80"
          />
        ))}
        <Box at={[0, -0.74, 1.83]} size={[0.45, 1.16, 0.08]} color={DARK} />
        <Box at={[0, -0.64, 1.88]} size={[0.31, 0.74, 0.04]} color={SAND} />
      </Part>
      <Part scene={s} id="underdrain" offset={[0, 0.36, 1.95]}>
        <Shell at={[0, -1.49, 0]} r={0.14} h={4.81} t={0.035} />
        {seq(8).map(i => (
          <group key={i} position={[-2.1 + i * 0.58, -1.49, 0]}>
            <Member a={[0, 0, -1.48]} b={[0, 0, 1.48]} r={0.065} />
            {[-1, -0.48, 0.48, 1].map(z => (
              <Cylinder
                key={z}
                at={[0, 0.085, z]}
                r={0.046}
                h={0.08}
                color={DARK}
              />
            ))}
          </group>
        ))}
        <Tube
          points={[
            [-2.1, -1.49, 1.42],
            [-2.1, -1.49, 1.96],
            [-2.1, -1.2, 2.02],
            [-2.1, 0.1, 2.02],
          ]}
          r={0.09}
        />
        <Cylinder
          at={[-2.1, 0.12, 2.02]}
          r={0.145}
          h={0.12}
          n={8}
          color={TRIM}
        />
      </Part>
      <Part scene={s} id="wash-trough" offset={[0, 1.65, -0.65]}>
        <Box at={[0.76, 0.58, 0]} size={[0.67, 0.1, 3.17]} color={LIGHT} />
        {[-1, 1].map(k => (
          <Box
            key={k}
            at={[0.76 + k * 0.31, 0.78, 0]}
            size={[0.07, 0.38, 3.17]}
          />
        ))}
        <Tube
          points={[
            [0.76, 0.66, -1.54],
            [0.76, 0.66, -1.97],
            [1.55, 0.66, -2.04],
          ]}
          r={0.12}
        />
      </Part>
      <Part scene={s} id="outlet" offset={[0.58, 0.45, 0]}>
        <Nozzle at={[3.08, -1.49, 0]} r={0.18} h={1.4} sign={1} />
        <Arrow a={[2.71, -1.17, 0]} b={[3.62, -1.17, 0]} s={s} />
      </Part>
    </>
  );
}
function ContactTank(s: SceneProps) {
  const spec = EQUIPMENT_TANK_PORTS.contactTank,
    path: Point[] = [
      [-2.52, 0.22, -1.22],
      [-2.52, 0.22, 1.27],
      [-1.22, 0.22, 1.27],
      [-1.22, 0.22, -1.27],
      [0, 0.22, -1.27],
      [0, 0.22, 1.27],
      [1.22, 0.22, 1.27],
      [1.22, 0.22, -1.27],
      [2.67, 0.22, -1.27],
    ];
  return (
    <>
      <Part scene={s} id="contact-zone">
        <Tank
          l={6}
          w={3.4}
          f={spec.floor}
          top={0.4}
          ports={spec.ends}
          cut={section(s)}
        />
        <Water at={[0, -0.75, 0]} size={[5.98, 1.74, 3.38]} />
        {path.slice(1).map((b, i) => (
          <Arrow key={i} a={path[i]} b={b} s={s} />
        ))}
      </Part>
      <Part scene={s} id="baffles" offset={[0, 1.58, 0]}>
        {[-1.8, -0.6, 0.6, 1.8].map((x, i) => {
          const k = i % 2 ? 1 : -1;
          return (
            <group key={x}>
              <Box
                at={[x, -0.65, k * 0.425]}
                size={[0.14, 2, 2.55]}
                color={LIGHT}
              />
              <Box
                at={[x, 0.36, k * 0.425]}
                size={[0.18, 0.08, 2.55]}
                color={TRIM}
              />
              <Box at={[x, -0.62, k * 1.65]} size={[0.25, 2.06, 0.1]} />
            </group>
          );
        })}
      </Part>
      {[-1, 1].map(k => (
        <Part
          key={k}
          scene={s}
          id={k < 0 ? "inlet" : "outlet"}
          offset={[k * 0.52, 0.72, 0]}
        >
          <Nozzle at={[k * 3.54, -0.35, -1.22]} r={0.23} h={1.1} sign={k} />
        </Part>
      ))}
      <Part scene={s} id="sample-point" offset={[0, 1.28, 0.65]}>
        <Member a={[3.55, -0.13, -1.22]} b={[3.55, 0.61, -1.22]} r={0.05} />
        <Box at={[3.36, 0.23, -1.22]} size={[0.4, 0.07, 0.16]} />
        <Cylinder at={[3.55, 0.5, -1.22]} r={0.105} h={0.18} color={TRIM} />
        <Tube
          points={[
            [3.55, 0.52, -1.22],
            [3.55, 0.52, -0.9],
            [3.55, 0.39, -0.82],
          ]}
          r={0.046}
        />
        <Box at={[3.55, 0.67, -1.22]} size={[0.36, 0.065, 0.09]} color={DARK} />
      </Part>
    </>
  );
}
function UVHead({ x }: { x: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    circle(s, 0, 0, 0.99);
    hole(s, 0, 0, 0.24);
    for (const a of [-0.38, 0.38])
      for (const b of [-0.38, 0.38]) hole(s, a, b, 0.14);
    return s;
  }, []);
  return (
    <Plate
      at={[x - 0.05, -0.2, 0]}
      rot={TURN}
      shape={shape}
      depth={0.1}
      color={LIGHT}
    />
  );
}
function UVReactor(s: SceneProps) {
  return (
    <>
      <Skid l={5.4} w={2} />
      <Part scene={s} id="reactor" offset={[0, 0.95, -1.65]}>
        <Shell
          at={[0, -0.2, 0]}
          r={0.96}
          t={0.09}
          h={4.12}
          cut={section(s)}
          color={STEEL}
        />
        {[-1, 1].map(k => (
          <group key={k}>
            <UVHead x={k * 2.1} />
            <Box at={[k * 1.45, -1.23, 0]} size={[0.36, 0.29, 1.38]} />
            {[-1, 1].map(j => (
              <Box
                key={j}
                at={[k * 1.45, -1.08, j * 0.57]}
                rot={[j * 0.5, 0, 0]}
                size={[0.36, 0.45, 0.2]}
                color={TRIM}
              />
            ))}
          </group>
        ))}
      </Part>
      {[-1, 1].map(k => (
        <Part
          key={k}
          scene={s}
          id={k < 0 ? "inlet" : "outlet"}
          offset={[k * 0.72, 0, 0]}
        >
          <Nozzle at={[k * 2.97, -0.2, 0]} r={0.24} h={1.72} sign={k} />
          <Arrow
            a={[k * 2.97 - 0.52, 0.2, 0]}
            b={[k * 2.97 + 0.52, 0.2, 0]}
            s={s}
          />
        </Part>
      ))}
      <Part scene={s} id="lamps" offset={[-0.72, 1.08, 0.64]}>
        {[-0.38, 0.38].flatMap(y =>
          [-0.38, 0.38].map(z => (
            <group key={`${y}:${z}`} position={[0, y - 0.2, z]}>
              <Cylinder r={0.055} h={4.6} rot={X} color={LIGHT} />
              {[-1, 1].map(k => (
                <Cylinder
                  key={k}
                  at={[k * 2.34, 0, 0]}
                  r={0.087}
                  h={0.18}
                  rot={X}
                  color={TRIM}
                />
              ))}
            </group>
          ))
        )}
      </Part>
      <Part scene={s} id="sleeves" offset={[0.55, 0.08, 1.65]}>
        {[-0.38, 0.38].flatMap(y =>
          [-0.38, 0.38].map(z => (
            <group key={`${y}:${z}`} position={[0, y - 0.2, z]}>
              <Shell
                r={0.14}
                h={4.39}
                t={0.024}
                color={WATER}
                opacity={0.26}
                passive
              />
              {[-1, 1].map(k => (
                <Shell
                  key={k}
                  at={[k * 2.19, 0, 0]}
                  r={0.174}
                  h={0.15}
                  t={0.09}
                  color={DARK}
                />
              ))}
            </group>
          ))
        )}
      </Part>
      <Part scene={s} id="sensor" offset={[0.1, 0.9, 1.18]}>
        <Member a={[0.8, 0.25, 0.53]} b={[0.8, 0.25, 1.22]} r={0.084} />
        <Cylinder at={[0.8, 0.25, 0.86]} r={0.155} h={0.13} rot={Z} n={6} />
        <Box at={[0.8, 0.25, 1.32]} size={[0.39, 0.35, 0.27]} color={DARK} />
        <Box at={[0.8, 0.26, 1.465]} size={[0.26, 0.15, 0.025]} color={WATER} />
      </Part>
    </>
  );
}
function Bin({ at, w, l, h }: { at: Point; w: number; l: number; h: number }) {
  return (
    <group position={at}>
      <Box size={[l, 0.08, w]} color={DARK} />
      {[-1, 1].map(k => (
        <group key={k}>
          <Box at={[k * (l / 2 - 0.035), h / 2, 0]} size={[0.07, h, w]} />
          <Box
            at={[0, h / 2, k * (w / 2 - 0.035)]}
            size={[l - 0.14, h, 0.07]}
          />
        </group>
      ))}
    </group>
  );
}
function BarScreen(s: SceneProps) {
  return (
    <>
      {[-1, 1].map(k => (
        <Part
          key={k}
          scene={s}
          id={k < 0 ? "upstream" : "downstream"}
          offset={[k * 0.72, 0, 0]}
        >
          <group position={[k * 1.6, 0, 0]}>
            <Tank l={2.8} w={2.2} f={-1.4} top={0.3} cut={section(s)} />
            <Water at={[0, -0.82, 0]} size={[3.19, 1.12, 2.18]} />
            <Arrow a={[-1, -0.17, 0.42]} b={[1, -0.17, 0.42]} s={s} />
          </group>
        </Part>
      ))}
      <Part scene={s} id="bars" offset={[-0.24, 0.72, -0.82]}>
        {seq(17).map(i => (
          <Box
            key={i}
            at={[0, -0.072, -1.03 + i * 0.129]}
            rot={[0, 0, -0.46]}
            size={[0.078, 2.91, 0.055]}
            color={LIGHT}
          />
        ))}
        {[-1.09, 1.09].map(z => (
          <Member key={z} a={[-0.67, -1.38, z]} b={[0.7, 1.37, z]} r={0.078} />
        ))}
        <Member a={[-0.65, -1.35, -1.09]} b={[-0.65, -1.35, 1.09]} r={0.063} />
      </Part>
      <Part scene={s} id="rake" offset={[0.15, 1.18, 0.8]}>
        <Box at={[0.29, 0.63, 0]} size={[0.18, 0.16, 2.28]} color={TRIM} />
        {seq(16).map(i => (
          <Member
            key={i}
            a={[0.22, 0.58, -0.965 + i * 0.129]}
            b={[0.04, 0.23, -0.965 + i * 0.129]}
            r={0.026}
            color={LIGHT}
          />
        ))}
        <Member a={[0.7, 1.31, -1.23]} b={[0.7, 1.31, 1.32]} r={0.09} />
        {[-1.16, 1.16].map(z => (
          <group key={z}>
            <Member
              a={[-0.56, -1.18, z]}
              b={[0.7, 1.31, z]}
              r={0.045}
              color={DARK}
            />
            <Cylinder at={[0.7, 1.31, z]} rot={Z} r={0.18} h={0.14} />
          </group>
        ))}
        <Box at={[0.7, 1.31, 1.47]} size={[0.44, 0.4, 0.33]} color={TRIM} />
      </Part>
      <Part scene={s} id="screenings" offset={[0.65, 0.76, 0]}>
        <group position={[1.48, 1.03, 0]} rotation={[0, 0, -0.28]}>
          <Box size={[1.62, 0.09, 1.64]} color={LIGHT} />
          {[-0.83, 0.83].map(z => (
            <Box key={z} at={[0, 0.11, z]} size={[1.62, 0.24, 0.08]} />
          ))}
          {seq(5).map(i => (
            <Box
              key={i}
              at={[-0.5 + i * 0.23, 0.085, ((i % 3) - 1) * 0.32]}
              rot={[0, i * 0.8, 0]}
              size={[0.19, 0.07, 0.11]}
              color={DARK}
            />
          ))}
        </group>
        <Bin at={[2.5, 0.29, 0]} w={1.83} l={0.86} h={0.47} />
        {[-1.12, 1.12].map(z => (
          <Box key={z} at={[2.5, 0.35, z]} size={[1, 0.09, 0.64]} />
        ))}
      </Part>
    </>
  );
}
function GritChamber(s: SceneProps) {
  const cut = section(s),
    floor = useMemo(createGritFloorShape, []),
    hopper = useMemo(() => createGritHopperGeometry(cut), [cut]),
    pose = alignment([0.6, -1.45, 2.15], [2.2, 0.42, 2.15]);
  const screw = useMemo(
    () =>
      seq(145).map((i): Point => [
        0.214 * Math.cos((i * PI) / 8),
        (2.45 * i) / 144 - 1.225,
        0.214 * Math.sin((i * PI) / 8),
      ]),
    []
  );
  return (
    <>
      <Part scene={s} id="chamber">
        <Tank l={6} w={2.2} f={GRIT_HOPPER.topY} top={0.4} cut={cut} split />
        <group name="grit-bounded-floor">
          <Plate
            name="grit-bounded-floor"
            shape={floor}
            depth={0.2}
            at={[0, GRIT_HOPPER.topY, 0]}
            rot={Z}
            color={CONCRETE}
          />
        </group>
        <Water at={[0, -0.67, 0]} size={[6, 0.96, 2.18]} />
        <Arrow a={[-2.5, -0.11, -0.45]} b={[2.55, -0.11, -0.45]} s={s} />
      </Part>
      {[-1, 1].map(k => (
        <Part
          key={k}
          scene={s}
          id={k < 0 ? "inlet" : "outlet"}
          offset={[k * 0.55, 0.48, 0]}
        >
          <group position={[k * 3.59, 0, 0]}>
            <Tank l={0.38} w={2.2} f={-1.18} top={0.4} cut={cut} />
            <Arrow a={[-0.25, -0.15, 0]} b={[0.25, -0.15, 0]} s={s} />
          </group>
        </Part>
      ))}
      <Part scene={s} id="grit-hopper" offset={[0, 0.5, 1.02]}>
        <Fabrication geometry={hopper} name="grit-sealed-hopper" />
        <Box at={[1.2, -1.78, 0]} size={[0.62, 0.11, 0.73]} color={SAND} />
        {seq(12).map(i => (
          <Cylinder
            key={i}
            at={[0.99 + (i % 4) * 0.14, -1.7, -0.25 + Math.floor(i / 4) * 0.22]}
            r={0.046}
            h={0.07}
            n={7}
            color={SAND}
          />
        ))}
        <Member a={[1.21, -1.7, -0.31]} b={[1.21, 0.57, -0.31]} r={0.034} />
        <Box at={[1.21, 0.55, -0.8]} size={[0.16, 0.09, 1.04]} />
        <Cylinder at={[1.21, 0.66, -0.31]} r={0.115} h={0.16} color={TRIM} />
      </Part>
      <Part scene={s} id="classifier" offset={[0.4, 0.68, 0.7]}>
        <Tube
          points={[
            [1.2, -1.76, 0.32],
            [1.2, -1.76, 1.35],
            [0.6, -1.45, 2.15],
          ]}
          r={0.1}
        />
        <group position={pose.mid} quaternion={pose.q}>
          <group rotation={[0, 0, PI / 2]}>
            <Shell r={0.31} t={0.048} h={2.45} cut />
          </group>
          <Cylinder r={0.058} h={2.56} color={DARK} />
          <Tube points={screw} r={0.05} color={STEEL} />
          <Cylinder at={[0, 1.43, 0]} r={0.23} h={0.38} color={TRIM} />
        </group>
        <Bin at={[2.65, -0.31, 2.15]} l={0.88} w={0.79} h={0.49} />
        {[1.42, 1.88].map(x => (
          <Member
            key={x}
            a={[x, -1.49, 2.15]}
            b={[x, -1.45 + (x - 0.6) * 1.17, 2.15]}
            r={0.066}
          />
        ))}
        <Box at={[1.65, -1.54, 2.15]} size={[1.08, 0.12, 0.59]} />
      </Part>
    </>
  );
}
function LiftStation(s: SceneProps) {
  const spec = EQUIPMENT_TANK_PORTS.liftStation;
  return (
    <>
      <Part scene={s} id="wet-well">
        <Tank l={4.2} w={3.2} f={spec.floor} top={0.85} ports={spec.ends} cut />
        <Water at={[0, -1.09, 0]} size={[4.18, 1.4, 3.18]} />
        <Box at={[0, 0.88, 1.7]} size={[4.57, 0.13, 0.17]} />
      </Part>
      <Part scene={s} id="inlet" offset={[-0.75, 0.55, 0]}>
        <Nozzle at={[-2.88, -0.15, 0]} r={0.3} t={0.065} h={1.66} sign={-1} />
        <Arrow a={[-3.45, 0.28, 0]} b={[-2.42, 0.28, 0]} s={s} />
      </Part>
      <Part scene={s} id="pump" offset={[0, 0.45, 1.7]}>
        {[-0.75, 0.75].map(x => (
          <group key={x} position={[x, 0, 0]}>
            <Box at={[0, -1.72, 0.26]} size={[0.78, 0.15, 0.76]} />
            <Cylinder at={[0, -1.45, 0.26]} r={0.345} h={0.39} color={DARK} />
            <Cylinder at={[0, -1, 0.26]} r={0.26} h={0.58} />
            <Cylinder
              at={[0, -0.7, 0.26]}
              r={0.24}
              b={0.27}
              h={0.1}
              color={TRIM}
            />
            <Tube
              points={[
                [0, -0.68, 0.11],
                [0, -0.51, 0.13],
                [0, -0.51, 0.39],
                [0, -0.68, 0.41],
              ]}
              r={0.038}
            />
            <Member a={[0, -1.43, 0.25]} b={[0, -1.43, 0.68]} r={0.13} />
            {[-0.19, 0.19].map(dx => (
              <Member
                key={dx}
                a={[dx, -1.67, -0.09]}
                b={[dx, 0.94, -0.09]}
                r={0.042}
              />
            ))}
            <Box at={[0, 0.92, -0.09]} size={[0.51, 0.09, 0.16]} color={TRIM} />
          </group>
        ))}
      </Part>
      <Part scene={s} id="riser" offset={[0.48, 1.07, -0.6]}>
        {[-0.75, 0.75].map(x => (
          <group key={x}>
            <Member
              a={[x, -1.43, 0.65]}
              b={[x, 0.84, 0.65]}
              r={0.12}
              color={LIGHT}
            />
            <Tube
              points={[
                [x, 0.84, 0.65],
                [x, 0.99, 0.61],
                [x, 1.05, 0.49],
                [x, 1.05, 0.36],
              ]}
              r={0.12}
            />
            <Member
              a={[x, 1.05, 0.36]}
              b={[x, 1.05, -1.45]}
              r={0.12}
              color={LIGHT}
            />
            <Member
              a={[x, 1.05, -1.95]}
              b={[x, 1.05, -2.35]}
              r={0.12}
              color={LIGHT}
            />
            <Arrow
              a={[x + 0.23, -0.6, 0.65]}
              b={[x + 0.23, 0.64, 0.65]}
              s={s}
            />
          </group>
        ))}
        <Shell at={[1.02, 1.05, -2.35]} r={0.16} h={3.76} t={0.045} />
        <Cylinder at={[-0.86, 1.05, -2.35]} r={0.16} h={0.06} rot={X} />
        <Flange at={[2.85, 1.05, -2.35]} r={0.25} bore={0.115} />
      </Part>
      <Part scene={s} id="check-valve" offset={[0.72, 1.76, -0.76]}>
        {[-0.75, 0.75].map(x => (
          <group key={x} position={[x, 1.05, -1.7]}>
            <Cylinder r={0.213} h={0.5} rot={Z} />
            <Cylinder at={[0, 0.19, 0]} r={0.17} h={0.16} color={LIGHT} />
            <Box
              at={[0.215, 0.05, 0]}
              rot={[0.42, 0, 0]}
              size={[0.1, 0.095, 0.32]}
              color={TRIM}
            />
            {[-0.235, 0.235].map(z => (
              <Cylinder key={z} at={[0, 0, z]} r={0.23} h={0.062} rot={Z} />
            ))}
          </group>
        ))}
      </Part>
      <Part scene={s} id="level-sensor" offset={[0.02, 1.57, 0.25]}>
        <Box at={[1.43, 1.03, 1.7]} size={[0.18, 0.3, 0.16]} />
        <Box at={[1.43, 1.21, 1.25]} size={[0.15, 0.1, 1.04]} />
        <Box at={[1.43, 1.19, 0.8]} size={[0.31, 0.26, 0.29]} color={TRIM} />
        <Member a={[1.43, 1.11, 0.8]} b={[1.43, -0.32, 0.8]} r={0.034} />
        <Cylinder
          at={[1.43, -0.29, 0.8]}
          r={0.14}
          b={0.095}
          h={0.25}
          color={LIGHT}
        />
      </Part>
    </>
  );
}
function ReducingValve(s: SceneProps) {
  const cut = section(s),
    body = useMemo(() => createPRVBodyGeometry(cut), [cut]),
    spring = useMemo(
      () =>
        seq(97).map((i): Point => [
          1.2 + 0.118 * Math.cos((i * PI) / 8),
          1.267 + i * 0.0042,
          0.95 + 0.118 * Math.sin((i * PI) / 8),
        ]),
      []
    );
  return (
    <>
      <Skid l={6.5} w={2.38} />
      {[-1, 1].map(k => {
        const p = k < 0 ? PRV_BODY.inlet : PRV_BODY.outlet;
        return (
          <Part
            key={k}
            scene={s}
            id={k < 0 ? "inlet" : "outlet"}
            offset={[k * 0.74, 0, 0]}
          >
            <Nozzle
              at={[k * 2.16, p.y, 0]}
              r={p.radius}
              h={3}
              t={0.07}
              sign={k}
            />
            <Arrow
              a={[k * 2.57 - 0.64, p.y + 0.46, 0]}
              b={[k * 2.57 + 0.64, p.y + 0.46, 0]}
              s={s}
            />
          </Part>
        );
      })}
      <Part scene={s} id="diaphragm" offset={[0, 1.04, -0.82]}>
        <Fabrication geometry={body} name="prv-ported-body" />
        <Box at={[0, -1.31, 0]} size={[1.26, 0.14, 1.52]} />
        <group position={[0, -0.63, 0]} rotation={[0, 0, PI / 2]}>
          <Shell r={0.72} t={0.32} h={0.09} />
        </group>
        <Box at={[-0.66, -0.11, 0]} size={[0.08, 0.96, 0.73]} />
        <Box at={[0.66, -0.88, 0]} size={[0.08, 0.41, 0.73]} />
        <Cylinder
          at={[0, -0.43, 0]}
          r={0.415}
          b={0.375}
          h={0.12}
          color={DARK}
        />
        <Member a={[0, -0.41, 0]} b={[0, 0.45, 0]} r={0.072} />
        <Cylinder at={[0, 0.416, 0]} r={0.89} h={0.084} color={DARK} />
        <group position={[0, 0.8, 0]} rotation={[0, 0, PI / 2]}>
          <Shell r={0.85} t={0.105} h={0.69} cut={cut} />
        </group>
        <Cylinder at={[0, 1.166, 0]} r={0.845} h={0.085} />
        <group position={[0, 0.476, 0]} rotation={[0, 0, PI / 2]}>
          <Shell r={0.96} t={0.19} h={0.084} />
        </group>
        {seq(10).map(i => (
          <Cylinder
            key={i}
            at={[
              0.898 * Math.cos((i * PI) / 5),
              0.535,
              0.898 * Math.sin((i * PI) / 5),
            ]}
            r={0.044}
            h={0.069}
            n={6}
            color={DARK}
          />
        ))}
      </Part>
      <Part scene={s} id="strainer" offset={[-0.48, 0.62, 0.68]}>
        <Member a={[-1.8, 0.78, 0.95]} b={[-1.12, 0.78, 0.95]} r={0.094} />
        <Member a={[-1.51, 0.78, 0.95]} b={[-1.27, 0.48, 0.95]} r={0.115} />
        <Cylinder
          at={[-1.255, 0.46, 0.95]}
          rot={[0, 0, 0.67]}
          r={0.139}
          h={0.106}
          n={6}
          color={DARK}
        />
      </Part>
      <Part scene={s} id="pilot" offset={[0.5, 0.55, 0.77]}>
        <Tube
          points={[
            [-2, PRV_BODY.inlet.y + 0.22, 0.14],
            [-2, 0.37, 0.76],
            [-1.8, 0.78, 0.95],
          ]}
          r={0.046}
        />
        <Member
          a={[-1.12, 0.78, 0.95]}
          b={[0.4, 0.78, 0.95]}
          r={0.045}
          color={LIGHT}
        />
        <Cylinder
          at={[-0.79, 0.78, 0.95]}
          rot={X}
          r={0.091}
          h={0.23}
          n={6}
          color={TRIM}
        />
        <Box at={[0.4, 0.78, 0.95]} size={[0.15, 0.14, 0.14]} />
        <Tube
          points={[
            [0.4, 0.78, 0.95],
            [0.4, 1.34, 0.9],
            [0, 1.38, 0],
            [0, 1.19, 0],
          ]}
          r={0.045}
        />
        <Member
          a={[0.4, 0.78, 0.95]}
          b={[1.04, 1.03, 0.95]}
          r={0.045}
          color={LIGHT}
        />
        <Cylinder at={[1.2, 1.03, 0.95]} r={0.224} h={0.35} />
        <Cylinder at={[1.2, 1.22, 0.95]} r={0.26} h={0.078} color={TRIM} />
        <Tube
          points={[
            [1.39, 1.03, 0.95],
            [2.38, 1, 0.95],
            [2.53, 0.79, 0.85],
            [2.53, PRV_BODY.outlet.y + 0.22, 0.14],
          ]}
          r={0.043}
        />
      </Part>
      <Part scene={s} id="spring" offset={[0.52, 1.23, 0.77]}>
        <Tube points={spring} r={0.024} color={DARK} />
        <group position={[1.2, 1.474, 0.95]} rotation={[0, 0, PI / 2]}>
          <Shell r={0.2} t={0.032} h={0.43} cut={cut} />
        </group>
        <Cylinder at={[1.2, 1.724, 0.95]} r={0.208} h={0.09} />
        <Cylinder at={[1.2, 1.817, 0.95]} r={0.1} h={0.11} n={6} color={DARK} />
        <Box at={[1.2, 1.91, 0.95]} size={[0.31, 0.075, 0.082]} color={TRIM} />
      </Part>
    </>
  );
}
export default function EquipmentUnitScene({
  equipment,
  ...scene
}: EquipmentUnitSceneProps) {
  switch (equipment.slug) {
    case "centrifugal-pump":
      return <Pump {...scene} />;
    case "rapid-gravity-filter":
      return <GravityFilter {...scene} />;
    case "chlorine-contact-tank":
      return <ContactTank {...scene} />;
    case "uv-reactor":
      return <UVReactor {...scene} />;
    case "bar-screen":
      return <BarScreen {...scene} />;
    case "grit-chamber":
      return <GritChamber {...scene} />;
    case "lift-station":
      return <LiftStation {...scene} />;
    case "pressure-reducing-valve":
      return <ReducingValve {...scene} />;
    default:
      return null;
  }
}
