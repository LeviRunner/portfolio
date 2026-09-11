import * as THREE from "three";
import { C } from "./palette";

export type NodeState = "idle" | "run" | "pass" | "fail" | "retry";

/** Todo estado que o pipeline chega a emitir — "idle" é só o repouso inicial. */
export type RunState = Exclude<NodeState, "idle">;

export interface CicdNode {
  id: string;
  x: number;
  y: number;
}

export const CICD_NODES: readonly CicdNode[] = [
  { id: "commit", x: -7.4, y: 0 },
  { id: "build", x: -4.2, y: 0 },
  { id: "test:unit", x: -1.0, y: 2.1 },
  { id: "test:int", x: -1.0, y: -2.1 },
  { id: "scan", x: 2.2, y: 0 },
  { id: "deploy:stg", x: 5.0, y: 0 },
  { id: "deploy:prod", x: 7.8, y: 0 },
];

export const NODE_IDS: readonly string[] = CICD_NODES.map((n) => n.id);

export const CICD_EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6],
];

/** [nó, estado, atraso em ms desde o passo anterior] — a fonte única da verdade. */
export type CicdStep = readonly [string, RunState, number];

export const CICD_RUN: readonly CicdStep[] = [
  ["commit", "pass", 220], ["build", "run", 260], ["build", "pass", 1250],
  ["test:unit", "run", 200], ["test:int", "run", 160],
  ["test:unit", "pass", 1150], ["test:int", "fail", 1450],
  ["test:int", "retry", 720], ["test:int", "run", 460], ["test:int", "pass", 1250],
  ["scan", "run", 300], ["scan", "pass", 880],
  ["deploy:stg", "run", 320], ["deploy:stg", "pass", 1050],
  ["deploy:prod", "run", 420], ["deploy:prod", "pass", 1350],
];

/** Rótulo e cor de cada estado, compartilhados pelo terminal e pelos pills. */
export const STATE_TEXT: Record<RunState, string> = {
  run: "▶ running",
  pass: "✓ passed",
  fail: "✗ failed (exit 1)",
  retry: "↻ retry 1/2",
};

export const STATE_HEX: Record<NodeState, string> = {
  idle: "#3F4B54",
  run: "#FBBF24",
  pass: "#4ADE80",
  fail: "#F87171",
  retry: "#FBBF24",
};

export const stateColors = (): Record<NodeState, THREE.Color> => ({
  idle: new THREE.Color(C.line),
  run: new THREE.Color(C.amber),
  pass: new THREE.Color(C.accent),
  fail: new THREE.Color(C.red),
  retry: new THREE.Color(C.amber),
});
