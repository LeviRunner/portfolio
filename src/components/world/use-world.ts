"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorldApi } from "@/lib/world/engine";
import type { FocusKey } from "@/lib/world/stations";
import {
  CICD_RUN, STATE_HEX, STATE_TEXT, type NodeState, type RunState,
} from "@/lib/world/pipeline";

export interface LogLine {
  time: string;
  id: string;
  text: string;
  color: string;
}

const FIRST_RUN_MS = 1400;
const AUTO_RESTART_MS = 5000;
const TAIL_MS = 800;
const MAX_LOG_LINES = 24;
const DEFAULT_REPLICAS = 28;

export interface World {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  station: number;
  nodeStates: Record<string, NodeState>;
  log: LogLine[];
  running: boolean;
  replicas: number;
  setReplicas: (n: number) => void;
  runPipeline: () => void;
  resetPipeline: () => void;
  fireCommit: () => void;
  focus: (key: FocusKey, index: number) => void;
}

/**
 * Ciclo de vida do mundo 3D e do pipeline que ele encena. O engine é carregado
 * sob demanda para ficar fora do bundle inicial; sem WebGL, a mesma sequência
 * roda só no terminal.
 */
export function useWorld(): World {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WorldApi | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef<() => void>(() => {});
  const runningRef = useRef(false);
  const replicasRef = useRef(DEFAULT_REPLICAS);

  const [station, setStation] = useState(0);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [log, setLog] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [replicas, setReplicasState] = useState(DEFAULT_REPLICAS);

  const clearPending = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    loopRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runPipeline = useCallback(() => {
    clearPending();
    setNodeStates({});
    setLog([]);
    setRunning(true);
    runningRef.current = true;

    const startedAt = performance.now();
    const onEvent = (id: string, state: RunState) => {
      const at = ((performance.now() - startedAt) / 1000).toFixed(1).padStart(4, "0");
      setNodeStates((prev) => ({ ...prev, [id]: state }));
      setLog((prev) =>
        [...prev, { time: `${at}s`, id, text: STATE_TEXT[state], color: STATE_HEX[state] }]
          .slice(-MAX_LOG_LINES));
    };
    const onDone = () => {
      setRunning(false);
      runningRef.current = false;
      loopRef.current = setTimeout(() => runRef.current(), AUTO_RESTART_MS);
    };

    const world = worldRef.current;
    if (world) {
      world.run(onEvent, onDone);
      return;
    }
    // Sem WebGL a narrativa continua: mesma sequência, só no log e nos pills.
    let acc = 0;
    CICD_RUN.forEach(([id, state, delay]) => {
      acc += delay;
      timersRef.current.push(setTimeout(() => onEvent(id, state), acc));
    });
    timersRef.current.push(setTimeout(onDone, acc + TAIL_MS));
  }, [clearPending]);

  useEffect(() => {
    runRef.current = runPipeline;
  }, [runPipeline]);

  const resetPipeline = useCallback(() => {
    clearPending();
    worldRef.current?.reset();
    setNodeStates({});
    setLog([]);
    setRunning(false);
    runningRef.current = false;
  }, [clearPending]);

  const fireCommit = useCallback(() => {
    if (!runningRef.current) runRef.current();
  }, []);

  const setReplicas = useCallback((n: number) => {
    replicasRef.current = n;
    setReplicasState(n);
    worldRef.current?.setReplicas(n);
  }, []);

  const focus = useCallback((key: FocusKey, index: number) => {
    worldRef.current?.focus(key, index);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let mounted: WorldApi | null = null;
    const markUnavailable = () => {
      document.documentElement.dataset.webgl = "off";
    };

    import("@/lib/world/engine")
      .then(({ mountWorld }) => {
        if (disposed) return;
        mounted = mountWorld(canvas);
        if (!mounted) {
          markUnavailable();
          return;
        }
        worldRef.current = mounted;
        mounted.setReplicas(replicasRef.current);
        mounted.onStation(setStation);
        mounted.start();
        mounted.measure();
      })
      .catch(markUnavailable);

    return () => {
      disposed = true;
      mounted?.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    loopRef.current = setTimeout(() => runRef.current(), FIRST_RUN_MS);
    return clearPending;
  }, [clearPending]);

  return {
    canvasRef,
    station,
    nodeStates,
    log,
    running,
    replicas,
    setReplicas,
    runPipeline,
    resetPipeline,
    fireCommit,
    focus,
  };
}
