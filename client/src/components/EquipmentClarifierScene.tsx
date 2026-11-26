import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  CLARIFIER_PARTS,
  type ClarifierPartId,
  type ClarifierView,
} from "@/lib/clarifierLab";
import {
  clarifierSolidsPoint,
  clarifierWaterPoint,
} from "@/lib/equipmentClarifierModel";

const TAU = Math.PI * 2;
type Point = [number, number, number];
const OFFSETS: Record<ClarifierPartId, Point> = {
  feedwell: [0, 1.6, 0],
  weir: [0, 0.95, 0],
  bridge: [0, 2.6, 0],
  scrapers: [0, 0.85, 0],
  hopper: [0, -0.75, 0],
  scum: [-1.2, 1.3, 0],
  underflow: [1.2, -0.55, 0],
};
const ANCHORS: Record<ClarifierPartId, Point> = {
  feedwell: [0, 1.1, 0.6],
  weir: [3.65, 0.95, 0],
  bridge: [0, 2.35, 0],
  scrapers: [1.9, -0.4, 0.8],
  hopper: [0.2, -1.55, 0.4],
  scum: [-2.5, 0.9, -1.2],
  underflow: [3.7, -1.55, 0.8],
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
      <tubeGeometry args={[curve, 40, radius, 10, false]} />
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.35} />
    </mesh>
  );
}

function Bar({
  from,
  to,
  radius = 0.025,
  color = "#deb765",
}: {
  from: Point;
  to: Point;
  radius?: number;
  color?: string;
}) {
  const start = new THREE.Vector3(...from),
    end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize()
  );
  return (
    <mesh castShadow position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, start.distanceTo(end), 8]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
    </mesh>
  );
}

