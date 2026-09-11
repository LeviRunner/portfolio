// Engine do mundo 3D contínuo: um renderer, uma cena, um requestAnimationFrame.
// O scroll da página desliza a câmera por uma spline que liga todas as estações,
// então o visitante atravessa a infraestrutura em vez de ver cenas trocarem.

import * as THREE from "three";
import { C, clamp, damp, lineMat, sampleCurve, solidCloud } from "./palette";
import { CICD_RUN, type RunState } from "./pipeline";
import { LAYOUT, type FocusKey, type Station, type StationDef, type WorldStore } from "./stations";

const FOV = 48;
const SPINE_SAMPLES = 900;
const SPINE_PARTICLES = 520;
const STARS = 1100;
const NARROW_ASPECT = 1.15;
const NARROW_PULLBACK = 1.34;
/** Estações fora desta distância (em índice) da câmera não gastam CPU. */
const UPDATE_WINDOW = 1.6;

/* ── qualidade adaptativa ─────────────────────────────────────
   O alvo é 60 fps. Um canvas em tela cheia a 1,75x de densidade custa caro em
   preenchimento; em vez de fixar uma resolução que some com quadros em telas
   grandes, a densidade sobe e desce sozinha para manter o quadro em 16,7 ms. */
const QUALITY_STEPS = [1, 1.25, 1.5] as const;
const TARGET_FRAME_MS = 1000 / 60;
const SLOW_FRAME_MS = TARGET_FRAME_MS * 1.15;
const FAST_FRAME_MS = TARGET_FRAME_MS * 0.82;
const DOWNGRADE_COOLDOWN_S = 2;
const UPGRADE_COOLDOWN_S = 6;

/* ── resposta ao scroll ───────────────────────────────────────
   Só amortecer sempre atrasa: numa rolagem contínua a câmera fica v/λ atrás do
   texto, e é esse descompasso que se sente como arrasto. Então o alvo leva um
   termo de velocidade à frente, que cancela o atraso em regime, e o
   amortecimento fica só para filtrar o tranco de cada clique da roda. */
const CAMERA_LAMBDA = 12;
const VELOCITY_LAMBDA = 10;
const LEAD_SECONDS = 1 / CAMERA_LAMBDA;
const MAX_LEAD = 0.04;
const MIN_DT = 1 / 240;

/* Dentro de cada trecho entre estações a fração passa por um smoothstep
   parcial: a câmera assenta ao chegar e faz a travessia no meio do caminho, em
   vez de derivar o tempo todo na mesma velocidade. */
const EASE_MIX = 0.6;
const easeSegment = (f: number) => {
  const smooth = f * f * (3 - 2 * f);
  return f + (smooth - f) * EASE_MIX;
};

export type PipelineEvent = (id: string, state: RunState) => void;

export interface WorldApi {
  start(): void;
  stop(): void;
  measure(): void;
  onStation(cb: (index: number, id: string) => void): void;
  run(onEvent: PipelineEvent, onDone: () => void): void;
  reset(): void;
  setReplicas(n: number): void;
  focus(key: FocusKey, index: number): void;
  dispose(): void;
}

interface MountedStation {
  def: StationDef;
  built: Station;
  pos: THREE.Vector3;
}

