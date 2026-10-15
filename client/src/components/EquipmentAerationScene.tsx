import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { EquipmentPart, EquipmentView } from "@shared/equipmentRegistry";
import {
  BASIN_DEPTH,
  BASIN_LENGTH,
  BASIN_WIDTH,
  airBubblePoint,
  mixedLiquorPoint,
  returnSludgePoint,
} from "@/lib/equipmentAerationModel";

type Point = [number, number, number];

/*
 * Built to match the structural honesty of the clarifier model.
 *
 * The first version drew four transparent planes floating in empty space, which
 * read as a wireframe box rather than a concrete tank an operator walks on top
 * of. A basin is a heavy civil structure: poured walls with real thickness, a
 * slab, a grating walkway with handrails, a weir wall the water spills over, and
 * a blower skid sitting on grade beside it. Those are the parts an operator
 * recognises from site, so they are the parts that have to be in the model.
 */

/** Wall and slab thickness. Concrete, not glass. */
const WALL_T = 0.24;
/** Freeboard above the water line, where the walls keep going. */
const FREEBOARD = 0.42;
const WALL_H = BASIN_DEPTH + FREEBOARD;
const WALL_MID_Y = -BASIN_DEPTH + WALL_H / 2;
const WALL_TOP_Y = FREEBOARD;
/** Top of the ground slab the whole structure sits on. */
const GRADE_Y = -BASIN_DEPTH - WALL_T;

/* Industrial palette. Selection uses one consistent accent, like the clarifier,
   so a highlighted part is unmistakable without recolouring the whole scene. */
const ACCENT = "#0891a3";
const CONCRETE = "#bcc9cd";
const CONCRETE_EDGE = "#9fb0b5";
const SLAB = "#8ea4aa";
const GROUND = "#dee9eb";
const STEEL = "#8fa3ab";
const STEEL_LIGHT = "#c4d2d6";
const SAFETY = "#deb765";
const PVC = "#dfe6e8";
const MEMBRANE = "#48565e";
const SLUDGE_PIPE = "#ba8145";

/** Exploded-view displacement per part. */
const OFFSETS: Record<string, Point> = {
  "influent-channel": [-1.7, 0.7, 0],
  "diffuser-grid": [0, -1.5, 0],
  blower: [-0.6, 2.1, -1.5],
  "do-probe": [0, 1.7, 1.1],
  "mixed-liquor": [0, 0.9, 0],
  "ras-line": [0, -2.1, 1.4],
  "was-line": [1.8, -1.8, -1.2],
};

/** Where the label sits on each part before the explode offset is added. */
const ANCHORS: Record<string, Point> = {
  "influent-channel": [-BASIN_LENGTH / 2 - 1.05, 0.1, BASIN_WIDTH * 0.2],
  "diffuser-grid": [-0.6, -BASIN_DEPTH + 0.35, 0],
  blower: [-BASIN_LENGTH / 2 - 1.5, GRADE_Y + 1.1, -BASIN_WIDTH * 0.45],
  "do-probe": [1.0, 0.95, BASIN_WIDTH * 0.3],
  "mixed-liquor": [0.3, -BASIN_DEPTH * 0.45, 0],
  "ras-line": [-BASIN_LENGTH * 0.2, GRADE_Y - 0.55, BASIN_WIDTH * 0.66],
  "was-line": [BASIN_LENGTH / 2 + 1.5, GRADE_Y - 0.55, -BASIN_WIDTH * 0.4],
};

/** A straight member between two points. Used for handrails and bracing. */
function Bar({
  from,
  to,
  radius = 0.026,
  color = SAFETY,
}: {
  from: Point;
  to: Point;
  radius?: number;
  color?: string;
}) {
  const { mid, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return {
      mid: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.clone().sub(a).normalize()
      ),
      length: a.distanceTo(b),
    };
  }, [from, to]);
  return (
    <mesh castShadow position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.38} />
    </mesh>
  );
}

function Pipe({
  points,
  radius = 0.1,
  color,
  active = false,
}: {
  points: Point[];
  radius?: number;
  color: string;
  active?: boolean;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
    [points]
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 48, radius, 12, false]} />
      <meshStandardMaterial
        color={active ? ACCENT : color}
        roughness={0.4}
        metalness={0.35}
      />
    </mesh>
  );
}