function FlowParticles({
  solids,
  animated,
}: {
  solids: boolean;
  animated: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const elapsed = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = solids ? 72 : 96;
  const update = () => {
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) {
      const t = (i * 0.61803398875 + elapsed.current / (solids ? 16 : 10)) % 1;
      dummy.position.set(
        ...(solids
          ? clarifierSolidsPoint(t, i / count)
          : clarifierWaterPoint(t, i / count))
      );
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useEffect(update, [count, dummy, solids]);
  useFrame((_, delta) => {
    if (animated) {
      elapsed.current += Math.min(delta, 0.1);
      update();
    }
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[solids ? 0.044 : 0.031, 7, 5]} />
      <meshBasicMaterial color={solids ? "#af681e" : "#069ab5"} />
    </instancedMesh>
  );
}

function PortLabel({
  position,
  color,
  children,
}: {
  position: Point;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Html
      center
      position={position}
      zIndexRange={[8, 0]}
      style={{ pointerEvents: "none" }}
    >
      <span
        className="whitespace-nowrap rounded-full border border-white bg-white/95 px-2 py-1 text-[10px] font-bold shadow-sm"
        style={{ color }}
      >
        {children}
      </span>
    </Html>
  );
}

export default function EquipmentClarifierScene({
  activePart,
  onPartSelect,
  view,
  waterVisible,
  solidsVisible,
  animated,
}: {
  activePart: ClarifierPartId;
  onPartSelect: (part: ClarifierPartId) => void;
  view: ClarifierView;
  waterVisible: boolean;
  solidsVisible: boolean;
  animated: boolean;
}) {
  const rake = useRef<THREE.Group>(null);
  const skimmer = useRef<THREE.Group>(null);
  const exploded = view === "exploded";
  const cutaway = view === "cutaway";
  // Lathe and cylinder use the same angular convention; remove the quadrant
  // facing the initial camera, including the floor and weir, to expose the tank.
  const start = cutaway ? Math.PI / 2 : 0;
  const arc = cutaway ? Math.PI * 1.5 : TAU;
  const bodyProfile = useMemo(
    () =>
      [
        [0.65, -1.12],
        [3.5, -0.79],
        [3.5, 0.88],
        [3.83, 0.88],
        [3.83, -0.95],
        [0.65, -1.3],
      ].map(p => new THREE.Vector2(...(p as [number, number]))),
    []
  );
  const hopperProfile = useMemo(
    () =>
      [
        [0.65, -1.12],
        [0.24, -1.8],
        [0.24, -1.9],
        [0.34, -1.9],
        [0.76, -1.12],
      ].map(p => new THREE.Vector2(...(p as [number, number]))),
    []
  );
  const color = (id: ClarifierPartId, base: string) =>
    activePart === id ? "#0891a3" : base;
  useFrame((_, delta) => {
    if (!animated) return;
    const movement = Math.min(delta, 0.1) * 0.055;
    if (rake.current) rake.current.rotation.y += movement;
    if (skimmer.current) skimmer.current.rotation.y += movement;
  });
  const select = (id: ClarifierPartId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onPartSelect(id);
  };
  const offset = (id: ClarifierPartId): Point =>
    exploded ? OFFSETS[id] : [0, 0, 0];

  return (
    <>
      <color attach="background" args={["#eaf4f5"]} />
      <hemisphereLight args={["#f3fdff", "#607b85", 2.1]} />
      <directionalLight
        position={[4, 10, 6]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-normalBias={0.04}
      />
      <directionalLight
        position={[-6, 3, -6]}
        intensity={1.5}
        color="#addfea"
      />
      <mesh receiveShadow position={[0, exploded ? -3.15 : -2.17, 0]}>
        <cylinderGeometry args={[5.8, 5.9, 0.16, 96]} />
        <meshStandardMaterial color="#deebed" roughness={1} />
      </mesh>
      <mesh
        position={[0, exploded ? -3.065 : -2.085, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[5.5, 5.52, 96]} />
        <meshBasicMaterial color="#a9c6cb" />
      </mesh>

      <mesh castShadow receiveShadow>
        <latheGeometry args={[bodyProfile, 96, start, arc]} />
        <meshStandardMaterial
          color="#bccbcf"
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* A sloping interior floor, rather than a flat opaque cap hiding the hopper. */}
      <mesh position={[0, -0.955, 0]}>
        <cylinderGeometry args={[3.5, 0.65, 0.33, 96, 1, true, start, arc]} />
        <meshStandardMaterial
          color="#8ea4aa"
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {waterVisible && !exploded && (
        <>
          <mesh position={[0, 0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Ring angles differ from cylinder angles; this rotation aligns the cut. */}
            <ringGeometry args={[0.8, 3.44, 96, 1, 0, arc]} />
            <meshStandardMaterial
              color="#37bac9"
              transparent
              opacity={0.3}
              roughness={0.24}
              metalness={0.15}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <FlowParticles solids={false} animated={animated} />
        </>
      )}
      {solidsVisible && !exploded && (
        <FlowParticles solids animated={animated} />
      )}

      <group position={offset("feedwell")} onClick={select("feedwell")}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry
            args={[0.81, 0.81, 1.04, 48, 1, true, start, arc]}
          />
          <meshStandardMaterial
            color={color("feedwell", "#457886")}
            side={THREE.DoubleSide}
            metalness={0.35}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 0.89, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.81, 0.055, 10, 64]} />
          <meshStandardMaterial
            color="#c4e1e5"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        <Pipe
          color="#168da5"
          radius={0.15}
          points={[
            [-4.7, -1.7, -0.4],
            [-2.7, -1.7, -0.4],
            [-0.25, -1.7, -0.4],
            [-0.25, -0.8, -0.4],
            [-0.25, 0.1, -0.4],
          ]}
        />
      </group>

      <group position={offset("weir")} onClick={select("weir")}>
        <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 3.79, 96, 1, 0, arc]} />
          <meshStandardMaterial color="#56acb4" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.51, 0]}>
          <cylinderGeometry
            args={[3.46, 3.46, 0.24, 96, 1, true, start, arc]}
          />
          <meshStandardMaterial
            color={color("weir", "#7899a3")}
            side={THREE.DoubleSide}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        {Array.from({ length: 64 }, (_, i) => {
          const a = (i / 64) * TAU;
          if (cutaway && a < Math.PI / 2) return null;
          return (
            <group
              key={i}
              position={[Math.sin(a) * 3.46, 0.63, Math.cos(a) * 3.46]}
              rotation={[0, a, 0]}
            >
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.13, 0.13, 0.035]} />
                <meshStandardMaterial
                  color={color("weir", "#7899a3")}
                  metalness={0.5}
                  roughness={0.3}
                />
              </mesh>
            </group>
          );
        })}
        <Pipe
          color="#24999c"
          radius={0.16}
          points={[
            [3.7, 0.43, -0.3],
            [4.25, 0.43, -0.3],
            [4.55, -0.2, -0.3],
            [4.8, -0.2, -0.3],
          ]}
        />
      </group>

      <group position={offset("bridge")} onClick={select("bridge")}>
        <mesh castShadow position={[0, 1.24, 0]}>
          <boxGeometry args={[7.8, 0.18, 0.57]} />
          <meshStandardMaterial
            color={color("bridge", "#526975")}
            metalness={0.5}
            roughness={0.38}
          />
        </mesh>
        {[-0.27, 0.27].map(z => (
          <group key={z}>
            {[1.55, 1.85].map(y => (
              <Bar key={y} from={[-3.85, y, z]} to={[3.85, y, z]} />
            ))}
            {Array.from({ length: 13 }, (_, i) => (
              <Bar
                key={i}
                from={[-3.72 + i * 0.62, 1.3, z]}
                to={[-3.72 + i * 0.62, 1.85, z]}
              />
            ))}
          </group>
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <mesh key={i} position={[-3.65 + i * 0.27, 1.338, 0]}>
            <boxGeometry args={[0.017, 0.008, 0.52]} />
            <meshStandardMaterial color="#aec0c5" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.27, 0.37, 0.34, 32]} />
          <meshStandardMaterial
            color="#d3a850"
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <mesh castShadow position={[0, 1.8, 0]}>
          <boxGeometry args={[0.45, 0.32, 0.35]} />
          <meshStandardMaterial
            color="#345764"
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <Bar
          from={[0, 1.25, 0]}
          to={[0, -0.7, 0]}
          radius={0.075}
          color="#bbcbd0"
        />
      </group>

      <group position={offset("scrapers")} onClick={select("scrapers")}>
        <group ref={rake}>
          {[0, Math.PI].map(a => (
            <group key={a} rotation={[0, a, 0]}>
              <Bar
                from={[0.2, -0.65, 0]}
                to={[3.25, -0.3, 0]}
                radius={0.065}
                color={color("scrapers", "#55707f")}
              />
              <Bar
                from={[0.2, -0.2, 0]}
                to={[3.25, -0.3, 0]}
                radius={0.035}
                color="#869fa8"
              />
              {[0.85, 1.5, 2.15, 2.8].map(r => (
                <group key={r} position={[r, -1.116 + r * 0.116, 0]}>
                  <mesh rotation={[0, -0.48, 0]}>
                    <boxGeometry args={[0.65, 0.16, 0.12]} />
                    <meshStandardMaterial
                      color={color("scrapers", "#d5a75c")}
                      metalness={0.25}
                      roughness={0.55}
                    />
                  </mesh>
                  <Bar from={[0, 0.08, 0]} to={[0, 0.44, 0]} color="#7b949d" />
                </group>
              ))}
            </group>
          ))}
        </group>
      </group>

      <group position={offset("hopper")} onClick={select("hopper")}>
        <mesh>
          <latheGeometry args={[hopperProfile, 48, start, arc]} />
          <meshStandardMaterial
            color={color("hopper", "#947859")}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group position={offset("scum")} onClick={select("scum")}>
        <group ref={skimmer}>
          <Bar
            from={[0.3, 0.66, 0]}
            to={[-3.25, 0.66, -0.65]}
            radius={0.035}
            color={color("scum", "#cc9b52")}
          />
          <mesh position={[-2.2, 0.55, -0.45]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[1.5, 0.19, 0.09]} />
            <meshStandardMaterial color={color("scum", "#c9a667")} />
          </mesh>
        </group>
        <mesh position={[-2.65, 0.66, -1.8]} rotation={[0, -0.6, 0]}>
          <boxGeometry args={[0.75, 0.16, 0.4]} />
          <meshStandardMaterial color="#668792" />
        </mesh>
      </group>
      <group position={offset("underflow")} onClick={select("underflow")}>
        <Pipe
          color={color("underflow", "#ba8145")}
          radius={0.13}
          points={[
            [0, -1.85, 0],
            [0.35, -1.95, 0],
            [2.6, -1.95, 0],
            [3.65, -1.65, 0.65],
            [4.6, -1.65, 0.9],
          ]}
        />
        <mesh position={[3.9, -1.65, 0.72]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.21, 0.21, 0.12, 20]} />
          <meshStandardMaterial
            color="#d6a875"
            metalness={0.35}
            roughness={0.4}
          />
        </mesh>
      </group>

      {!exploded && view !== "top" && (
        <>
          <PortLabel position={[-4.4, -1.25, -0.4]} color="#087c99">
            Influent →
          </PortLabel>
          <PortLabel position={[4.5, 0.35, -0.3]} color="#087e79">
            Effluent →
          </PortLabel>
          <PortLabel position={[3.5, -2.02, 1]} color="#98621f">
            Sludge →
          </PortLabel>
        </>
      )}
      {exploded &&
        CLARIFIER_PARTS.map((part, i) => (
          <Html
            key={part.id}
            center
            position={
              ANCHORS[part.id].map((v, j) => v + OFFSETS[part.id][j]) as Point
            }
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span
              data-testid={`clarifier-part-number-${part.id}`}
              role="img"
              aria-label={`Part ${i + 1}: ${part.label}`}
              style={{
                display: "grid",
                placeItems: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid #0e7490",
                background: "white",
                color: "#0e7490",
                font: "bold 14px system-ui",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </Html>
        ))}
    </>
  );
}
