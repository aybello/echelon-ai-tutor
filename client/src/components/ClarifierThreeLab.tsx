import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Eye, Layers3, RotateCcw, Sparkles, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CLARIFIER_PARTS, CLARIFIER_STAGES, ClarifierView } from "@/lib/clarifierLab";

type ThreeClarifierProps = {
  onStudyLink?: () => void;
};

export const THREE_CLARIFIER_VIEWS: { id: ClarifierView; label: string; icon: typeof Eye }[] = [
  { id: "isometric", label: "Orbit", icon: Eye },
  { id: "top", label: "Top", icon: Layers3 },
  { id: "cutaway", label: "Cutaway", icon: RotateCcw },
  { id: "exploded", label: "Exploded", icon: Sparkles },
];

export function clarifierCameraPosition(view: ClarifierView): [number, number, number] {
  if (view === "top") return [0.02, 10.5, 0.02];
  if (view === "cutaway") return [8.4, 4.2, 7.6];
  if (view === "exploded") return [9.2, 6.2, 9.2];
  return [8.5, 5.3, 8.5];
}

export function shouldAnimateClarifier(flowing: boolean, prefersReducedMotion: boolean) {
  return flowing && !prefersReducedMotion;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function CameraRig({ view }: { view: ClarifierView }) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(...clarifierCameraPosition(view)), [view]);

  useFrame(() => {
    camera.position.lerp(desired, 0.075);
    camera.lookAt(0, 0.15, 0);
  });

  return null;
}

