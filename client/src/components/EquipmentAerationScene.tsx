import { useEffect, useMemo, useRef } from "react";
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

/** Exploded-view displacement per part. */
const OFFSETS: Record<string, Point> = {
  "influent-channel": [-1.5, 0.5, 0],
  "diffuser-grid": [0, -1.2, 0],
  blower: [0, 1.9, -1.4],
  "do-probe": [0, 1.5, 0.9],
  "mixed-liquor": [0, 0.7, 0],
  "ras-line": [0, -1.9, 1.3],
  "was-line": [1.6, -1.6, -1.1],
};

/** Where the label tether attaches on each part. */
const ANCHORS: Record<string, Point> = {
  "influent-channel": [-BASIN_LENGTH / 2 - 0.45, -0.2, BASIN_WIDTH * 0.55],
  "diffuser-grid": [-0.4, -BASIN_DEPTH * 0.86, 0],
  blower: [-BASIN_LENGTH / 2 + 0.2, 1.15, -BASIN_WIDTH * 0.78],
  "do-probe": [0.9, 0.35, BASIN_WIDTH * 0.42],
  "mixed-liquor": [0.2, -BASIN_DEPTH * 0.42, 0],
  "ras-line": [-BASIN_LENGTH * 0.25, -BASIN_DEPTH - 0.42, BASIN_WIDTH * 0.62],
  "was-line": [BASIN_LENGTH / 2 + 0.35, -BASIN_DEPTH - 0.42, -BASIN_WIDTH * 0.2],
};

function Pipe({
  points,
  radius = 0.1,
  color,
}: {
  points: Point[];
  radius?: number;
  color: string;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
    [points]
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 48, radius, 10, false]} />
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.35} />
    </mesh>
  );
}

/** A selectable group that lifts away from the basin in the exploded view. */
function Part({
  id,
  exploded,
  active,
  onSelect,
  children,
}: {
  id: string;
  exploded: boolean;
  active: boolean;
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

  const handle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <group
      ref={group}
      onClick={handle}
      onPointerOver={e => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {active ? null : null}
    </group>
  );
}

/** Mixed liquor particles circulating through the basin. */
function MixedLiquorFlow({ animate }: { animate: boolean }) {
  const COUNT = 150;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        offset: i / COUNT,
        lane: (i * 2654435761) % 1000 / 1000,
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
      dummy.scale.setScalar(0.055);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#7C4A28" roughness={0.75} />
    </instancedMesh>
  );
}

/** Air bubbles rising from the diffuser grid. */
function AirBubbles({ animate }: { animate: boolean }) {
  const COUNT = 220;
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
      // Bubbles expand slightly as pressure drops near the surface.
      dummy.scale.setScalar(0.028 + t * 0.016);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#E0F2FE"
        transparent
        opacity={0.72}
        roughness={0.1}
      />
    </instancedMesh>
  );
}

