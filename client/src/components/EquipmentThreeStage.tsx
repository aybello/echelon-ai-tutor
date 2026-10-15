import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type {
  EquipmentDefinition,
  EquipmentView,
} from "@shared/equipmentRegistry";
import EquipmentAerationScene from "./EquipmentAerationScene";
import { aerationCameraZoom } from "@/lib/equipmentAerationModel";
import { supportsWebGL2 } from "@/lib/webglSupport";

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

/**
 * Drives the camera from the view buttons and keeps the model framed on small
 * screens.
 *
 * The `camera` prop on `<Canvas>` only applies on first mount, and OrbitControls
 * then owns the camera. Without this, once a learner drags the model the Top,
 * Cutaway and Exploded buttons stop moving the camera at all, which makes the
 * whole control strip look broken.
 */
function CameraRig({
  view,
  exploded,
  controls,
}: {
  view: EquipmentView;
  exploded: boolean;
  controls: React.MutableRefObject<{ update: () => void } | null>;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    if (!cam.isOrthographicCamera) return;
    cam.zoom = aerationCameraZoom(size.width, size.height, exploded);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, exploded]);

  useEffect(() => {
    const [x, y, z] = equipmentCameraPosition(view);
    camera.position.set(x, y, z);
    camera.lookAt(0, -0.8, 0);
    camera.updateProjectionMatrix();
    controls.current?.update();
  }, [camera, view, controls]);

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
  const controlsRef = useRef<{ update: () => void } | null>(null);

  // Three.js here requires WebGL 2. Use the one shared probe the rest of the
  // app uses, so the page and the stage cannot disagree about whether 3D is
  // available. A looser WebGL 1 check would let the canvas mount and then
  // render nothing at all.
  const [webglOk] = useState(() =>
    typeof document === "undefined" ? true : supportsWebGL2()
  );

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
        <CameraRig view={view} exploded={exploded} controls={controlsRef} />
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
          ref={controlsRef as never}
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