function PartLabel({ children, position }: { children: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={11} transform>
      <span className="pointer-events-none whitespace-nowrap rounded-md border border-sky-200/70 bg-slate-950/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-100 shadow-lg">{children}</span>
    </Html>
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
}: {
  activePart: string;
  onPartSelect: (id: string) => void;
  view: ClarifierView;
  waterVisible: boolean;
  solidsVisible: boolean;
  flowing: boolean;
  prefersReducedMotion: boolean;
}) {
  const scraperRef = useRef<THREE.Group>(null);
  const exploded = view === "exploded";
  const cutaway = view === "cutaway";
  const animated = shouldAnimateClarifier(flowing, prefersReducedMotion);

  useFrame((_, delta) => {
    if (animated && scraperRef.current) scraperRef.current.rotation.y += delta * 0.12;
  });

  const select = (event: THREE.Event & { stopPropagation: () => void }, id: string) => {
    event.stopPropagation();
    onPartSelect(id);
  };
  const highlighted = (id: string, base: string) => activePart === id ? "#fbbf24" : base;
  const explode = (id: string): [number, number, number] => {
    if (!exploded) return [0, 0, 0];
    if (id === "feedwell") return [0, 2.25, 0];
    if (id === "bridge") return [0, 1.25, 0];
    if (id === "scrapers") return [0, 0.6, 0];
    if (id === "hopper") return [0, -1.25, 0];
    if (id === "weir") return [0, -0.55, 0];
    if (id === "scum") return [-1.45, 0.85, 0];
    return [1.3, -0.45, 0];
  };

  return (
    <>
      <color attach="background" args={["#06101a"]} />
      <fog attach="fog" args={["#06101a", 10, 22]} />
      <ambientLight intensity={1.7} />
      <hemisphereLight args={["#bfebff", "#1b2630", 1.8]} />
      <directionalLight position={[7, 10, 5]} intensity={2.6} color="#eaf9ff" />
      <pointLight position={[-6, 3, 4]} intensity={20} distance={14} color="#38bdf8" />

      <CameraRig view={view} />
      <OrbitControls enablePan={false} minDistance={7} maxDistance={15} maxPolarAngle={Math.PI / 2.08} minPolarAngle={0.18} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <circleGeometry args={[6.6, 64]} />
        <meshStandardMaterial color="#071d2c" roughness={0.95} metalness={0.05} />
      </mesh>

      <group>
        <mesh position={[0, -0.35, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[3.8, 3.8, 1.4, 64, 1, true]} />
          <meshStandardMaterial color="#9fb3c8" metalness={0.35} roughness={0.47} transparent opacity={cutaway || exploded ? 0.2 : 0.78} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[3.69, 3.69, 0.1, 64]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={waterVisible && !exploded ? 0.57 : 0.08} roughness={0.12} transmission={0.08} />
        </mesh>
        {solidsVisible && !exploded && (
          <mesh position={[0, -0.63, 0]}>
            <cylinderGeometry args={[2.6, 2.95, 0.12, 64]} />
            <meshStandardMaterial color="#7c2d12" transparent opacity={0.64} roughness={0.84} />
          </mesh>
        )}
      </group>

      <group position={explode("weir")} onClick={(event) => select(event, "weir")}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.48, 0]}>
          <torusGeometry args={[3.56, 0.09, 12, 64]} />
          <meshStandardMaterial color={highlighted("weir", "#34d399")} metalness={0.5} roughness={0.32} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.41, 0]}>
          <torusGeometry args={[3.32, 0.04, 10, 64]} />
          <meshStandardMaterial color="#d1fae5" emissive="#065f46" emissiveIntensity={0.35} />
        </mesh>
      </group>

      <group position={explode("feedwell")} onClick={(event) => select(event, "feedwell")}>
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.86, 0.86, 1.45, 48]} />
          <meshStandardMaterial color={highlighted("feedwell", "#0369a1")} metalness={0.25} roughness={0.36} />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 36]} />
          <meshStandardMaterial color="#7dd3fc" metalness={0.45} roughness={0.24} />
        </mesh>
      </group>

      <group position={explode("bridge")} onClick={(event) => select(event, "bridge")}>
        <mesh position={[0, 1.54, 0]}>
          <boxGeometry args={[6.8, 0.18, 0.42]} />
          <meshStandardMaterial color={highlighted("bridge", "#94a3b8")} metalness={0.72} roughness={0.26} />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <boxGeometry args={[0.62, 0.34, 0.62]} />
          <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.31} />
        </mesh>
      </group>

      <group ref={scraperRef} position={explode("scrapers")} onClick={(event) => select(event, "scrapers")}>
        <mesh position={[1.35, 0.07, 0]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[2.7, 0.1, 0.16]} />
          <meshStandardMaterial color={highlighted("scrapers", "#c084fc")} metalness={0.52} roughness={0.26} />
        </mesh>
        <mesh position={[-1.35, 0.07, 0]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[2.7, 0.1, 0.16]} />
          <meshStandardMaterial color={highlighted("scrapers", "#c084fc")} metalness={0.52} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.24, 24]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.6} roughness={0.22} />
        </mesh>
      </group>

      <group position={explode("hopper")} onClick={(event) => select(event, "hopper")}>
        <mesh position={[0, -0.98, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.86, 0.58, 36]} />
          <meshStandardMaterial color={highlighted("hopper", "#92400e")} metalness={0.26} roughness={0.61} />
        </mesh>
      </group>

      <group position={explode("scum")} onClick={(event) => select(event, "scum")}>
        <mesh position={[-2.48, 0.82, -0.32]} rotation={[0, 0.24, 0]}>
          <boxGeometry args={[1.55, 0.13, 0.22]} />
          <meshStandardMaterial color={highlighted("scum", "#fb7185")} metalness={0.38} roughness={0.29} />
        </mesh>
      </group>

      <group position={explode("underflow")} onClick={(event) => select(event, "underflow")}>
        <mesh position={[0.64, -1.18, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 1.42, 24]} />
          <meshStandardMaterial color={highlighted("underflow", "#f97316")} metalness={0.5} roughness={0.33} />
        </mesh>
      </group>

      {exploded && (
        <>
          <PartLabel position={[0, 3.7, 0]}>Feedwell</PartLabel>
          <PartLabel position={[-2.8, 1.6, 0]}>Scum</PartLabel>
          <PartLabel position={[2.95, -0.5, 0]}>Underflow</PartLabel>
        </>
      )}
    </>
  );
}

