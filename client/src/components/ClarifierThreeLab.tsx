import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Billboard, OrbitControls } from "@react-three/drei";
import { Eye, Layers3, Pause, Play, RotateCcw, Sparkles, Waves } from "lucide-react";
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  CLARIFIER_PARTS,
  CLARIFIER_STAGES,
  CLARIFIER_STAGE_PARTS,
  type ClarifierPartId,
  type ClarifierStageId,
  type ClarifierView,
} from "@/lib/clarifierLab";

type ThreeClarifierProps = {
  onStudyLink?: () => void;
  onUnavailable?: () => void;
};

type Lens = "operator" | "exam";

const SCENE = {
  tankOuterRadius: 3.8,
  tankInnerRadius: 3.58,
  rimY: 0.63,
  waterY: 0.37,
  floorY: -0.84,
  feedwellRadius: 0.76,
  bridgeY: 1.18,
} as const;

const PART_ORDER: Record<ClarifierPartId, string> = {
  feedwell: "01",
  weir: "02",
  bridge: "03",
  scrapers: "04",
  hopper: "05",
  scum: "06",
  underflow: "07",
};

const EXPLODED_OFFSETS: Record<ClarifierPartId, [number, number, number]> = {
  feedwell: [0, 1.35, 0],
  weir: [0, 0.78, 0],
  bridge: [0, 2.3, 0],
  scrapers: [0, 0.62, 0],
  hopper: [0, -1.05, 0],
  scum: [-1.25, 0.82, -0.72],
  underflow: [1.85, -0.58, 0.18],
};

const LABEL_ANCHORS: Record<ClarifierPartId, [number, number, number]> = {
  feedwell: [0, 1.5, 0],
  weir: [3.4, 0.8, 0],
  bridge: [0, 2.35, 0],
  scrapers: [1.7, -0.05, 0],
  hopper: [0, -1.45, 0],
  scum: [-3.15, 1.0, -0.55],
  underflow: [2.35, -1.32, 0],
};

export const THREE_CLARIFIER_VIEWS: { id: ClarifierView; label: string; icon: typeof Eye }[] = [
  { id: "isometric", label: "Orbit", icon: Eye },
  { id: "top", label: "Top", icon: Layers3 },
  { id: "cutaway", label: "Cutaway", icon: RotateCcw },
  { id: "exploded", label: "Exploded", icon: Sparkles },
];

export function clarifierCameraPosition(view: ClarifierView): [number, number, number] {
  if (view === "top") return [0.01, 10.8, 0.01];
  if (view === "cutaway") return [8.1, 5.15, 8.1];
  if (view === "exploded") return [9.2, 6.4, 9.2];
  return [8.1, 5.9, 8.1];
}

