import { createContext } from "react";

/** QuizShell supplies an in-flow slot; standalone tutors use a viewport drawer. */
export const TutorPanelPlacement = createContext<"drawer" | "workspace">("drawer");
