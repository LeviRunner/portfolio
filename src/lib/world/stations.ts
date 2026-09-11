// As oito estações do mundo 3D. Cada builder devolve { group, update(dt, t) } e lê
// o estado compartilhado (`store`) — nenhuma delas conhece o DOM ou a câmera.

import * as THREE from "three";
import {
  C, damp, liveSegment, ring, segment, solidCloud, vertexColorCloud, wire,
  type SegmentLine, type WireMesh,
} from "./palette";
import { CICD_EDGES, CICD_NODES, stateColors, type NodeState } from "./pipeline";

/** As seções que acendem um objeto 3D quando o visitante passa o mouse. */
export type FocusKey = "etl" | "projects" | "stack" | "endpoints";

export interface WorldStore {
  nodeState: Record<string, NodeState>;
  replicas: number;
  focus: Record<FocusKey, number>;
}

export interface Station {
  group: THREE.Group;
  update(dt: number, t: number): void;
}

export interface StationDef {
  id: string;
  /** id do elemento no DOM cujo centro define a chegada da câmera. */
  anchor: string;
  pos: readonly [number, number, number];
  /** Deslocamento da câmera em relação a `pos`. */
  cam: readonly [number, number, number];
  /** Fração da meia-largura que empurra o objeto para o lado (positivo = à direita). */
  bias: number;
  /** Fração da meia-altura que sobe o objeto, abrindo espaço para o conteúdo embaixo. */
  lift?: number;
  build(store: WorldStore): Station;
}

/* ══ 00 / 03 · grafo de CI/CD ═══════════════════════════════════
   Instanciado duas vezes: gigante no hero e menor, de perfil, na estação de
   entrega contínua. Os dois leem o mesmo store.nodeState, então animam juntos. */
function cicdGraph(store: WorldStore, spark = 3): Station {
  const STATE = stateColors();
  const group = new THREE.Group();

  const nodes = CICD_NODES.map((n, i) => {
    const m = wire(new THREE.OctahedronGeometry(i === 0 ? 0.62 : 0.85, 0), C.line, 0.6);
    m.position.set(n.x, n.y, 0);
    m.userData = { id: n.id };
    group.add(m);
    return m;
  });

  const halos = nodes.map((n) => {
    const h = wire(new THREE.OctahedronGeometry(1.5, 0), C.line, 0);
    h.position.copy(n.position);
    group.add(h);
    return h;
  });

  const edges = CICD_EDGES.map(([a, b]) => {
    const l = segment(
      new THREE.Vector3(CICD_NODES[a].x, CICD_NODES[a].y, 0),
      new THREE.Vector3(CICD_NODES[b].x, CICD_NODES[b].y, 0), C.line, 0.35);
    group.add(l);
    return l;
  });

  // esferas de luz percorrendo as arestas
  const total = CICD_EDGES.length * spark;
  const cloud = vertexColorCloud(total, 0.26, 0.95);
  const phase = new Float32Array(total);
  for (let i = 0; i < total; i++) phase[i] = (i % spark) / spark + Math.random() * 0.1;
  group.add(cloud.points);

  const tmp = new THREE.Color();
  const stateOf = (id: string): NodeState => store.nodeState[id] ?? "idle";

  return {
    group,
    update(dt, t) {
      nodes.forEach((n, i) => {
        const st = stateOf(n.userData.id as string);
        n.material.color.lerp(STATE[st], Math.min(1, dt * 6));
        const pulse = st === "run" || st === "retry" ? 1 + Math.sin(t * 8) * 0.14 : 1;
        const grow = st === "idle" ? 1 : 1.14;
        n.scale.setScalar(damp(n.scale.x, pulse * grow, 9, dt));
        n.material.opacity = st === "idle" ? 0.5 : 1;
        n.rotation.y += dt * (st === "run" ? 1.6 : 0.28);
        n.rotation.x = Math.sin(t * 0.4 + i) * 0.22;

        const h = halos[i];
        h.rotation.copy(n.rotation);
        h.rotation.y *= -0.6;
        const want = st === "idle" ? 0 : st === "fail" ? 0.28 : 0.16;
        h.material.opacity = damp(h.material.opacity, want, 5, dt);
        h.material.color.lerp(STATE[st], Math.min(1, dt * 6));
        h.scale.setScalar(1 + Math.sin(t * 1.6 + i) * 0.06);
      });

      for (let k = 0; k < CICD_EDGES.length; k++) {
        const [ai, bi] = CICD_EDGES[k];
        const A = CICD_NODES[ai], B = CICD_NODES[bi];
        const sa = stateOf(A.id), sb = stateOf(B.id);
        const on = sa !== "idle" && sb !== "idle";
        edges[k].material.color.lerp(on ? STATE.pass : STATE.idle, Math.min(1, dt * 4));
        edges[k].material.opacity = on ? 0.7 : 0.3;

        const flowing = sa !== "idle";
        const col = sb === "fail" ? STATE.fail
          : sb === "retry" ? STATE.retry
            : flowing ? STATE.pass : STATE.idle;
        for (let j = 0; j < spark; j++) {
          const i = k * spark + j;
          phase[i] = (phase[i] + dt * (flowing ? 0.55 : 0.13)) % 1;
          const u = phase[i];
          cloud.positions[i * 3] = A.x + (B.x - A.x) * u;
          cloud.positions[i * 3 + 1] = A.y + (B.y - A.y) * u;
          cloud.positions[i * 3 + 2] = Math.sin(u * Math.PI) * 0.35;
          tmp.copy(col).multiplyScalar(flowing ? 1 : 0.22);
          cloud.colors[i * 3] = tmp.r; cloud.colors[i * 3 + 1] = tmp.g; cloud.colors[i * 3 + 2] = tmp.b;
        }
      }
      cloud.geometry.attributes.position.needsUpdate = true;
      cloud.geometry.attributes.color.needsUpdate = true;
    },
  };
}

