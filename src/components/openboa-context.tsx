"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Yogurt } from "@openboa/yogurt";
import { createYogurtAgent } from "@openboa/yogurt/agent";
import { registerTools } from "@ui-sdk/react/agent";

export type OpenBoaAppearance = "light" | "dark";
export type OpenBoaOrbitDir = "cw" | "ccw";

interface OpenBoaContextValue {
  appearance: OpenBoaAppearance;
  setAppearance: (next: OpenBoaAppearance) => void;
  activeAct: number;
  setActiveAct: (act: number) => void;
  orbitDir: OpenBoaOrbitDir;
  setOrbitDir: (dir: OpenBoaOrbitDir) => void;
  holding: boolean;
  setHolding: (v: boolean) => void;
}

const OpenBoaContext = createContext<OpenBoaContextValue | null>(null);

export function OpenBoaProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<OpenBoaAppearance>("light");
  const [activeAct, setActiveAct] = useState(0);
  const [orbitDir, setOrbitDir] = useState<OpenBoaOrbitDir>("cw");
  const [holding, setHolding] = useState(false);

  const setAppearance = useCallback((next: OpenBoaAppearance) => {
    setAppearanceState(next);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.appearance = appearance;
    html.classList.add("yg-root");
  }, [appearance]);

  // Progressive WebMCP tool registration via @openboa/yogurt/agent + @ui-sdk/react/agent
  useEffect(() => {
    const agent = createYogurtAgent({
      allow: (step) => !step.confirm,
    });
    const unregister = registerTools(agent, {
      allow: () => true,
    });
    return () => {
      if (typeof unregister === "function") unregister();
    };
  }, []);

  return (
    <OpenBoaContext.Provider
      value={{
        appearance,
        setAppearance,
        activeAct,
        setActiveAct,
        orbitDir,
        setOrbitDir,
        holding,
        setHolding,
      }}
    >
      <Yogurt
        appearance={appearance}
        material="neutral"
        className="min-h-dvh bg-transparent"
      >
        {children}
      </Yogurt>
    </OpenBoaContext.Provider>
  );
}

export function useOpenBoa() {
  const ctx = useContext(OpenBoaContext);
  if (!ctx) {
    throw new Error("useOpenBoa must be used within OpenBoaProvider");
  }
  return ctx;
}