/** A selectable group that lifts away from the basin in the exploded view. */
function Part({
  id,
  exploded,
  onSelect,
  children,
}: {
  id: string;
  exploded: boolean;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => OFFSETS[id] ?? [0, 0, 0], [id]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const [tx, ty, tz] = exploded ? target : [0, 0, 0];
    const speed = Math.min(1, delta * 4.5);
    g.position.x += (tx - g.position.x) * speed;
    g.position.y += (ty - g.position.y) * speed;
    g.position.z += (tz - g.position.z) * speed;
  });

  return (
    <group
      ref={group}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

/** Mixed liquor circulating down the basin. */
function MixedLiquorFlow({ animate }: { animate: boolean }) {
  const COUNT = 150;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        offset: i / COUNT,
        lane: ((i * 2654435761) % 1000) / 1000,
      })),
    []
  );
  const clock = useRef(0);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (animate) clock.current += delta * 0.075;
    seeds.forEach((s, i) => {
      const t = (s.offset + clock.current) % 1;
      const [x, y, z] = mixedLiquorPoint(t, s.lane);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.052);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 7, 5]} />
      <meshBasicMaterial color="#8a5630" />
    </instancedMesh>
  );
}

/** Air rising from the floor grid. */
function AirBubbles({ animate }: { animate: boolean }) {
  const COUNT = 240;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        offset: (i * 7.37) % 1,
        lane: (i * 0.61803398875) % 1,
      })),
    []
  );
  const clock = useRef(0);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (animate) clock.current += delta * 0.42;
    seeds.forEach((s, i) => {
      const t = (s.offset + clock.current) % 1;
      const [x, y, z] = airBubblePoint(t, s.lane);
      dummy.position.set(x, y, z);
      // Bubbles expand as hydrostatic pressure drops near the surface.
      dummy.scale.setScalar(0.026 + t * 0.018);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 7, 5]} />
      <meshBasicMaterial color="#e6f6fb" />
    </instancedMesh>
  );
}

/** Return sludge travelling back to the inlet. */
function ReturnSludgeFlow({ animate }: { animate: boolean }) {
  const COUNT = 36;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const clock = useRef(0);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (animate) clock.current += delta * 0.14;
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT + clock.current) % 1;
      const [x, y, z] = returnSludgePoint(t);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.048);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 7, 5]} />
      <meshBasicMaterial color="#96511f" />
    </instancedMesh>
  );
}

/** One run of handrail: two rails, posts, and a kickplate. */
/**
 * One run of handrail along the walkway.
 *
 * The walkway spans the basin WIDTH, so the rails run along z at a fixed x.
 * Running them along x instead put the railing across the deck rather than
 * down its edge.
 */
function Handrail({
  x,
  zFrom,
  zTo,
  baseY,
}: {
  x: number;
  zFrom: number;
  zTo: number;
  baseY: number;
}) {
  const posts = 6;
  return (
    <group>
      {[baseY + 0.52, baseY + 0.29].map(y => (
        <Bar key={y} from={[x, y, zFrom]} to={[x, y, zTo]} />
      ))}
      {Array.from({ length: posts }, (_, i) => {
        const z = zFrom + ((zTo - zFrom) / (posts - 1)) * i;
        return <Bar key={i} from={[x, baseY, z]} to={[x, baseY + 0.52, z]} />;
      })}
    </group>
  );
}