export function shouldAnimateClarifier(flowing: boolean, prefersReducedMotion: boolean, exploded = false) {
  return flowing && !prefersReducedMotion && !exploded;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function CameraRig({ view, resetSignal, reducedMotion }: { view: ClarifierView; resetSignal: number; reducedMotion: boolean }) {
  const { camera, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transition = useRef<{ elapsed: number; startPosition: THREE.Vector3; targetPosition: THREE.Vector3; startTarget: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const targetPosition = new THREE.Vector3(...clarifierCameraPosition(view));
    const target = new THREE.Vector3(0, -0.02, 0);

    if (reducedMotion) {
      camera.position.copy(targetPosition);
      controls.current?.target.copy(target);
      controls.current?.update();
      invalidate();
      return;
    }

    transition.current = {
      elapsed: 0,
      startPosition: camera.position.clone(),
      targetPosition,
      startTarget: controls.current?.target.clone() ?? new THREE.Vector3(0, -0.02, 0),
      target,
    };
    invalidate();
  }, [camera, invalidate, reducedMotion, resetSignal, view]);

  useFrame((_, delta) => {
    const active = transition.current;
    if (!active) return;

    active.elapsed += delta;
    const progress = Math.min(active.elapsed / 0.28, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(active.startPosition, active.targetPosition, eased);
    controls.current?.target.lerpVectors(active.startTarget, active.target, eased);
    controls.current?.update();

    if (progress < 1) invalidate();
    else transition.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minZoom={38}
      maxZoom={72}
      enableRotate={view !== "top"}
      onStart={() => { transition.current = null; }}
      onChange={() => invalidate()}
    />
  );
}

function PartNumber({ id, position, visible }: { id: ClarifierPartId; position: [number, number, number]; visible: boolean }) {
  if (!visible) return null;
  return (
    <Billboard position={position} follow>
      <mesh>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[0.145, 0.18, 24]} />
        <meshBasicMaterial color="#0e7490" />
      </mesh>
    </Billboard>
  );
}

function PartGroup({
  id,
  activePart,
  exploded,
  onSelect,
  children,
}: {
  id: ClarifierPartId;
  activePart: ClarifierPartId;
  exploded: boolean;
  onSelect: (id: ClarifierPartId) => void;
  children: React.ReactNode;
}) {
  const offset: [number, number, number] = exploded ? EXPLODED_OFFSETS[id] : [0, 0, 0];
  const selected = activePart === id;
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };

  return (
    <group position={offset} onClick={select}>
      {children}
      {selected && (
        <mesh position={[0, 0.06, 0]} visible={false}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshBasicMaterial color="#0e7490" />
        </mesh>
      )}
    </group>
  );
}

function FlowIllustration({ visible, paused }: { visible: boolean; paused: boolean }) {
  const flowRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!paused && flowRef.current) flowRef.current.rotation.y += delta * 0.16;
  });

  if (!visible) return null;
  return (
    <group ref={flowRef}>
      {[
        [0, 0.9, 1.02],
        [1.1, 0.28, 0.32],
        [-1.1, -0.35, -0.62],
        [2.95, 0.72, 0.28],
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.075, 0.24, 12]} />
          <meshStandardMaterial color="#0284c7" transparent opacity={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function ClarifierScene({
  activePart,
  onPartSelect,
  view,
  waterVisible,
  solidsVisible,
  flowing,
  prefersReducedMotion,
  resetSignal,
}: {
  activePart: ClarifierPartId;
  onPartSelect: (id: ClarifierPartId) => void;
  view: ClarifierView;
  waterVisible: boolean;
  solidsVisible: boolean;
  flowing: boolean;
  prefersReducedMotion: boolean;
  resetSignal: number;
}) {
  const scraperRef = useRef<THREE.Group>(null);
  const cutaway = view === "cutaway";
  const exploded = view === "exploded";
  const animated = shouldAnimateClarifier(flowing, prefersReducedMotion, exploded);
  const thetaStart = cutaway ? Math.PI / 4 : 0;
  const thetaLength = cutaway ? Math.PI * 1.5 : Math.PI * 2;
  const underflowCurve = useMemo(
    () => new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.4, 0),
      new THREE.Vector3(0.15, -1.52, 0),
      new THREE.Vector3(0.56, -1.54, 0),
      new THREE.Vector3(0.94, -1.28, 0),
      new THREE.Vector3(1.56, -1.28, 0),
    ]),
    [],
  );

  useFrame((_, delta) => {
    if (animated && scraperRef.current) scraperRef.current.rotation.y += delta * 0.1;
  });

  const selectedMaterial = (id: ClarifierPartId, base: string) => activePart === id ? "#0e7490" : base;
  const effectiveWater = waterVisible && !exploded;
  const effectiveSolids = solidsVisible && !exploded;

  return (
    <>
      <color attach="background" args={["#f1f5f9"]} />
      <hemisphereLight args={["#f8fafc", "#cbd5e1", 1.05]} />
      <directionalLight castShadow position={[7, 10, 6]} intensity={2.1} color="#ffffff" shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-7, 5, -4]} intensity={0.48} color="#e2e8f0" />
      <CameraRig view={view} resetSignal={resetSignal} reducedMotion={prefersReducedMotion} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]}>
        <circleGeometry args={[5.65, 64]} />
        <meshStandardMaterial color="#e2e8f0" roughness={1} />
      </mesh>

      <group>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[SCENE.tankOuterRadius, SCENE.tankOuterRadius, 1.74, 88, 1, true, thetaStart, thetaLength]} />
          <meshStandardMaterial color="#64748b" roughness={0.86} metalness={0} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, SCENE.floorY, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.78, 3.52, 0.62, 88, 1, false, thetaStart, thetaLength]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.82} metalness={0.05} />
        </mesh>
        <mesh position={[0, SCENE.rimY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.71, 0.12, 10, 88, thetaLength]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.58} metalness={0.12} />
        </mesh>
      </group>

      {effectiveWater && (
        <mesh position={[0, SCENE.waterY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.78, 3.55, 88, 1, thetaStart, thetaLength]} />
          <meshStandardMaterial color="#0284c7" transparent opacity={0.26} roughness={0.28} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {effectiveSolids && (
        <mesh position={[0, -0.67, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 2.78, 72, 1, thetaStart, thetaLength]} />
          <meshStandardMaterial color="#475569" transparent opacity={0.34} roughness={1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      <PartGroup id="weir" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <mesh position={[0, 0.54, 0]}>
          <cylinderGeometry args={[3.72, 3.72, 0.36, 88, 1, true, thetaStart, thetaLength]} />
          <meshStandardMaterial color={selectedMaterial("weir", "#94a3b8")} roughness={0.58} metalness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.48, 0.055, 8, 88, thetaLength]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.42} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.48, 3.78, 88, 1, thetaStart, thetaLength]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.72} metalness={0.08} side={THREE.DoubleSide} />
        </mesh>
      </PartGroup>

      <PartGroup id="feedwell" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[SCENE.feedwellRadius, SCENE.feedwellRadius, 1.35, 48, 1, true]} />
          <meshStandardMaterial color={selectedMaterial("feedwell", "#64748b")} roughness={0.55} metalness={0.28} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[SCENE.feedwellRadius, 0.075, 10, 48]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.42} metalness={0.28} />
        </mesh>
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.18, 32]} />
          <meshStandardMaterial color="#475569" roughness={0.52} metalness={0.3} />
        </mesh>
      </PartGroup>

      <PartGroup id="bridge" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <mesh castShadow position={[0, SCENE.bridgeY, 0]}>
          <boxGeometry args={[7.15, 0.15, 0.5]} />
          <meshStandardMaterial color={selectedMaterial("bridge", "#64748b")} roughness={0.46} metalness={0.46} />
        </mesh>
        {[-3.24, 3.24].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.96, 0]}><boxGeometry args={[0.12, 0.55, 0.12]} /><meshStandardMaterial color="#475569" roughness={0.52} metalness={0.35} /></mesh>
            <mesh position={[x, 1.42, 0]}><boxGeometry args={[0.12, 0.18, 0.84]} /><meshStandardMaterial color="#94a3b8" roughness={0.55} metalness={0.28} /></mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 1.38, 0]}><cylinderGeometry args={[0.34, 0.42, 0.44, 32]} /><meshStandardMaterial color="#475569" roughness={0.42} metalness={0.45} /></mesh>
      </PartGroup>

      <PartGroup id="scrapers" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <group ref={scraperRef} position={[0, -0.48, 0]}>
          <mesh><cylinderGeometry args={[0.2, 0.2, 0.32, 24]} /><meshStandardMaterial color={selectedMaterial("scrapers", "#64748b")} roughness={0.4} metalness={0.48} /></mesh>
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rotation) => (
            <group key={rotation} rotation={[0, rotation, 0]}>
              <mesh position={[1.55, -0.03, 0]} rotation={[0, 0, -0.11]}><boxGeometry args={[2.9, 0.1, 0.14]} /><meshStandardMaterial color={selectedMaterial("scrapers", "#64748b")} roughness={0.42} metalness={0.45} /></mesh>
              <mesh position={[2.78, -0.22, 0.16]} rotation={[0, 0, -0.34]}><boxGeometry args={[0.62, 0.24, 0.11]} /><meshStandardMaterial color="#94a3b8" roughness={0.58} metalness={0.22} /></mesh>
            </group>
          ))}
        </group>
      </PartGroup>

      <PartGroup id="hopper" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <mesh position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.78, 0.58, 48, 1, true]} />
          <meshStandardMaterial color={selectedMaterial("hopper", "#475569")} roughness={0.78} metalness={0.08} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -1.42, 0]}><cylinderGeometry args={[0.24, 0.24, 0.14, 24]} /><meshStandardMaterial color="#334155" roughness={0.62} metalness={0.2} /></mesh>
      </PartGroup>

      <PartGroup id="scum" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <group position={[-2.56, 0.63, -0.54]} rotation={[0, -0.32, 0]}>
          <mesh position={[0.55, 0, 0]}><boxGeometry args={[1.35, 0.11, 0.14]} /><meshStandardMaterial color={selectedMaterial("scum", "#64748b")} roughness={0.46} metalness={0.38} /></mesh>
          <mesh position={[-0.22, -0.16, 0]}><boxGeometry args={[0.12, 0.38, 0.18]} /><meshStandardMaterial color="#475569" roughness={0.58} metalness={0.24} /></mesh>
          <mesh position={[1.25, 0.04, 0]}><boxGeometry args={[0.48, 0.18, 0.34]} /><meshStandardMaterial color="#94a3b8" roughness={0.62} metalness={0.18} /></mesh>
        </group>
      </PartGroup>

      <PartGroup id="underflow" activePart={activePart} exploded={exploded} onSelect={onPartSelect}>
        <mesh><tubeGeometry args={[underflowCurve, 32, 0.12, 12, false]} /><meshStandardMaterial color={selectedMaterial("underflow", "#475569")} roughness={0.44} metalness={0.48} /></mesh>
        <mesh position={[1.58, -1.28, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.17, 0.17, 0.16, 24]} /><meshStandardMaterial color="#94a3b8" roughness={0.48} metalness={0.34} /></mesh>
      </PartGroup>

      <FlowIllustration visible={!exploded} paused={!animated} />
      {exploded && CLARIFIER_PARTS.map((part) => {
        const anchor = LABEL_ANCHORS[part.id];
        const offset = EXPLODED_OFFSETS[part.id];
        return <PartNumber key={part.id} id={part.id} position={[anchor[0] + offset[0], anchor[1] + offset[1], anchor[2] + offset[2]]} visible />;
      })}
    </>
  );
}