/* ══ 00 · hero ══════════════════════════════════════════════════ */
function buildHero(store: WorldStore): Station {
  const group = new THREE.Group();
  const graph = cicdGraph(store);
  group.add(graph.group);

  const grid = new THREE.GridHelper(80, 40, C.line, C.faint);
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  grid.position.y = -9;
  group.add(grid);

  return {
    group,
    update(dt, t) {
      graph.update(dt, t);
      graph.group.rotation.y = Math.sin(t * 0.13) * 0.1;
    },
  };
}

/* ══ 01 · ingestão & ETL ════════════════════════════════════════ */
function buildEtl(store: WorldStore): Station {
  const group = new THREE.Group();
  group.scale.setScalar(0.68);

  const SRC = [2.9, 1.0, -1.0, -2.9].map((y) => new THREE.Vector3(-8.6, y, 0));
  const ETL = new THREE.Vector3(-2.6, 0, 0);
  const WH = new THREE.Vector3(2.4, 0, 0);
  const DASH = new THREE.Vector3(7.4, 0, 0);

  const at = (geo: THREE.BufferGeometry, pos: THREE.Vector3, color: number, op: number): WireMesh => {
    const m = wire(geo, color, op);
    m.position.copy(pos);
    group.add(m);
    return m;
  };

  const sources = SRC.map((p) => at(new THREE.BoxGeometry(0.9, 0.9, 0.9), p, C.line, 0.85));
  const etl = at(new THREE.IcosahedronGeometry(1.55, 1), ETL, C.accent, 0.5);
  const cage = at(new THREE.BoxGeometry(2.6, 2.6, 2.6), ETL, C.line, 0.65);
  const wh = at(new THREE.CylinderGeometry(1.25, 1.25, 2.1, 16, 3), WH, C.line, 0.8);
  const panel = at(new THREE.BoxGeometry(3.4, 2.2, 0.12), DASH, C.line, 0.7);

  const bars: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.BoxGeometry(0.34, 1, 0.34);
    g.translate(0, 0.5, 0);
    const b = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      wireframe: true, color: C.accent, transparent: true, opacity: 0.85,
    }));
    b.position.set(DASH.x - 1.3 + i * 0.65, -0.85, 0.25);
    b.userData = { seed: Math.random() * 6 };
    group.add(b);
    bars.push(b);
  }

  SRC.forEach((s) => group.add(segment(s, ETL, C.line, 0.28)));
  group.add(segment(ETL, WH, C.line, 0.4));
  group.add(segment(WH, DASH, C.line, 0.4));

  const N = 260;
  const cloud = vertexColorCloud(N, 0.13, 0.9);
  group.add(cloud.points);
  const tt = new Float32Array(N), lane = new Uint8Array(N), spd = new Float32Array(N);
  const jit = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    tt[i] = Math.random();
    lane[i] = i % SRC.length;
    spd[i] = 0.09 + Math.random() * 0.07;
    jit[i * 2] = (Math.random() - 0.5) * 0.5;
    jit[i * 2 + 1] = (Math.random() - 0.5) * 0.9;
  }

  const cRaw = new THREE.Color(C.soft).multiplyScalar(0.75);
  const cClean = new THREE.Color(C.accent);
  const hot = new THREE.Color(C.accent);
  const base = new THREE.Color(C.line);
  const tmp = new THREE.Color();
  const A = new THREE.Vector3();
  const stages: THREE.Object3D[][] = [sources, [cage, etl], [wh], [panel, ...bars]];
  // Um caminho por raia, montado uma vez: antes isto era um array novo por
  // partícula por quadro, 260 alocações a cada 16 ms.
  const PATHS = SRC.map((source) => [source, ETL, WH, DASH]);

  return {
    group,
    update(dt, t) {
      for (let i = 0; i < N; i++) {
        tt[i] = (tt[i] + spd[i] * dt) % 1;
        const path = PATHS[lane[i]];
        const u = tt[i] * 3;
        const k = Math.min(2, Math.floor(u));
        const f = u - k;
        A.copy(path[k]).lerp(path[k + 1], f);
        const spread = k === 0 ? 1 - f : 0.35;
        cloud.positions[i * 3] = A.x;
        cloud.positions[i * 3 + 1] = A.y + jit[i * 2] * spread;
        cloud.positions[i * 3 + 2] = A.z + jit[i * 2 + 1] * spread;
        tmp.copy(cRaw).lerp(cClean, Math.min(1, u / 1.15));
        cloud.colors[i * 3] = tmp.r; cloud.colors[i * 3 + 1] = tmp.g; cloud.colors[i * 3 + 2] = tmp.b;
      }
      cloud.geometry.attributes.position.needsUpdate = true;
      cloud.geometry.attributes.color.needsUpdate = true;

      etl.rotation.y += dt * 0.9;
      etl.rotation.x += dt * 0.35;
      cage.rotation.y -= dt * 0.18;
      wh.rotation.y += dt * 0.25;
      bars.forEach((b) => {
        const h = 0.5 + (Math.sin(t * 1.3 + (b.userData.seed as number)) * 0.5 + 0.5) * 1.5;
        b.scale.y = damp(b.scale.y, h, 3, dt);
      });

      const active = store.focus.etl;
      stages.forEach((objs, gi) => objs.forEach((o) => {
        const mat = (o as WireMesh).material;
        mat.color.lerp(gi === active || o === etl ? hot : base, Math.min(1, dt * 6));
        if (o !== etl) mat.opacity = damp(mat.opacity, gi === active ? 1 : 0.72, 6, dt);
      }));

      group.rotation.y = Math.sin(t * 0.1) * 0.09;
    },
  };
}

