import * as THREE from "three";

/** Paleta do mundo 3D. Espelha os tokens de cor da interface. */
export const C = {
  bg: 0x0b0d10,
  accent: 0x4ade80,
  line: 0x2b353d,
  soft: 0x8a97a1,
  faint: 0x18212a,
  red: 0xf87171,
  amber: 0xfbbf24,
} as const;

export type WireMesh = THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
export type SegmentLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
export type Cloud = THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;

export const lineMat = (color: number, opacity: number): THREE.LineBasicMaterial =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity });

/** Sólido em wireframe de arestas — o vocabulário visual do portfólio inteiro. */
export const wire = (
  geometry: THREE.BufferGeometry,
  color: number,
  opacity: number
): WireMesh => new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMat(color, opacity));

export const segment = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  color: number,
  opacity: number
): SegmentLine =>
  new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(color, opacity));

export const ring = (
  radius: number,
  color: number,
  opacity: number,
  segments = 72
): SegmentLine => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat(color, opacity));
};

interface PointsHandle {
  points: Cloud;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
}

export interface VertexColorCloud extends PointsHandle {
  colors: Float32Array;
}

const makePoints = (count: number, material: THREE.PointsMaterial): PointsHandle => {
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { points: new THREE.Points(geometry, material), geometry, positions };
};

/** Nuvem cuja cor é escrita por partícula — usada onde o dado muda de estado. */
export function vertexColorCloud(count: number, size: number, opacity: number): VertexColorCloud {
  const handle = makePoints(
    count,
    new THREE.PointsMaterial({ size, transparent: true, opacity, depthWrite: false, vertexColors: true })
  );
  const colors = new Float32Array(count * 3);
  handle.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { ...handle, colors };
}

/** Nuvem de cor única. */
export function solidCloud(
  count: number,
  size: number,
  opacity: number,
  color: number
): PointsHandle {
  return makePoints(
    count,
    new THREE.PointsMaterial({ size, transparent: true, opacity, depthWrite: false, color })
  );
}

/** Amostra a curva uma vez para que o loop não pague getPointAt por partícula. */
export function sampleCurve(curve: THREE.Curve<THREE.Vector3>, count: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) out.push(curve.getPointAt(i / (count - 1)));
  return out;
}

/** Interpolação estável em qualquer taxa de quadros. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;