export default function EquipmentAerationScene({
  parts,
  view,
  activePart,
  onSelectPart,
  animate,
}: {
  parts: readonly EquipmentPart[];
  view: EquipmentView;
  activePart: string;
  onSelectPart: (id: string) => void;
  animate: boolean;
}) {
  const exploded = view === "exploded";
  const cutaway = view === "cutaway";
  const isOn = (id: string) => activePart === id;
  /** Realistic base colour, swapped for the accent when the part is selected. */
  const tint = (id: string, base: string) => (isOn(id) ? ACCENT : base);

  const halfL = BASIN_LENGTH / 2;
  const halfW = BASIN_WIDTH / 2;
  const floorY = -BASIN_DEPTH;

  /** Six lateral diffuser runs across the basin floor. */
  const laterals = useMemo(() => {
    const rows = 6;
    const span = BASIN_LENGTH * 0.72;
    const startX = -halfL + 0.55;
    return Array.from(
      { length: rows },
      (_, i) => startX + (span / (rows - 1)) * i
    );
  }, [halfL]);

  /** Disc positions along each lateral, the detail an operator actually sees. */
  const discZ = useMemo(() => {
    const n = 5;
    const span = BASIN_WIDTH * 0.72;
    return Array.from({ length: n }, (_, i) => -span / 2 + (span / (n - 1)) * i);
  }, []);

  /** V-notches along the effluent weir plate. */
  const notches = useMemo(() => {
    const n = 18;
    const span = BASIN_WIDTH * 0.92;
    return Array.from({ length: n }, (_, i) => -span / 2 + (span / (n - 1)) * i);
  }, []);

  const walkX = 1.15;

  return (
    <group>
      {/* ── Ground slab the structure sits on ──────────────────────── */}
      <mesh receiveShadow position={[0, GRADE_Y - 0.08, 0]}>
        <boxGeometry args={[BASIN_LENGTH + 5.2, 0.16, BASIN_WIDTH + 4.4]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>

      {/* ── Basin structure: slab and four poured walls ─────────────── */}
      <group>
        <mesh receiveShadow castShadow position={[0, floorY - WALL_T / 2, 0]}>
          <boxGeometry
            args={[
              BASIN_LENGTH + WALL_T * 2,
              WALL_T,
              BASIN_WIDTH + WALL_T * 2,
            ]}
          />
          <meshStandardMaterial color={SLAB} roughness={0.95} />
        </mesh>
        {/* Interior floor finish, so the slab reads as a wetted surface. */}
        <mesh receiveShadow position={[0, floorY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BASIN_LENGTH, BASIN_WIDTH]} />
          <meshStandardMaterial color={CONCRETE_EDGE} roughness={0.95} />
        </mesh>

        {/* Far wall, always present. */}
        <mesh castShadow receiveShadow position={[0, WALL_MID_Y, -halfW - WALL_T / 2]}>
          <boxGeometry args={[BASIN_LENGTH + WALL_T * 2, WALL_H, WALL_T]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        </mesh>
        {/* Near wall, removed in the cutaway so the section is unobstructed. */}
        {!cutaway && (
          <mesh castShadow receiveShadow position={[0, WALL_MID_Y, halfW + WALL_T / 2]}>
            <boxGeometry args={[BASIN_LENGTH + WALL_T * 2, WALL_H, WALL_T]} />
            <meshStandardMaterial color={CONCRETE} roughness={0.92} />
          </mesh>
        )}
        {/* Inlet end wall. */}
        <mesh castShadow receiveShadow position={[-halfL - WALL_T / 2, WALL_MID_Y, 0]}>
          <boxGeometry args={[WALL_T, WALL_H, BASIN_WIDTH]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        </mesh>
        {/* Outlet end wall, lower: the water spills over it to the launder. */}
        <mesh
          castShadow
          receiveShadow
          position={[halfL + WALL_T / 2, -BASIN_DEPTH + (BASIN_DEPTH + 0.06) / 2, 0]}
        >
          <boxGeometry args={[WALL_T, BASIN_DEPTH + 0.06, BASIN_WIDTH]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        </mesh>
      </group>

      {/* ── Mixed liquor ───────────────────────────────────────────── */}
      <Part id="mixed-liquor" exploded={exploded} onSelect={onSelectPart}>
        {/*
          The water volume encloses the basin, so a raycast hits it before the
          diffusers, probe or pipes inside. Disabling its raycast lets a learner
          click the submerged equipment they can see; the Mixed Liquor Zone is
          still selectable from the component list beside the model.
        */}
        <mesh position={[0, -BASIN_DEPTH / 2, 0]} raycast={() => null}>
          <boxGeometry
            args={[BASIN_LENGTH, BASIN_DEPTH * 0.99, BASIN_WIDTH]}
          />
          <meshStandardMaterial
            color={isOn("mixed-liquor") ? ACCENT : "#37bac9"}
            transparent
            opacity={isOn("mixed-liquor") ? 0.3 : 0.17}
            depthWrite={false}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Water surface, where the roll from the diffusers breaks. */}
        <mesh
          position={[0, -0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[BASIN_LENGTH, BASIN_WIDTH]} />
          <meshStandardMaterial
            color="#2fb4c6"
            transparent
            opacity={0.34}
            depthWrite={false}
            roughness={0.2}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {animate ? <MixedLiquorFlow animate={animate} /> : null}
      </Part>

      {/* ── Diffuser grid ──────────────────────────────────────────── */}
      <Part id="diffuser-grid" exploded={exploded} onSelect={onSelectPart}>
        {/* Air header running the basin length along the far wall. */}
        <mesh
          position={[-0.15, floorY + 0.14, -halfW + 0.26]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.075, 0.075, BASIN_LENGTH * 0.84, 16]} />
          <meshStandardMaterial
            color={tint("diffuser-grid", PVC)}
            metalness={0.2}
            roughness={0.45}
          />
        </mesh>
        {laterals.map(x => (
          <group key={x}>
            {/* Lateral pipe across the floor. */}
            <mesh
              position={[x, floorY + 0.11, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.05, 0.05, BASIN_WIDTH * 0.82, 12]} />
              <meshStandardMaterial
                color={tint("diffuser-grid", PVC)}
                metalness={0.2}
                roughness={0.45}
              />
            </mesh>
            {/* Drop leg tying the lateral into the header. */}
            <Bar
              from={[x, floorY + 0.11, -halfW + 0.26]}
              to={[x, floorY + 0.11, -halfW * 0.82]}
              radius={0.032}
              color={tint("diffuser-grid", PVC)}
            />
            {/* Membrane disc diffusers, the part an operator pulls and inspects. */}
            {discZ.map(z => (
              <mesh key={z} position={[x, floorY + 0.17, z]} castShadow>
                <cylinderGeometry args={[0.115, 0.115, 0.045, 18]} />
                <meshStandardMaterial
                  color={tint("diffuser-grid", MEMBRANE)}
                  roughness={0.7}
                  metalness={0.1}
                />
              </mesh>
            ))}
          </group>
        ))}
        {animate ? <AirBubbles animate={animate} /> : null}
      </Part>

      {/* ── Blower skid on grade ───────────────────────────────────── */}
      <Part id="blower" exploded={exploded} onSelect={onSelectPart}>
        {/* Housekeeping pad. */}
        <mesh receiveShadow position={[-halfL - 1.5, GRADE_Y + 0.07, -BASIN_WIDTH * 0.45]}>
          <boxGeometry args={[1.7, 0.14, 1.25]} />
          <meshStandardMaterial color={CONCRETE_EDGE} roughness={1} />
        </mesh>
        {/* Blower housing. */}
        <mesh castShadow position={[-halfL - 1.62, GRADE_Y + 0.5, -BASIN_WIDTH * 0.45]}>
          <boxGeometry args={[0.92, 0.72, 0.78]} />
          <meshStandardMaterial
            color={tint("blower", "#5c7785")}
            metalness={0.45}
            roughness={0.42}
          />
        </mesh>
        {/* Motor on the same skid. */}
        <mesh
          castShadow
          position={[-halfL - 0.92, GRADE_Y + 0.42, -BASIN_WIDTH * 0.45]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.56, 20]} />
          <meshStandardMaterial
            color={tint("blower", "#44606d")}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
        {/* Coupling guard, in safety yellow like everything else you can touch. */}
        <mesh castShadow position={[-halfL - 1.2, GRADE_Y + 0.42, -BASIN_WIDTH * 0.45]}>
          <boxGeometry args={[0.14, 0.34, 0.34]} />
          <meshStandardMaterial color={SAFETY} metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Air main: up off the skid, over the wall, down to the header. */}
        <Pipe
          active={isOn("blower")}
          color={STEEL_LIGHT}
          radius={0.075}
          points={[
            [-halfL - 1.62, GRADE_Y + 0.88, -BASIN_WIDTH * 0.45],
            [-halfL - 1.62, WALL_TOP_Y + 0.3, -BASIN_WIDTH * 0.45],
            [-halfL - 0.4, WALL_TOP_Y + 0.3, -halfW + 0.26],
            [-halfL + 0.3, floorY + 0.5, -halfW + 0.26],
            [-halfL + 0.45, floorY + 0.14, -halfW + 0.26],
          ]}
        />
      </Part>

      {/* ── Influent channel ───────────────────────────────────────── */}
      <Part id="influent-channel" exploded={exploded} onSelect={onSelectPart}>
        {/* Open channel outside the inlet wall: floor and two sides. */}
        <mesh castShadow receiveShadow position={[-halfL - 0.78, -0.62, 0]}>
          <boxGeometry args={[1.05, 0.16, BASIN_WIDTH * 0.78]} />
          <meshStandardMaterial
            color={tint("influent-channel", CONCRETE)}
            roughness={0.92}
          />
        </mesh>
        {[-1, 1].map(s => (
          <mesh
            key={s}
            castShadow
            receiveShadow
            position={[-halfL - 0.78, -0.28, (s * BASIN_WIDTH * 0.78) / 2]}
          >
            <boxGeometry args={[1.05, 0.84, 0.16]} />
            <meshStandardMaterial
              color={tint("influent-channel", CONCRETE)}
              roughness={0.92}
            />
          </mesh>
        ))}
        <mesh castShadow receiveShadow position={[-halfL - 1.28, -0.28, 0]}>
          <boxGeometry args={[0.16, 0.84, BASIN_WIDTH * 0.78]} />
          <meshStandardMaterial
            color={tint("influent-channel", CONCRETE)}
            roughness={0.92}
          />
        </mesh>
        {/* Slide gate in the inlet wall, with its handwheel stand. */}
        <mesh castShadow position={[-halfL - WALL_T / 2, -0.42, 0]}>
          <boxGeometry args={[0.1, 0.62, 0.72]} />
          <meshStandardMaterial
            color={tint("influent-channel", STEEL)}
            metalness={0.6}
            roughness={0.33}
          />
        </mesh>
        <Bar
          from={[-halfL - WALL_T / 2, -0.12, 0]}
          to={[-halfL - WALL_T / 2, WALL_TOP_Y + 0.44, 0]}
          radius={0.034}
          color={STEEL_LIGHT}
        />
        <mesh
          castShadow
          position={[-halfL - WALL_T / 2, WALL_TOP_Y + 0.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.17, 0.028, 8, 24]} />
          <meshStandardMaterial color={SAFETY} metalness={0.4} roughness={0.4} />
        </mesh>
      </Part>

      {/* ── Effluent weir and launder, where the basin discharges ───── */}
      <group>
        <mesh castShadow position={[halfL + WALL_T / 2, 0.1, 0]}>
          <boxGeometry args={[0.05, 0.22, BASIN_WIDTH * 0.94]} />
          <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.35} />
        </mesh>
        {notches.map(z => (
          <mesh
            key={z}
            position={[halfL + WALL_T / 2, 0.21, z]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[0.07, 0.07, 0.052]} />
            <meshStandardMaterial
              color={STEEL}
              metalness={0.5}
              roughness={0.35}
            />
          </mesh>
        ))}
        {/* Launder channel beyond the weir. */}
        <mesh castShadow receiveShadow position={[halfL + 0.62, -0.28, 0]}>
          <boxGeometry args={[0.72, 0.16, BASIN_WIDTH * 0.94]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        </mesh>
        <mesh castShadow receiveShadow position={[halfL + 1.02, 0.02, 0]}>
          <boxGeometry args={[0.14, 0.76, BASIN_WIDTH * 0.94]} />
          <meshStandardMaterial color={CONCRETE} roughness={0.92} />
        </mesh>
      </group>

      {/* ── Walkway across the basin ───────────────────────────────── */}
      <group>
        <mesh castShadow receiveShadow position={[walkX, WALL_TOP_Y + 0.06, 0]}>
          <boxGeometry args={[1.0, 0.09, BASIN_WIDTH + WALL_T * 2 + 0.7]} />
          <meshStandardMaterial
            color={STEEL}
            metalness={0.45}
            roughness={0.45}
          />
        </mesh>
        {/* Grating bars, so the deck reads as walkable steel. */}
        {Array.from({ length: 22 }, (_, i) => (
          <mesh
            key={i}
            position={[
              walkX,
              WALL_TOP_Y + 0.112,
              -(BASIN_WIDTH / 2 + WALL_T + 0.28) + i * 0.168,
            ]}
          >
            <boxGeometry args={[0.94, 0.012, 0.022]} />
            <meshStandardMaterial color={STEEL_LIGHT} metalness={0.4} />
          </mesh>
        ))}
        {[-1, 1].map(s => (
          <Handrail
            key={s}
            x={walkX + (s * 1.0) / 2}
            zFrom={-(BASIN_WIDTH / 2 + WALL_T + 0.3)}
            zTo={BASIN_WIDTH / 2 + WALL_T + 0.3}
            baseY={WALL_TOP_Y + 0.1}
          />
        ))}
      </group>

      {/* ── Dissolved oxygen probe, hung off the walkway ───────────── */}
      <Part id="do-probe" exploded={exploded} onSelect={onSelectPart}>
        <mesh castShadow position={[walkX - 0.62, WALL_TOP_Y + 0.26, 0.42]}>
          <boxGeometry args={[0.22, 0.3, 0.18]} />
          <meshStandardMaterial
            color={tint("do-probe", "#4b5f69")}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        <mesh castShadow position={[walkX - 0.62, -0.5, 0.42]}>
          <cylinderGeometry args={[0.042, 0.042, 1.52, 14]} />
          <meshStandardMaterial
            color={tint("do-probe", STEEL_LIGHT)}
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
        <mesh castShadow position={[walkX - 0.62, -1.3, 0.42]}>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 14]} />
          <meshStandardMaterial
            color={tint("do-probe", "#2f3f49")}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </Part>

      {/* ── Return activated sludge ────────────────────────────────── */}
      <Part id="ras-line" exploded={exploded} onSelect={onSelectPart}>
        <Pipe
          active={isOn("ras-line")}
          color={SLUDGE_PIPE}
          radius={0.105}
          points={[
            [halfL + 1.35, -0.42, halfW * 0.66],
            [halfL + 1.35, GRADE_Y - 0.45, halfW * 0.66],
            [-halfL - 1.35, GRADE_Y - 0.45, halfW * 0.66],
            [-halfL - 0.78, -0.45, halfW * 0.4],
          ]}
        />
        {/* RAS pump on grade. */}
        <mesh castShadow position={[-halfL - 1.35, GRADE_Y + 0.2, halfW * 0.66]}>
          <boxGeometry args={[0.5, 0.4, 0.42]} />
          <meshStandardMaterial
            color={tint("ras-line", "#6d7f87")}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        {animate ? <ReturnSludgeFlow animate={animate} /> : null}
      </Part>

      {/* ── Waste activated sludge ─────────────────────────────────── */}
      <Part id="was-line" exploded={exploded} onSelect={onSelectPart}>
        <Pipe
          active={isOn("was-line")}
          color="#9c6a38"
          radius={0.08}
          points={[
            [halfL + 1.35, GRADE_Y - 0.45, halfW * 0.2],
            [halfL + 1.35, GRADE_Y - 0.45, -halfW * 0.3],
            [halfL + 2.0, GRADE_Y - 0.45, -halfW * 0.62],
          ]}
        />
        {/* The WAS valve: the single most consequential handle on this basin. */}
        <mesh
          castShadow
          position={[halfL + 1.35, GRADE_Y - 0.45, -halfW * 0.05]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.1, 18]} />
          <meshStandardMaterial
            color={isOn("was-line") ? ACCENT : SAFETY}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      </Part>

      {/* ── Flow labels on the assembled views ─────────────────────── */}
      {!exploded && view !== "top" ? (
        <>
          <Html
            center
            position={[-halfL - 1.75, -0.18, 0]}
            zIndexRange={[8, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="whitespace-nowrap rounded-full border border-white bg-white/95 px-2 py-1 text-[10px] font-bold text-sky-800 shadow-sm">
              Influent →
            </span>
          </Html>
          <Html
            center
            position={[halfL + 1.5, 0.3, 0]}
            zIndexRange={[8, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="whitespace-nowrap rounded-full border border-white bg-white/95 px-2 py-1 text-[10px] font-bold text-teal-800 shadow-sm">
              To clarifier →
            </span>
          </Html>
          <Html
            center
            position={[0, GRADE_Y - 0.78, halfW * 0.66]}
            zIndexRange={[8, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="whitespace-nowrap rounded-full border border-white bg-white/95 px-2 py-1 text-[10px] font-bold text-amber-800 shadow-sm">
              ← RAS
            </span>
          </Html>
        </>
      ) : null}

      {/* ── Exploded-view labels ───────────────────────────────────── */}
      {exploded
        ? parts.map((part, i) => {
            const anchor = ANCHORS[part.id];
            if (!anchor) return null;
            const offset = OFFSETS[part.id] ?? [0, 0, 0];
            const pos: Point = [
              anchor[0] + offset[0],
              anchor[1] + offset[1],
              anchor[2] + offset[2],
            ];
            return (
              // distanceFactor is a perspective-camera feature. This stage uses
              // an orthographic camera, where it blows the label up to tens of
              // thousands of pixels and covers the whole scene.
              <Html key={part.id} position={pos} center zIndexRange={[10, 0]}>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectPart(part.id);
                  }}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2 py-1 text-[10px] font-semibold shadow-sm"
                  style={{
                    borderColor: isOn(part.id) ? ACCENT : "#cbd5e1",
                    color: isOn(part.id) ? ACCENT : "#0f172a",
                  }}
                >
                  <span
                    className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: isOn(part.id) ? ACCENT : "#64748b" }}
                  >
                    {i + 1}
                  </span>
                  {part.label}
                </button>
              </Html>
            );
          })
        : null}
    </group>
  );
}
