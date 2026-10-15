import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type {
  EquipmentDefinition,
  EquipmentView,
} from "@shared/equipmentRegistry";
import EquipmentAerationScene from "./EquipmentAerationScene";
import { aerationCameraZoom } from "@/lib/equipmentAerationModel";

/** Camera placement per view. Shared by every scene in the lab. */
export function equipmentCameraPosition(
  view: EquipmentView
): [number, number, number] {
  if (view === "top") return [0.01, 11.5, 0.01];
  if (view === "cutaway") return [9.4, 4.8, 9.4];
  if (view === "exploded") return [10.6, 7.2, 10.6];
  return [9.4, 5.6, 9.4];
}

/** Animation runs only when flow is on and the user has not asked for less motion. */
export function shouldAnimate(
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

/** Keeps the model framed on small screens without the user having to pinch. */
function ResponsiveZoom({ exploded }: { exploded: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    if (!cam.isOrthographicCamera) return;
    cam.zoom = aerationCameraZoom(size.width, size.height, exploded);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, exploded]);
  return null;
}

export default function EquipmentThreeStage({
  equipment,
  view,
  activePart,
  onSelectPart,
  flowing,
  onUnavailable,
}: {
  equipment: EquipmentDefinition;
  view: EquipmentView;
  activePart: string;
  onSelectPart: (id: string) => void;
  flowing: boolean;
  onUnavailable?: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const exploded = view === "exploded";
  const animate = shouldAnimate(flowing, reduced, exploded);

  // Some browsers and locked-down devices have no WebGL at all. Detect that up
  // front and hand control back to the page so it can offer the diagram view,
  // rather than mounting a canvas that silently renders nothing.
  const [webglOk] = useState(() => {
    if (typeof document === "undefined") return true;
    try {
      const probe = document.createElement("canvas");
      return Boolean(
        probe.getContext("webgl2") ||
          probe.getContext("webgl") ||
          probe.getContext("experimental-webgl")
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!webglOk) onUnavailable?.();
  }, [webglOk, onUnavailable]);

  if (!webglOk) {
    return (
      <div className="flex min-h-[360px] items-center justify-center p-8 text-sm text-slate-600">
        This browser does not support 3D. Use the Diagram view to continue.
      </div>
    );
  }

  return (
    <div className="relative h-[380px] bg-[#F8FAFC] sm:h-[500px] lg:h-[560px]">
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.8]}
        camera={{ position: equipmentCameraPosition(view), zoom: 40 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#F8FAFC");
        }}
      >
        <ResponsiveZoom exploded={exploded} />
        <ambientLight intensity={0.72} />
        <directionalLight
          position={[7, 11, 6]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 5, -7]} intensity={0.38} />

        {equipment.sceneId === "aeration-basin" ? (
          <EquipmentAerationScene
            parts={equipment.parts}
            view={view}
            activePart={activePart}
            onSelectPart={onSelectPart}
            animate={animate}
          />
        ) : null}

        <OrbitControls
          enablePan={false}
          enableZoom
          minZoom={9}
          maxZoom={110}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, -0.8, 0]}
        />
      </Canvas>

      {reduced && flowing ? (
        <p className="absolute bottom-2 left-3 rounded bg-white/90 px-2 py-1 text-[11px] text-slate-600">
          Motion reduced to match your system setting.
        </p>
      ) : null}
    </div>
  );
}

export { usePrefersReducedMotion };
