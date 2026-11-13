import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Eye,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Waves,
} from "lucide-react";
import {
  type ComponentRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

import EquipmentClarifierScene from "./EquipmentClarifierScene";
import { equipmentCameraZoom } from "@/lib/equipmentClarifierModel";

type Lens = "operator" | "exam";

const PART_ORDER: Record<ClarifierPartId, string> = {
  feedwell: "01",
  weir: "02",
  bridge: "03",
  scrapers: "04",
  hopper: "05",
  scum: "06",
  underflow: "07",
};

export const THREE_CLARIFIER_VIEWS: {
  id: ClarifierView;
  label: string;
  icon: typeof Eye;
}[] = [
  { id: "isometric", label: "Orbit", icon: Eye },
  { id: "top", label: "Top", icon: Layers3 },
  { id: "cutaway", label: "Cutaway", icon: RotateCcw },
  { id: "exploded", label: "Exploded", icon: Sparkles },
];

export function clarifierCameraPosition(
  view: ClarifierView
): [number, number, number] {
  if (view === "top") return [0.01, 10.8, 0.01];
  if (view === "cutaway") return [8.1, 5.15, 8.1];
  if (view === "exploded") return [9.2, 6.4, 9.2];
  return [8.1, 5.9, 8.1];
}

export function shouldAnimateClarifier(
  flowing: boolean,
  prefersReducedMotion: boolean,
  exploded = false
) {
  return flowing && !prefersReducedMotion && !exploded;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
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

function CameraRig({
  view,
  resetSignal,
  reducedMotion,
}: {
  view: ClarifierView;
  resetSignal: number;
  reducedMotion: boolean;
}) {
  const { camera, invalidate, size } = useThree();
  const fitZoom = equipmentCameraZoom(
    size.width,
    size.height,
    view === "exploded"
  );
  useEffect(() => {
    (camera as THREE.OrthographicCamera).zoom = fitZoom;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, fitZoom, resetSignal, invalidate]);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transition = useRef<{
    elapsed: number;
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    const targetPosition = new THREE.Vector3(...clarifierCameraPosition(view));
    const target = new THREE.Vector3(0, view === "exploded" ? 0.7 : -0.15, 0);

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
      startTarget:
        controls.current?.target.clone() ??
        new THREE.Vector3(0, view === "exploded" ? 0.7 : -0.15, 0),
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
    camera.position.lerpVectors(
      active.startPosition,
      active.targetPosition,
      eased
    );
    controls.current?.target.lerpVectors(
      active.startTarget,
      active.target,
      eased
    );
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
      minZoom={fitZoom * 0.7}
      maxZoom={fitZoom * 2.5}
      minPolarAngle={0.03}
      maxPolarAngle={Math.PI / 2 - 0.04}
      enableRotate={view !== "top"}
      onStart={() => {
        transition.current = null;
      }}
      onChange={() => invalidate()}
    />
  );
}

// Observe the actual renderer, including loss of a previously working GPU context.
function RendererHealth({
  onReady,
  onUnavailable,
}: {
  onReady: () => void;
  onUnavailable?: () => void;
}) {
  const gl = useThree(state => state.gl);
  const ready = useRef(false);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable?.();
    };
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

export default function EquipmentClarifierThreeLab({
  onStudyLink,
  onUnavailable,
}: ThreeClarifierProps) {
  const startupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const rendered = useRef(false);
  const markReady = useCallback(() => {
    rendered.current = true;
    clearTimeout(startupTimer.current);
  }, []);
  useEffect(() => {
    // Covers silent/async renderer initialization failures outside a React boundary.
    if (!rendered.current)
      startupTimer.current = setTimeout(() => onUnavailable?.(), 15_000);
    return () => clearTimeout(startupTimer.current);
  }, [onUnavailable]);
  const [activePart, setActivePart] = useState<ClarifierPartId>("feedwell");
  const [activeStage, setActiveStage] = useState<ClarifierStageId | null>(null);
  const [view, setView] = useState<ClarifierView>("cutaway");
  const [waterVisible, setWaterVisible] = useState(true);
  const [solidsVisible, setSolidsVisible] = useState(true);
  const [flowing, setFlowing] = useState(true);
  const [lens, setLens] = useState<Lens>("operator");
  const [resetSignal, setResetSignal] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const exploded = view === "exploded";
  const viewport = useRef<HTMLDivElement>(null);
  const [onscreen, setOnscreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    const observer = new IntersectionObserver(
      ([entry]) => setOnscreen(entry.isIntersecting),
      { rootMargin: "80px" }
    );
    if (viewport.current) observer.observe(viewport.current);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const animated =
    shouldAnimateClarifier(flowing, reducedMotion, exploded) &&
    onscreen &&
    pageVisible;
  const selectedPart =
    CLARIFIER_PARTS.find(part => part.id === activePart) ?? CLARIFIER_PARTS[0];

  const selectPart = (id: ClarifierPartId) => {
    setActivePart(id);
    setActiveStage(null);
  };

  const selectStage = (id: ClarifierStageId) => {
    setView("cutaway");
    setWaterVisible(true);
    setSolidsVisible(true);
    setActiveStage(id);
    setActivePart(CLARIFIER_STAGE_PARTS[id]);
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_60px_-32px_#165464]"
      aria-label="Three-dimensional circular clarifier learning model"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-teal-900 bg-[#123943] px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-200">
                Circular clarifier · centre feed
              </p>
              <p className="mt-0.5 text-xs text-slate-200">
                Drag to orbit · scroll or pinch to zoom · select a component
              </p>
            </div>
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="3D clarifier views"
            >
              {THREE_CLARIFIER_VIEWS.map(option => {
                const Icon = option.icon;
                const selected = view === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setView(option.id)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${selected ? "bg-white text-teal-950" : "text-slate-100 hover:bg-white/10"}`}
                  >
                    <Icon size={13} aria-hidden="true" /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={viewport}
            data-testid="equipment-clarifier-viewport"
            className="relative h-[380px] bg-[#eaf4f5] sm:h-[500px] lg:h-[560px]"
          >
            <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-800">
                Inside the process
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                {view === "exploded"
                  ? "Seven assemblies · one system"
                  : view === "cutaway"
                    ? "Cut away to see what happens below"
                    : "Follow the water. Find the solids."}
              </p>
            </div>
            <Canvas
              shadows
              orthographic
              camera={{
                position: clarifierCameraPosition("cutaway"),
                zoom: 52,
                near: 0.1,
                far: 100,
              }}
              dpr={[1, 1.5]}
              frameloop={animated ? "always" : "demand"}
              fallback={
                <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-700">
                  3D rendering is unavailable in this browser. Use the Diagram
                  view above.
                </div>
              }
            >
              <RendererHealth
                onReady={markReady}
                onUnavailable={onUnavailable}
              />
              <CameraRig
                view={view}
                resetSignal={resetSignal}
                reducedMotion={reducedMotion}
              />
              <EquipmentClarifierScene
                activePart={activePart}
                onPartSelect={selectPart}
                view={view}
                waterVisible={waterVisible}
                solidsVisible={solidsVisible}
                animated={animated}
              />
            </Canvas>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-teal-100 bg-[#f1f8f8] px-4 py-2.5 text-[11px] font-medium text-slate-600"
            aria-label="Illustrative flow legend"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-600" /> Water toward
              the weir
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-700" /> Solids
              toward the hopper
            </span>
            <span className="text-slate-500">
              Paths and speed are illustrative
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Clarifier display controls"
            >
              <button
                onClick={() => setWaterVisible(value => !value)}
                aria-pressed={waterVisible}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${waterVisible ? "border-sky-700 bg-sky-50 text-sky-800" : "border-slate-300 text-slate-600"}`}
              >
                <Waves size={14} aria-hidden="true" /> Water{" "}
                {waterVisible ? "shown" : "hidden"}
              </button>
              <button
                onClick={() => setSolidsVisible(value => !value)}
                aria-pressed={solidsVisible}
                className={`min-h-10 rounded-md border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${solidsVisible ? "border-slate-500 bg-slate-100 text-slate-800" : "border-slate-300 text-slate-600"}`}
              >
                Solids {solidsVisible ? "shown" : "hidden"}
              </button>
              <button
                onClick={() => setFlowing(value => !value)}
                aria-pressed={flowing}
                disabled={reducedMotion || exploded}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {animated ? (
                  <Pause size={14} aria-hidden="true" />
                ) : (
                  <Play size={14} aria-hidden="true" />
                )}
                {reducedMotion
                  ? "Motion reduced"
                  : exploded
                    ? "Motion paused"
                    : flowing
                      ? "Flow motion on"
                      : "Flow motion off"}
              </button>
            </div>
            <button
              onClick={() => {
                setView("cutaway");
                setWaterVisible(true);
                setSolidsVisible(true);
                setFlowing(true);
                setActivePart("feedwell");
                setActiveStage(null);
                setResetSignal(value => value + 1);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset view
            </button>
          </div>
          {exploded && (
            <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
              Water, solids, and motion are suppressed in exploded view.
            </p>
          )}
        </div>

        <aside className="border-t border-slate-300 bg-white p-5 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Explore the assembly
            </p>
            <span className="text-xs font-semibold tabular-nums text-slate-400">
              {PART_ORDER[activePart]} / 07
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CLARIFIER_PARTS.map(part => (
              <button
                key={part.id}
                onClick={() => selectPart(part.id)}
                aria-pressed={activePart === part.id}
                className={`min-h-11 rounded-md border px-2.5 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${activePart === part.id ? "border-teal-700 bg-teal-50 text-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"}`}
              >
                <span className="mr-1.5 text-[10px] tabular-nums text-slate-400">
                  {PART_ORDER[part.id]}
                </span>
                {part.label}
              </button>
            ))}
          </div>

          <div
            className="mt-5 border-t border-slate-200 pt-5"
            aria-live="polite"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-700">
              Selected component
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {selectedPart.label}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {selectedPart.function}
            </p>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div
              className="flex gap-4"
              role="group"
              aria-label="Component learning details"
            >
              {(["operator", "exam"] as const).map(option => (
                <button
                  key={option}
                  aria-pressed={lens === option}
                  onClick={() => setLens(option)}
                  className={`min-h-9 border-b-2 px-0 text-xs font-semibold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${lens === option ? "border-teal-700 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  {option === "operator" ? "Operator lens" : "Exam connection"}
                </button>
              ))}
            </div>
            <p
              aria-live="polite"
              className="mt-3 text-sm leading-6 text-slate-600"
            >
              {lens === "operator"
                ? selectedPart.operatorLens
                : selectedPart.examConnection}
            </p>
          </div>

          {onStudyLink && (
            <button
              onClick={onStudyLink}
              className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4 transition-colors hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              Open wastewater study guide
            </button>
          )}
        </aside>
      </div>

      <section
        className="border-t border-slate-300 px-5 py-5"
        aria-labelledby="clarification-stages-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              The process
            </p>
            <h3
              id="clarification-stages-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
            >
              Clarification stages
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Select a stage to connect the process step with its primary
            assembly.
          </p>
        </div>
        <ol className="mt-4 grid divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {CLARIFIER_STAGES.map(stage => (
            <li key={stage.id}>
              <button
                onClick={() => selectStage(stage.id)}
                aria-pressed={activeStage === stage.id}
                className={`min-h-32 w-full px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700 ${activeStage === stage.id ? "bg-teal-50" : "hover:bg-slate-50"}`}
              >
                <span className="text-xs font-semibold tabular-nums text-slate-400">
                  {stage.step}
                </span>
                <h4 className="mt-2 text-sm font-semibold text-slate-900">
                  {stage.title}
                </h4>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {stage.description}
                </p>
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