// Observe the actual renderer, including loss of a previously working GPU context.
function RendererHealth({ onReady, onUnavailable }: { onReady: () => void; onUnavailable?: () => void }) {
  const gl = useThree(state => state.gl);
  const ready = useRef(false);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onUnavailable?.(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  useFrame(({ invalidate }) => {
    if (ready.current) return;
    // Runs before this frame: calls > 0 proves a preceding frame drew geometry.
    if (gl.info.render.calls > 0) {
      ready.current = true;
      gl.domElement.dataset.sceneReady = "true";
      onReady();
    } else invalidate();
  });
  return null;
}

export default function ClarifierThreeLab({ onStudyLink, onUnavailable }: ThreeClarifierProps) {
  const startupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rendered = useRef(false);
  const markReady = useCallback(() => { rendered.current = true; clearTimeout(startupTimer.current); }, []);
  useEffect(() => {
    // Covers silent/async renderer initialization failures outside a React boundary.
    if (!rendered.current) startupTimer.current = setTimeout(() => onUnavailable?.(), 15_000);
    return () => clearTimeout(startupTimer.current);
  }, [onUnavailable]);
  const [activePart, setActivePart] = useState<ClarifierPartId>("feedwell");
  const [activeStage, setActiveStage] = useState<ClarifierStageId | null>(null);
  const [view, setView] = useState<ClarifierView>("isometric");
  const [waterVisible, setWaterVisible] = useState(true);
  const [solidsVisible, setSolidsVisible] = useState(true);
  const [flowing, setFlowing] = useState(true);
  const [lens, setLens] = useState<Lens>("operator");
  const [resetSignal, setResetSignal] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const exploded = view === "exploded";
  const animated = shouldAnimateClarifier(flowing, reducedMotion, exploded);
  const selectedPart = CLARIFIER_PARTS.find((part) => part.id === activePart) ?? CLARIFIER_PARTS[0];

  const selectPart = (id: ClarifierPartId) => {
    setActivePart(id);
    setActiveStage(null);
  };

  const selectStage = (id: ClarifierStageId) => {
    setActiveStage(id);
    setActivePart(CLARIFIER_STAGE_PARTS[id]);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white" aria-label="Three-dimensional circular clarifier learning model">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Circular clarifier · centre feed</p>
              <p className="mt-0.5 text-xs text-slate-500">Drag to orbit · scroll or pinch to zoom · select a component</p>
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="3D clarifier views">
              {THREE_CLARIFIER_VIEWS.map((option) => {
                const Icon = option.icon;
                const selected = view === option.id;
                return (
                  <button key={option.id} onClick={() => setView(option.id)} aria-pressed={selected}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}>
                    <Icon size={13} aria-hidden="true" /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[360px] bg-slate-100 sm:h-[440px] lg:h-[510px]">
            <Canvas
              shadows
              orthographic
              camera={{ position: clarifierCameraPosition("isometric"), zoom: 52, near: 0.1, far: 100 }}
              dpr={[1, 1.5]}
              frameloop={animated ? "always" : "demand"}
              fallback={<div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-700">3D rendering is unavailable in this browser. Use the Diagram view above.</div>}
            >
              <RendererHealth onReady={markReady} onUnavailable={onUnavailable} />
              <ClarifierScene
                activePart={activePart}
                onPartSelect={selectPart}
                view={view}
                waterVisible={waterVisible}
                solidsVisible={solidsVisible}
                flowing={flowing}
                prefersReducedMotion={reducedMotion}
                resetSignal={resetSignal}
              />
            </Canvas>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Clarifier display controls">
              <button onClick={() => setWaterVisible((value) => !value)} aria-pressed={waterVisible} className={`inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${waterVisible ? "border-sky-700 bg-sky-50 text-sky-800" : "border-slate-300 text-slate-600"}`}>
                <Waves size={14} aria-hidden="true" /> Water {waterVisible ? "shown" : "hidden"}
              </button>
              <button onClick={() => setSolidsVisible((value) => !value)} aria-pressed={solidsVisible} className={`min-h-10 rounded-md border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${solidsVisible ? "border-slate-500 bg-slate-100 text-slate-800" : "border-slate-300 text-slate-600"}`}>
                Solids {solidsVisible ? "shown" : "hidden"}
              </button>
              <button onClick={() => setFlowing((value) => !value)} aria-pressed={flowing} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                {animated ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                {reducedMotion ? "Motion reduced" : flowing ? "Flow motion on" : "Flow motion off"}
              </button>
            </div>
            <button onClick={() => setResetSignal((value) => value + 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
              <RotateCcw size={14} aria-hidden="true" /> Reset view
            </button>
          </div>
          {exploded && <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Water, solids, and motion are suppressed in exploded view.</p>}
        </div>

        <aside className="border-t border-slate-300 bg-white p-5 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Explore the assembly</p>
            <span className="text-xs font-semibold tabular-nums text-slate-400">{PART_ORDER[activePart]} / 07</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CLARIFIER_PARTS.map((part) => (
              <button key={part.id} onClick={() => selectPart(part.id)} aria-pressed={activePart === part.id}
                className={`min-h-11 rounded-md border px-2.5 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${activePart === part.id ? "border-teal-700 bg-teal-50 text-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"}`}>
                <span className="mr-1.5 text-[10px] tabular-nums text-slate-400">{PART_ORDER[part.id]}</span>{part.label}
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5" aria-live="polite">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-700">Selected component</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{selectedPart.label}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedPart.function}</p>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="flex gap-4" role="tablist" aria-label="Component learning details">
              {(["operator", "exam"] as const).map((option) => (
                <button key={option} role="tab" aria-selected={lens === option} onClick={() => setLens(option)} className={`min-h-9 border-b-2 px-0 text-xs font-semibold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${lens === option ? "border-teal-700 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                  {option === "operator" ? "Operator lens" : "Exam connection"}
                </button>
              ))}
            </div>
            <p role="tabpanel" className="mt-3 text-sm leading-6 text-slate-600">{lens === "operator" ? selectedPart.operatorLens : selectedPart.examConnection}</p>
          </div>

          <button onClick={onStudyLink} className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4 transition-colors hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Open wastewater study guide</button>
        </aside>
      </div>

      <section className="border-t border-slate-300 px-5 py-5" aria-labelledby="clarification-stages-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">The process</p>
            <h3 id="clarification-stages-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Clarification stages</h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">Select a stage to connect the process step with its primary assembly.</p>
        </div>
        <ol className="mt-4 grid divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {CLARIFIER_STAGES.map((stage) => (
            <li key={stage.id}>
              <button onClick={() => selectStage(stage.id)} aria-pressed={activeStage === stage.id} className={`min-h-32 w-full px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700 ${activeStage === stage.id ? "bg-teal-50" : "hover:bg-slate-50"}`}>
                <span className="text-xs font-semibold tabular-nums text-slate-400">{stage.step}</span>
                <h4 className="mt-2 text-sm font-semibold text-slate-900">{stage.title}</h4>
                <p className="mt-1 text-xs leading-5 text-slate-600">{stage.description}</p>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
        <span>Conceptual educational model · Not to scale</span>
        <span>Illustrative flow and component relationships only.</span>
      </div>
    </section>
  );
}