export default function ClarifierThreeLab({ onStudyLink }: ThreeClarifierProps) {
  const [activePart, setActivePart] = useState("feedwell");
  const [view, setView] = useState<ClarifierView>("isometric");
  const [waterVisible, setWaterVisible] = useState(true);
  const [solidsVisible, setSolidsVisible] = useState(true);
  const [flowing, setFlowing] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const selectedPart = CLARIFIER_PARTS.find((part) => part.id === activePart) ?? CLARIFIER_PARTS[0];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]" aria-label="Three-dimensional circular clarifier learning model">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-sky-300">Three.js exploration</p>
            <p className="mt-0.5 text-xs text-slate-400">Drag to orbit · scroll or pinch to zoom · select a component</p>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="3D clarifier views">
            {THREE_CLARIFIER_VIEWS.map((option) => {
              const Icon = option.icon;
              const selected = view === option.id;
              return (
                <button key={option.id} onClick={() => setView(option.id)} aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${selected ? "bg-sky-300 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                  <Icon size={13} /> {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative h-[440px] bg-[#06101a] sm:h-[540px]">
          <Canvas
            camera={{ position: clarifierCameraPosition("isometric"), fov: 42 }}
            dpr={[1, 1.5]}
            frameloop={shouldAnimateClarifier(flowing, reducedMotion) ? "always" : "demand"}
            fallback={<div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-300">3D rendering is unavailable in this browser. Use the accessible diagram view below.</div>}
          >
            <ClarifierScene
              activePart={activePart}
              onPartSelect={setActivePart}
              view={view}
              waterVisible={waterVisible}
              solidsVisible={solidsVisible}
              flowing={flowing}
              prefersReducedMotion={reducedMotion}
            />
          </Canvas>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <button onClick={() => setFlowing((value) => !value)} aria-pressed={flowing} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${flowing ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : "border-slate-600 bg-slate-900/90 text-slate-300"}`}>
              {reducedMotion ? "Motion reduced" : flowing ? "Flow motion on" : "Flow motion off"}
            </button>
            <button onClick={() => setWaterVisible((value) => !value)} aria-pressed={waterVisible} className="rounded-lg border border-sky-400/40 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-sky-100">
              <Waves size={13} className="mr-1 inline" /> Water {waterVisible ? "shown" : "hidden"}
            </button>
            <button onClick={() => setSolidsVisible((value) => !value)} aria-pressed={solidsVisible} className="rounded-lg border border-amber-400/40 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-amber-100">
              Solids {solidsVisible ? "shown" : "hidden"}
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Selected component</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ background: selectedPart.color }} />
          <h3 className="text-xl font-black text-slate-900">{selectedPart.label}</h3>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{selectedPart.function}</p>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Operator lens</p>
          <p className="mt-1 text-sm leading-6 text-amber-950">{selectedPart.operatorLens}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Exam connection</p>
          <p className="mt-1 text-sm leading-6 text-sky-950">{selectedPart.examConnection}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {CLARIFIER_PARTS.map((part) => (
            <button key={part.id} onClick={() => setActivePart(part.id)} aria-pressed={activePart === part.id}
              className={`rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${activePart === part.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"}`}>
              {part.label}
            </button>
          ))}
        </div>
        <button onClick={onStudyLink} className="mt-5 w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-800">
          Open wastewater study guide
        </button>
      </aside>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2" aria-labelledby="clarification-stages-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Process sequence</p>
            <h3 id="clarification-stages-heading" className="mt-1 text-xl font-black text-slate-900">Clarification stages</h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">Use the model to connect each component to the physical step it supports.</p>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CLARIFIER_STAGES.map((stage) => (
            <li key={stage.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.accent }} /><span className="text-xs font-black tracking-[0.14em] text-slate-400">{stage.step}</span></div>
              <h4 className="mt-3 text-sm font-black text-slate-900">{stage.title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-600">{stage.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