export function mountWorld(canvas: HTMLCanvasElement): WorldApi | null {
  const devicePixels = window.devicePixelRatio || 1;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      // Em telas densas a própria densidade já suaviza as linhas; o MSAA ali só
      // custaria preenchimento.
      antialias: devicePixels < 1.5,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  // As cores foram escolhidas em espaço linear; manter isso preserva o contraste
  // fino das linhas, que a conversão para sRGB lavaria.
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const store: WorldStore = {
    nodeState: {},
    replicas: 28,
    focus: { etl: -1, projects: -1, stack: -1, endpoints: -1 },
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.bg, 0.0165);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 600);

  /* ── estações ─────────────────────────────────────────────── */
  const stations: MountedStation[] = LAYOUT.map((def) => {
    const built = def.build(store);
    built.group.position.set(def.pos[0], def.pos[1], def.pos[2]);
    scene.add(built.group);
    return { def, built, pos: new THREE.Vector3(...def.pos) };
  });
  const lastStation = stations.length - 1;

  /* ── espinha de dados que liga as estações ────────────────── */
  const spineCurve = new THREE.CatmullRomCurve3(
    stations.map((s) => s.pos.clone()), false, "centripetal", 0.4);
  const spineSamples = sampleCurve(spineCurve, SPINE_SAMPLES);
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spineSamples),
    lineMat(C.line, 0.3)));

  const flow = solidCloud(SPINE_PARTICLES, 0.16, 0.75, C.accent);
  flow.points.frustumCulled = false;
  scene.add(flow.points);
  const flowT = new Float32Array(SPINE_PARTICLES);
  const flowJit = new Float32Array(SPINE_PARTICLES * 2);
  for (let i = 0; i < SPINE_PARTICLES; i++) {
    flowT[i] = Math.random();
    flowJit[i * 2] = (Math.random() - 0.5) * 2.4;
    flowJit[i * 2 + 1] = (Math.random() - 0.5) * 2.4;
  }

  /* ── poeira de fundo: dá paralaxe ao trajeto ──────────────── */
  const stars = solidCloud(STARS, 0.11, 0.45, C.soft);
  const yTop = stations[0].pos.y + 30;
  const yBottom = stations[lastStation].pos.y - 30;
  for (let i = 0; i < STARS; i++) {
    stars.positions[i * 3] = (Math.random() - 0.5) * 150;
    stars.positions[i * 3 + 1] = yTop + Math.random() * (yBottom - yTop);
    stars.positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
  }
  stars.geometry.attributes.position.needsUpdate = true;
  stars.points.frustumCulled = false;
  scene.add(stars.points);

  /* ── curvas de câmera (dependem do aspecto) ───────────────── */
  let camCurve: THREE.CatmullRomCurve3;
  let lookCurve: THREE.CatmullRomCurve3;
  let aspect = 1;
  const UP = new THREE.Vector3(0, 1, 0);
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function rebuildCurves() {
    const narrow = aspect < NARROW_ASPECT;
    const pullback = narrow ? NARROW_PULLBACK : 1;
    const biasMul = narrow ? 0 : 1;
    const camPts: THREE.Vector3[] = [];
    const lookPts: THREE.Vector3[] = [];

    stations.forEach(({ def, pos }) => {
      const cam = new THREE.Vector3(...def.cam).multiplyScalar(pullback).add(pos);
      forward.subVectors(pos, cam).normalize();
      right.crossVectors(forward, UP).normalize();
      const halfHeight = Math.tan(((FOV / 2) * Math.PI) / 180) * cam.distanceTo(pos);
      const look = pos.clone().addScaledVector(right, -def.bias * biasMul * halfHeight * aspect);
      look.y -= (def.lift ?? 0) * halfHeight;
      camPts.push(cam);
      lookPts.push(look);
    });

    camCurve = new THREE.CatmullRomCurve3(camPts, false, "centripetal", 0.4);
    lookCurve = new THREE.CatmullRomCurve3(lookPts, false, "centripetal", 0.4);
  }

  /* ── âncoras de scroll: cada seção alinha com sua estação ─── */
  let anchors: number[] = stations.map((_, i) => i);

  function measure() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let previous = 0;
    anchors = stations.map(({ def }) => {
      const el = document.getElementById(def.anchor);
      if (!el) return previous;
      const rect = el.getBoundingClientRect();
      const center = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
      previous = clamp(Math.max(center, previous), 0, maxScroll);
      return previous;
    });
  }

  // Converte a posição de scroll no parâmetro da spline, de modo que a estação i
  // seja alcançada exatamente quando a seção i está centralizada na viewport.
  function scrollToU(): number {
    const y = window.scrollY;
    if (y <= anchors[0]) return 0;
    if (y >= anchors[lastStation]) return 1;
    for (let i = 0; i < lastStation; i++) {
      const a = anchors[i], b = anchors[i + 1];
      if (y < b) {
        const span = b - a;
        return (i + easeSegment(span > 0 ? (y - a) / span : 0)) / lastStation;
      }
    }
    return 1;
  }

  /* ── resize e qualidade ───────────────────────────────────── */
  let qualityIndex = QUALITY_STEPS.length - 1;

  function applyPixelRatio() {
    renderer.setPixelRatio(Math.min(devicePixels, QUALITY_STEPS[qualityIndex]));
    renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);
  }

  function resize() {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    applyPixelRatio();
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    rebuildCurves();
    measure();
  }

  // Medir força um layout síncrono, então nunca acontece dentro do quadro: só
  // depois que a rolagem para ou que o conteúdo muda de tamanho.
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const debounce = (key: string, fn: () => void, ms: number) => () => {
    const pending = debounceTimers.get(key);
    if (pending) clearTimeout(pending);
    debounceTimers.set(key, setTimeout(fn, ms));
  };
  const remeasure = debounce("measure", measure, 150);
  const requestResize = debounce("resize", resize, 120);

  // O box do <html> não acompanha o crescimento do conteúdo — o do <body> acompanha.
  const ro = new ResizeObserver(requestResize);
  ro.observe(document.body);
  window.addEventListener("resize", requestResize);
  window.addEventListener("scroll", remeasure, { passive: true });
  resize();

  /* ── ponteiro (o canvas não recebe eventos, então ouvimos a janela) ── */
  const pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  /* ── máquina de estado do pipeline ────────────────────────── */
  let timers: ReturnType<typeof setTimeout>[] = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  /* ── loop ─────────────────────────────────────────────────── */
  // O timestamp do próprio requestAnimationFrame basta; THREE.Clock está
  // depreciado e criaria um objeto a mais para a mesma conta.
  let lastFrameTime = 0;
  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  let raf = 0, live = false, u = 0, worldTime = 0, currentStation = 0;
  let frameAvgMs = TARGET_FRAME_MS, qualityCooldown = UPGRADE_COOLDOWN_S;
  let prevRawU = 0, scrollVel = 0;
  let onStationChange: ((index: number, id: string) => void) | null = null;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 1 / 60;
    lastFrameTime = now;
    worldTime += reduced ? dt * 0.25 : dt;
    const t = worldTime;

    // Mantém o quadro em 60 fps mexendo só na densidade de pixels.
    frameAvgMs += (dt * 1000 - frameAvgMs) * 0.06;
    qualityCooldown -= dt;
    if (qualityCooldown <= 0) {
      if (frameAvgMs > SLOW_FRAME_MS && qualityIndex > 0) {
        qualityIndex -= 1;
        applyPixelRatio();
        qualityCooldown = DOWNGRADE_COOLDOWN_S;
      } else if (frameAvgMs < FAST_FRAME_MS && qualityIndex < QUALITY_STEPS.length - 1) {
        qualityIndex += 1;
        applyPixelRatio();
        qualityCooldown = UPGRADE_COOLDOWN_S;
      }
    }

    const rawU = scrollToU();
    if (reduced) {
      u = rawU;
    } else {
      const instantVel = (rawU - prevRawU) / Math.max(dt, MIN_DT);
      scrollVel = damp(scrollVel, instantVel, VELOCITY_LAMBDA, dt);
      const lead = clamp(scrollVel * LEAD_SECONDS, -MAX_LEAD, MAX_LEAD);
      u = damp(u, clamp(rawU + lead, 0, 1), CAMERA_LAMBDA, dt);
    }
    prevRawU = rawU;

    camCurve.getPoint(u, camPos);
    lookCurve.getPoint(u, lookPos);
    if (!reduced) {
      forward.subVectors(lookPos, camPos).normalize();
      right.crossVectors(forward, UP).normalize();
      lookPos.addScaledVector(right, pointer.x * 1.1);
      lookPos.y -= pointer.y * 0.7;
      camPos.y += Math.sin(t * 0.5) * 0.16;
    }
    camera.position.copy(camPos);
    camera.lookAt(lookPos);

    const focus = u * lastStation;
    for (let i = 0; i < stations.length; i++) {
      if (Math.abs(i - focus) <= UPDATE_WINDOW) stations[i].built.update(dt, t);
    }

    const nearest = Math.round(focus);
    if (nearest !== currentStation) {
      currentStation = nearest;
      onStationChange?.(nearest, LAYOUT[nearest].id);
    }

    for (let i = 0; i < SPINE_PARTICLES; i++) {
      flowT[i] = (flowT[i] + dt * 0.014) % 1;
      const p = spineSamples[(flowT[i] * (SPINE_SAMPLES - 1)) | 0];
      flow.positions[i * 3] = p.x + flowJit[i * 2];
      flow.positions[i * 3 + 1] = p.y;
      flow.positions[i * 3 + 2] = p.z + flowJit[i * 2 + 1];
    }
    flow.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  const api: WorldApi = {
    start() { if (!live) { live = true; lastFrameTime = 0; raf = requestAnimationFrame(frame); } },
    stop() { if (live) { live = false; cancelAnimationFrame(raf); } },
    measure,
    onStation(cb) { onStationChange = cb; },

    // O pipeline: uma única sequência agendada, consumida pelo 3D e pelo terminal.
    run(onEvent, onDone) {
      clearTimers();
      store.nodeState = {};
      let acc = 0;
      CICD_RUN.forEach(([id, state, delay]) => {
        acc += delay;
        timers.push(setTimeout(() => {
          store.nodeState = { ...store.nodeState, [id]: state };
          onEvent(id, state);
        }, acc));
      });
      timers.push(setTimeout(onDone, acc + 800));
    },
    reset() { clearTimers(); store.nodeState = {}; },
    setReplicas(n) { store.replicas = clamp(n | 0, 3, 144); },
    focus(key, index) { store.focus[key] = index; },

    dispose() {
      api.stop();
      clearTimers();
      ro.disconnect();
      debounceTimers.forEach(clearTimeout);
      window.removeEventListener("resize", requestResize);
      window.removeEventListener("scroll", remeasure);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((o) => {
        const mesh = o as Partial<THREE.Mesh>;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      renderer.dispose();
    },
  };

  const onVisibility = () => { if (document.hidden) api.stop(); else api.start(); };
  document.addEventListener("visibilitychange", onVisibility);

  return api;
}