/* ══ 02 · cluster de contêineres ════════════════════════════════ */
interface Pod {
  i: number;
  x: number;
  z: number;
  d: number;
  h: number;
  s: number;
}

function buildCloud(store: WorldStore): Station {
  const group = new THREE.Group();
  group.scale.setScalar(0.62);

  const grid = new THREE.GridHelper(26, 26, C.line, C.faint);
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  group.add(grid);

  const COLS = 12, MAX = COLS * COLS, GAP = 1.65;
  const geo = new THREE.BoxGeometry(0.72, 1, 0.72);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(
    geo,
    new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.85 }),
    MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  group.add(mesh);

  const cells: Pod[] = [];
  for (let i = 0; i < MAX; i++) {
    const cx = (i % COLS) - (COLS - 1) / 2;
    const cz = Math.floor(i / COLS) - (COLS - 1) / 2;
    cells.push({ i, x: cx * GAP, z: cz * GAP, d: Math.hypot(cx, cz), h: 0.55 + Math.random() * 2.6, s: 0.001 });
  }
  cells.sort((a, b) => a.d - b.d);

  const cBase = new THREE.Color(C.line).lerp(new THREE.Color(C.soft), 0.4);
  const cHot = new THREE.Color(C.accent);
  cells.forEach((c, rank) => mesh.setColorAt(c.i, rank % 6 === 0 ? cHot : cBase));
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const LB = new THREE.Vector3(0, 7.2, 0);
  const lb = wire(new THREE.OctahedronGeometry(0.9, 0), C.accent, 0.85);
  lb.position.copy(LB);
  group.add(lb);

  const T = 80;
  const traffic = solidCloud(T, 0.17, 0.9, C.accent);
  traffic.points.frustumCulled = false;
  group.add(traffic.points);
  const ttime = new Float32Array(T);
  const target: Pod[] = [];
  for (let i = 0; i < T; i++) { ttime[i] = Math.random(); target.push(cells[(Math.random() * 40) | 0]); }

  const dummy = new THREE.Object3D();
  let shown = 28;

  return {
    group,
    update(dt, t) {
      group.rotation.y += dt * 0.06;
      shown = damp(shown, store.replicas, 3, dt);
      for (let rank = 0; rank < MAX; rank++) {
        const c = cells[rank];
        const on = rank < shown;
        c.s = damp(c.s, on ? 1 : 0.001, 6, dt);
        const breathe = on ? 1 + Math.sin(t * 1.5 + rank * 0.55) * 0.05 : 1;
        dummy.position.set(c.x, 0, c.z);
        dummy.scale.set(c.s, Math.max(0.001, c.s * c.h * breathe), c.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(c.i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      lb.rotation.y += dt * 0.8;
      lb.position.y = LB.y + Math.sin(t * 0.9) * 0.18;

      const lim = Math.max(3, Math.round(shown));
      for (let i = 0; i < T; i++) {
        ttime[i] += dt * 0.85;
        if (ttime[i] >= 1) { ttime[i] %= 1; target[i] = cells[(Math.random() * lim) | 0]; }
        const c = target[i], u = ttime[i];
        traffic.positions[i * 3] = LB.x + (c.x - LB.x) * u;
        traffic.positions[i * 3 + 1] = lb.position.y + (c.h * 0.9 - lb.position.y) * u;
        traffic.positions[i * 3 + 2] = LB.z + (c.z - LB.z) * u;
      }
      traffic.geometry.attributes.position.needsUpdate = true;
    },
  };
}

/* ══ 03 · entrega contínua ══════════════════════════════════════
   O mesmo grafo do hero, menor e de perfil, atravessando o portal de release. */
function buildDelivery(store: WorldStore): Station {
  const group = new THREE.Group();
  const graph = cicdGraph(store, 2);
  graph.group.scale.setScalar(0.62);
  group.add(graph.group);

  const gates = [-1, 1].map((side) => {
    const g = ring(2.6, C.line, 0.5, 48);
    g.rotation.x = Math.PI / 2;
    g.position.set(side * 3.4, 0, 0);
    group.add(g);
    return g;
  });

  const STATE = stateColors();
  const prod = wire(new THREE.BoxGeometry(1.8, 1.8, 1.8), C.line, 0.55);
  prod.position.set(5.6, 0, 0);
  group.add(prod);

  return {
    group,
    update(dt, t) {
      graph.update(dt, t);
      gates.forEach((g, i) => {
        g.rotation.z += dt * (i === 0 ? 0.35 : -0.28);
        g.scale.setScalar(1 + Math.sin(t * 1.1 + i * 1.7) * 0.04);
      });
      const st = store.nodeState["deploy:prod"] ?? "idle";
      prod.material.color.lerp(STATE[st], Math.min(1, dt * 5));
      prod.material.opacity = damp(prod.material.opacity, st === "pass" ? 0.95 : 0.5, 5, dt);
      prod.rotation.y += dt * 0.22;
      prod.rotation.x = Math.sin(t * 0.5) * 0.15;
    },
  };
}

/* ══ 04 · trajetória — anéis orbitais por período ═══════════════ */
function buildTimeline(): Station {
  const group = new THREE.Group();
  const core = wire(new THREE.OctahedronGeometry(1.1, 1), C.accent, 0.55);
  group.add(core);

  const orbits = [3.2, 5.0, 6.8, 8.6].map((radius, i) => {
    const o = new THREE.Group();
    o.rotation.x = Math.PI / 2.5 + i * 0.14;
    o.rotation.z = i * 0.5;
    o.add(ring(radius, i === 0 ? C.accent : C.line, i === 0 ? 0.55 : 0.4));

    const bead = wire(new THREE.OctahedronGeometry(0.42, 0), i === 0 ? C.accent : C.soft, 0.9);
    o.add(bead);

    const spoke = segment(new THREE.Vector3(0, 0, 0), new THREE.Vector3(radius, 0, 0), C.line, 0.2);
    o.add(spoke);

    group.add(o);
    return { o, bead, spoke, radius, speed: 0.42 - i * 0.07, offset: i * 1.4 };
  });

  return {
    group,
    update(dt, t) {
      core.rotation.y += dt * 0.4;
      core.rotation.x -= dt * 0.2;
      core.scale.setScalar(1 + Math.sin(t * 1.8) * 0.05);
      orbits.forEach((orb) => {
        const a = t * orb.speed + orb.offset;
        orb.bead.position.set(Math.cos(a) * orb.radius, 0, Math.sin(a) * orb.radius);
        orb.bead.rotation.y += dt * 1.1;
        orb.spoke.rotation.y = -a;
        orb.o.rotation.z += dt * 0.03;
      });
    },
  };
}

/* ══ 05 · em produção — painéis holográficos ═══════════════════ */
function buildProjects(store: WorldStore): Station {
  const group = new THREE.Group();

  const panels = [-1, 0, 1].map((slot, i) => {
    const p = new THREE.Group();
    p.position.set(slot * 9.6, -0.6, slot === 0 ? 0 : -2.4);
    p.rotation.y = -slot * 0.26;

    const frame = wire(new THREE.BoxGeometry(8.2, 7.6, 0.1), C.line, 0.65);
    p.add(frame);

    const rows: SegmentLine[] = [];
    for (let r = 0; r < 7; r++) {
      const y = 2.7 - r * 0.9;
      const l = segment(new THREE.Vector3(-3.2, y, 0.08), new THREE.Vector3(3.2, y, 0.08), C.line, 0.3);
      l.scale.x = 0.3 + Math.random() * 0.7;
      p.add(l);
      rows.push(l);
    }

    const scan = segment(new THREE.Vector3(-4, 0, 0.12), new THREE.Vector3(4, 0, 0.12), C.accent, 0.55);
    p.add(scan);

    group.add(p);
    return { p, frame, rows, scan, i, seed: i * 2.1 };
  });

  const hot = new THREE.Color(C.accent);
  const base = new THREE.Color(C.line);

  return {
    group,
    update(dt, t) {
      const active = store.focus.projects;
      panels.forEach((pl) => {
        const on = active === pl.i;
        pl.p.position.y = damp(pl.p.position.y, on ? 0.1 : -0.6, 5, dt)
          + Math.sin(t * 0.7 + pl.seed) * 0.004;
        pl.frame.material.color.lerp(on ? hot : base, Math.min(1, dt * 6));
        pl.frame.material.opacity = damp(pl.frame.material.opacity, on ? 1 : 0.55, 6, dt);
        pl.rows.forEach((l, r) => {
          l.material.opacity = damp(l.material.opacity, on ? 0.75 : 0.28, 6, dt);
          l.scale.x = damp(l.scale.x, 0.3 + (Math.sin(t * 0.9 + r + pl.seed) * 0.5 + 0.5) * 0.7, 2, dt);
        });
        pl.scan.position.y = ((t * 1.4 + pl.seed) % 7.4) - 3.7;
        pl.scan.material.opacity = on ? 0.8 : 0.3;
      });
      group.rotation.y = Math.sin(t * 0.09) * 0.06;
    },
  };
}

/* ══ 06 · stack — constelação de competências ══════════════════ */
function buildStack(store: WorldStore): Station {
  const group = new THREE.Group();
  const hub = wire(new THREE.IcosahedronGeometry(1.2, 1), C.line, 0.4);
  group.add(hub);

  const clusters = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * 19, Math.sin(a) * 12, -3 + Math.sin(a * 3) * 4);

    const shell = wire(new THREE.IcosahedronGeometry(2.2, 0), C.line, 0.55);
    shell.position.copy(pos);
    group.add(shell);

    const spoke = segment(new THREE.Vector3(0, 0, 0), pos, C.line, 0.22);
    group.add(spoke);

    const N = 34;
    const cloud = solidCloud(N, 0.12, 0.7, C.soft);
    const seeds = Array.from({ length: N }, () => ({
      r: 2.4 + Math.random() * 2.2,
      a: Math.random() * Math.PI * 2,
      b: Math.random() * Math.PI * 2,
      s: 0.2 + Math.random() * 0.5,
    }));
    cloud.points.position.copy(pos);
    group.add(cloud.points);

    return { i, shell, spoke, cloud, seeds };
  });

  const hot = new THREE.Color(C.accent);
  const base = new THREE.Color(C.line);
  const soft = new THREE.Color(C.soft);

  return {
    group,
    update(dt, t) {
      hub.rotation.y += dt * 0.15;
      const active = store.focus.stack;
      clusters.forEach((cl) => {
        const on = active === cl.i;
        cl.shell.rotation.y += dt * (on ? 0.9 : 0.24);
        cl.shell.rotation.x += dt * 0.12;
        cl.shell.scale.setScalar(damp(cl.shell.scale.x, on ? 1.25 : 1, 6, dt));
        cl.shell.material.color.lerp(on ? hot : base, Math.min(1, dt * 6));
        cl.shell.material.opacity = damp(cl.shell.material.opacity, on ? 1 : 0.5, 6, dt);
        cl.spoke.material.opacity = damp(cl.spoke.material.opacity, on ? 0.6 : 0.2, 6, dt);
        cl.cloud.points.material.color.lerp(on ? hot : soft, Math.min(1, dt * 6));

        cl.seeds.forEach((s, k) => {
          const a = s.a + t * s.s * 0.3;
          const b = s.b + t * s.s * 0.2;
          cl.cloud.positions[k * 3] = Math.cos(a) * Math.sin(b) * s.r;
          cl.cloud.positions[k * 3 + 1] = Math.cos(b) * s.r;
          cl.cloud.positions[k * 3 + 2] = Math.sin(a) * Math.sin(b) * s.r;
        });
        cl.cloud.geometry.attributes.position.needsUpdate = true;
      });
      group.rotation.z += dt * 0.012;
    },
  };
}

