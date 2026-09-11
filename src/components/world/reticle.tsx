"use client";

import { useEffect, useRef } from "react";

/** O que a mira considera alvo. A área de clique do hero é grande demais e fica de fora. */
const TARGET_SELECTOR = 'a[href], button, input, [role="button"]';
const IDLE_SIZE = 26;
const LOCK_PADDING = 8;
/** Quanto a cruz é puxada para o centro do alvo. Magnetismo demais tira a noção de onde o ponteiro está. */
const MAGNETISM = 0.35;
const CROSS_LAMBDA = 26;
const BOX_LAMBDA = 18;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Guardado em coordenadas de documento para não pedir layout a cada quadro. */
interface Lock {
  docX: number;
  docY: number;
  w: number;
  h: number;
}

const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export function Reticle() {
  const rootRef = useRef<HTMLDivElement>(null);
  const crossRef = useRef<HTMLSpanElement>(null);
  const cornerRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;

    const root = rootRef.current;
    const cross = crossRef.current;
    const corners = cornerRefs.current.filter(Boolean) as HTMLElement[];
    if (!root || !cross || corners.length !== 4) return;

    document.documentElement.dataset.reticle = "on";

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cursor = { x: pointer.x, y: pointer.y };
    const box: Box = { x: cursor.x - IDLE_SIZE / 2, y: cursor.y - IDLE_SIZE / 2, w: IDLE_SIZE, h: IDLE_SIZE };
    let lock: Lock | null = null;
    let visible = 0;
    let raf = 0;
    let last = 0;

    const capture = (el: Element): Lock => {
      const r = el.getBoundingClientRect();
      return {
        docX: r.left + window.scrollX - LOCK_PADDING,
        docY: r.top + window.scrollY - LOCK_PADDING,
        w: r.width + LOCK_PADDING * 2,
        h: r.height + LOCK_PADDING * 2,
      };
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      visible = 1;
      const el = (e.target as Element | null)?.closest?.(TARGET_SELECTOR);
      lock = el && !el.hasAttribute("data-no-target") ? capture(el) : null;
    };
    const onLeave = () => { visible = 0; };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;

      let wantX = pointer.x;
      let wantY = pointer.y;
      let boxX: number;
      let boxY: number;
      let boxW: number;
      let boxH: number;

      if (lock) {
        boxX = lock.docX - window.scrollX;
        boxY = lock.docY - window.scrollY;
        boxW = lock.w;
        boxH = lock.h;
        wantX += (boxX + boxW / 2 - pointer.x) * MAGNETISM;
        wantY += (boxY + boxH / 2 - pointer.y) * MAGNETISM;
      } else {
        boxW = IDLE_SIZE;
        boxH = IDLE_SIZE;
        boxX = wantX - IDLE_SIZE / 2;
        boxY = wantY - IDLE_SIZE / 2;
      }

      cursor.x = damp(cursor.x, wantX, CROSS_LAMBDA, dt);
      cursor.y = damp(cursor.y, wantY, CROSS_LAMBDA, dt);
      box.x = damp(box.x, boxX, BOX_LAMBDA, dt);
      box.y = damp(box.y, boxY, BOX_LAMBDA, dt);
      box.w = damp(box.w, boxW, BOX_LAMBDA, dt);
      box.h = damp(box.h, boxH, BOX_LAMBDA, dt);

      cross.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
      corners[0].style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
      corners[1].style.transform = `translate3d(${box.x + box.w}px, ${box.y}px, 0)`;
      corners[2].style.transform = `translate3d(${box.x}px, ${box.y + box.h}px, 0)`;
      corners[3].style.transform = `translate3d(${box.x + box.w}px, ${box.y + box.h}px, 0)`;

      root.dataset.locked = lock ? "true" : "false";
      root.style.opacity = String(visible);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      delete document.documentElement.dataset.reticle;
    };
  }, []);

  return (
    <div className="reticle" ref={rootRef} data-locked="false" aria-hidden>
      <span className="reticle-cross" ref={crossRef} />
      {[0, 1, 2, 3].map((i) => (
        <i
          key={i}
          className={`reticle-corner c${i}`}
          ref={(el) => { cornerRefs.current[i] = el; }}
        />
      ))}
    </div>
  );
}