/** Return activated sludge moving back to the basin inlet. */
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
      dummy.scale.setScalar(0.05);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#B45309" roughness={0.8} />
    </instancedMesh>
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
  const colorOf = (id: string) =>
    parts.find(p => p.id === id)?.color ?? "#94A3B8";

  // The diffuser grid: a row of lateral headers across the basin floor.
  const laterals = useMemo(() => {
    const rows = 6;
    const span = BASIN_LENGTH * 0.74;
    const startX = -BASIN_LENGTH / 2 + 0.5;
    return Array.from({ length: rows }, (_, i) => {
      const x = startX + (span / (rows - 1)) * i;
      return x;
    });
  }, []);

  return (
    <group>
      {/* ── Basin shell ────────────────────────────────────────────── */}
      <group>
        {/* Floor */}
        <mesh
          position={[0, -BASIN_DEPTH, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[BASIN_LENGTH, BASIN_WIDTH]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.9} />
        </mesh>
        {/*
          Walls. The whole point of this model is seeing what happens inside the
          basin, so the walls render as glass rather than concrete. The near wall
          is removed entirely in cutaway view for an unobstructed section.
        */}
        {[
          { pos: [0, -BASIN_DEPTH / 2, -BASIN_WIDTH / 2] as Point, rot: [0, 0, 0] as Point, w: BASIN_LENGTH, hide: false },
          { pos: [0, -BASIN_DEPTH / 2, BASIN_WIDTH / 2] as Point, rot: [0, Math.PI, 0] as Point, w: BASIN_LENGTH, hide: cutaway },
          { pos: [-BASIN_LENGTH / 2, -BASIN_DEPTH / 2, 0] as Point, rot: [0, Math.PI / 2, 0] as Point, w: BASIN_WIDTH, hide: false },
          { pos: [BASIN_LENGTH / 2, -BASIN_DEPTH / 2, 0] as Point, rot: [0, -Math.PI / 2, 0] as Point, w: BASIN_WIDTH, hide: false },
        ].map((wall, i) =>
          wall.hide ? null : (
            <mesh key={i} position={wall.pos} rotation={wall.rot} receiveShadow>
              <planeGeometry args={[wall.w, BASIN_DEPTH]} />
              <meshStandardMaterial
                color="#E2E8F0"
                roughness={0.85}
                transparent
                opacity={0.22}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )
        )}
        {/* Wall edges, so the basin still reads as a solid structure. */}
        <lineSegments position={[0, -BASIN_DEPTH / 2, 0]}>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(BASIN_LENGTH, BASIN_DEPTH, BASIN_WIDTH),
            ]}
          />
          <lineBasicMaterial color="#64748B" />
        </lineSegments>
      </group>

      {/* ── Mixed liquor zone ──────────────────────────────────────── */}
      <Part
        id="mixed-liquor"
        exploded={exploded}
        active={activePart === "mixed-liquor"}
        onSelect={onSelectPart}
      >
        <mesh position={[0, -BASIN_DEPTH / 2, 0]}>
          <boxGeometry
            args={[BASIN_LENGTH * 0.985, BASIN_DEPTH * 0.96, BASIN_WIDTH * 0.985]}
          />
          <meshStandardMaterial
            color={colorOf("mixed-liquor")}
            transparent
            opacity={activePart === "mixed-liquor" ? 0.34 : 0.17}
            roughness={0.25}
          />
        </mesh>
        {animate ? <MixedLiquorFlow animate={animate} /> : null}
      </Part>

      {/* ── Diffuser grid ──────────────────────────────────────────── */}
      <Part
        id="diffuser-grid"
        exploded={exploded}
        active={activePart === "diffuser-grid"}
        onSelect={onSelectPart}
      >
        {/* Main air header running the basin length */}
        <mesh
          position={[-0.1, -BASIN_DEPTH + 0.1, -BASIN_WIDTH * 0.42]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.07, 0.07, BASIN_LENGTH * 0.82, 14]} />
          <meshStandardMaterial
            color={colorOf("diffuser-grid")}
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>
        {/* Lateral diffuser runs across the floor */}
        {laterals.map(x => (
          <mesh
            key={x}
            position={[x, -BASIN_DEPTH + 0.09, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, BASIN_WIDTH * 0.84, 12]} />
            <meshStandardMaterial
              color={colorOf("diffuser-grid")}
              metalness={0.45}
              roughness={0.4}
              emissive={activePart === "diffuser-grid" ? "#10B981" : "#000000"}
              emissiveIntensity={activePart === "diffuser-grid" ? 0.45 : 0}
            />
          </mesh>
        ))}
        {animate ? <AirBubbles animate={animate} /> : null}
      </Part>

      {/* ── Blower and air supply ──────────────────────────────────── */}
      <Part
        id="blower"
        exploded={exploded}
        active={activePart === "blower"}
        onSelect={onSelectPart}
      >
        <mesh
          position={[-BASIN_LENGTH / 2 + 0.2, 0.62, -BASIN_WIDTH * 0.78]}
          castShadow
        >
          <boxGeometry args={[0.86, 0.6, 0.62]} />
          <meshStandardMaterial
            color={colorOf("blower")}
            metalness={0.55}
            roughness={0.32}
            emissive={activePart === "blower" ? "#F59E0B" : "#000000"}
            emissiveIntensity={activePart === "blower" ? 0.4 : 0}
          />
        </mesh>
        <Pipe
          color={colorOf("blower")}
          radius={0.08}
          points={[
            [-BASIN_LENGTH / 2 + 0.2, 0.34, -BASIN_WIDTH * 0.78],
            [-BASIN_LENGTH / 2 + 0.2, -BASIN_DEPTH + 0.6, -BASIN_WIDTH * 0.62],
            [-BASIN_LENGTH / 2 + 0.35, -BASIN_DEPTH + 0.1, -BASIN_WIDTH * 0.42],
          ]}
        />
      </Part>

      {/* ── Influent channel ───────────────────────────────────────── */}
      <Part
        id="influent-channel"
        exploded={exploded}
        active={activePart === "influent-channel"}
        onSelect={onSelectPart}
      >
        <mesh
          position={[-BASIN_LENGTH / 2 - 0.42, -0.3, BASIN_WIDTH * 0.3]}
          castShadow
        >
          <boxGeometry args={[0.8, 0.52, BASIN_WIDTH * 0.72]} />
          <meshStandardMaterial
            color={colorOf("influent-channel")}
            roughness={0.5}
            emissive={
              activePart === "influent-channel" ? "#0EA5E9" : "#000000"
            }
            emissiveIntensity={activePart === "influent-channel" ? 0.4 : 0}
          />
        </mesh>
      </Part>

      {/* ── Dissolved oxygen probe ─────────────────────────────────── */}
      <Part
        id="do-probe"
        exploded={exploded}
        active={activePart === "do-probe"}
        onSelect={onSelectPart}
      >
        <mesh position={[0.9, -0.35, BASIN_WIDTH * 0.38]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 1.5, 12]} />
          <meshStandardMaterial
            color={colorOf("do-probe")}
            metalness={0.6}
            roughness={0.3}
            emissive={activePart === "do-probe" ? "#A855F7" : "#000000"}
            emissiveIntensity={activePart === "do-probe" ? 0.5 : 0}
          />
        </mesh>
        {/* Mounting bracket at the handrail */}
        <mesh position={[0.9, 0.44, BASIN_WIDTH * 0.42]} castShadow>
          <boxGeometry args={[0.3, 0.16, 0.22]} />
          <meshStandardMaterial color="#64748B" metalness={0.5} roughness={0.4} />
        </mesh>
      </Part>

      {/* ── Return activated sludge ────────────────────────────────── */}
      <Part
        id="ras-line"
        exploded={exploded}
        active={activePart === "ras-line"}
        onSelect={onSelectPart}
      >
        <Pipe
          color={colorOf("ras-line")}
          radius={0.1}
          points={[
            [BASIN_LENGTH / 2 + 0.5, -BASIN_DEPTH * 0.6, BASIN_WIDTH * 0.62],
            [BASIN_LENGTH / 2 + 0.5, -BASIN_DEPTH - 0.42, BASIN_WIDTH * 0.62],
            [-BASIN_LENGTH / 2 - 0.5, -BASIN_DEPTH - 0.42, BASIN_WIDTH * 0.62],
            [-BASIN_LENGTH / 2 - 0.5, -0.45, BASIN_WIDTH * 0.52],
          ]}
        />
        {animate ? <ReturnSludgeFlow animate={animate} /> : null}
      </Part>

      {/* ── Waste activated sludge ─────────────────────────────────── */}
      <Part
        id="was-line"
        exploded={exploded}
        active={activePart === "was-line"}
        onSelect={onSelectPart}
      >
        <Pipe
          color={colorOf("was-line")}
          radius={0.085}
          points={[
            [BASIN_LENGTH / 2 + 0.5, -BASIN_DEPTH - 0.42, BASIN_WIDTH * 0.62],
            [BASIN_LENGTH / 2 + 0.5, -BASIN_DEPTH - 0.42, -BASIN_WIDTH * 0.1],
            [BASIN_LENGTH / 2 + 1.25, -BASIN_DEPTH - 0.42, -BASIN_WIDTH * 0.45],
          ]}
        />
      </Part>

      {/* ── Exploded-view labels ───────────────────────────────────── */}
      {exploded
        ? parts.map(part => {
            const anchor = ANCHORS[part.id];
            const offset = OFFSETS[part.id] ?? [0, 0, 0];
            if (!anchor) return null;
            const pos: Point = [
              anchor[0] + offset[0],
              anchor[1] + offset[1],
              anchor[2] + offset[2],
            ];
            return (
              // distanceFactor is a perspective-camera feature. This stage uses
              // an orthographic camera, where it blows the label up to tens of
              // thousands of pixels and covers the whole scene.
              <Html
                key={part.id}
                position={pos}
                center
                zIndexRange={[10, 0]}
              >
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectPart(part.id);
                  }}
                  className="whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm"
                  style={{
                    borderColor: part.color,
                    background:
                      activePart === part.id ? part.color : "#FFFFFF",
                    color: activePart === part.id ? "#FFFFFF" : "#0F172A",
                  }}
                >
                  {part.label}
                </button>
              </Html>
            );
          })
        : null}
    </group>
  );
}