/* ══ 07 · command center — núcleo e endpoints ══════════════════ */
function buildCore(store: WorldStore): Station {
  const group = new THREE.Group();
  const ORBIT = 9;

  const shell = wire(new THREE.IcosahedronGeometry(4.6, 1), C.accent, 0.4);
  const inner = wire(new THREE.IcosahedronGeometry(2.8, 0), C.line, 0.7);
  group.add(shell, inner);

  const orbit = ring(ORBIT, C.line, 0.32);
  orbit.rotation.x = Math.PI / 2.6;
  group.add(orbit);

  const sats = [0, 1, 2, 3].map((i) => {
    const s = wire(new THREE.OctahedronGeometry(0.6, 0), C.soft, 0.75);
    orbit.add(s);
    const beam = liveSegment(C.accent, 0);
    orbit.add(beam.line);
    return { s, beam, i, angle: (i / 4) * Math.PI * 2 };
  });

  const hot = new THREE.Color(C.accent);
  const soft = new THREE.Color(C.soft);

  return {
    group,
    update(dt, t) {
      shell.rotation.y += dt * 0.12;
      shell.rotation.x -= dt * 0.05;
      inner.rotation.y -= dt * 0.3;
      shell.scale.setScalar(1 + Math.sin(t * 1.6) * 0.05);

      const active = store.focus.endpoints;
      sats.forEach((sat) => {
        const on = active === sat.i;
        const ang = sat.angle + t * 0.22;
        sat.s.position.set(Math.cos(ang) * ORBIT, 0, Math.sin(ang) * ORBIT);
        sat.s.rotation.y += dt * 1.2;
        sat.s.scale.setScalar(damp(sat.s.scale.x, on ? 1.6 : 1, 7, dt));
        sat.s.material.color.lerp(on ? hot : soft, Math.min(1, dt * 7));

        sat.beam.positions[3] = sat.s.position.x;
        sat.beam.positions[4] = sat.s.position.y;
        sat.beam.positions[5] = sat.s.position.z;
        sat.beam.commit();
        sat.beam.line.material.opacity = damp(sat.beam.line.material.opacity, on ? 0.55 : 0.08, 7, dt);
      });
      orbit.rotation.z += dt * 0.04;
    },
  };
}

/** O mapa do mundo: onde cada estação vive e de onde a câmera a observa. */
export const LAYOUT: readonly StationDef[] = [
  { id: "hero", anchor: "st-hero", pos: [0, 0, 0], cam: [0, 2.4, 20.5], bias: 0.06, build: buildHero },
  { id: "etl", anchor: "st-etl", pos: [0, -32, 2], cam: [-2.4, 2.6, 20.5], bias: 0.44, build: buildEtl },
  { id: "cloud", anchor: "st-cloud", pos: [26, -66, -6], cam: [12, 10, 14], bias: -0.38, build: buildCloud },
  { id: "delivery", anchor: "st-delivery", pos: [6, -100, 4], cam: [-5, 3, 26], bias: 0, lift: 0.53, build: buildDelivery },
  { id: "timeline", anchor: "st-timeline", pos: [-24, -134, -4], cam: [3, 7, 21], bias: -0.34, build: buildTimeline },
  { id: "projects", anchor: "st-projects", pos: [0, -168, 6], cam: [0, 0.5, 24], bias: 0, build: buildProjects },
  { id: "stack", anchor: "st-stack", pos: [20, -202, -4], cam: [-3, 4, 30], bias: 0, build: buildStack },
  { id: "core", anchor: "st-core", pos: [0, -236, 0], cam: [0, 4, 32], bias: -0.51, build: buildCore },
];
