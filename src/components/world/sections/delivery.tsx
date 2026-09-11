"use client";

import { useEffect, useRef } from "react";
import { NODE_IDS, STATE_HEX, type NodeState } from "@/lib/world/pipeline";
import type { LogLine } from "../use-world";
import { T } from "../t";

interface Props {
  nodeStates: Record<string, NodeState>;
  log: LogLine[];
  onRun: () => void;
  onReset: () => void;
}

export function Delivery({ nodeStates, log, onRun, onReset }: Props) {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <section id="entrega" className="station">
      <div id="st-delivery" className="shell" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="viz-band" aria-hidden />

        <div className="eyebrow">
          <span className="num">03</span>
          <span className="label">
            <T pt="ENTREGA CONTÍNUA" en="CONTINUOUS DELIVERY" />
          </span>
          <span className="rule" />
        </div>

        <div className="split">
          <div className="plate-wide">
            <h2 className="section-title">
              <T
                pt="Todo commit percorre o mesmo caminho"
                en="Every commit takes the same path"
              />
            </h2>

            <p className="lede">
              <T
                pt="GitHub Actions do commit ao deploy: build, testes unitários e de integração em paralelo, análise estática, staging e produção. Quando um teste falha, o retry entra e a esteira segura a entrega antes que o erro chegue ao usuário. É o mesmo grafo animado no topo da página."
                en="GitHub Actions from commit to deploy: build, unit and integration tests in parallel, static analysis, staging and production. When a test fails, retry kicks in and the pipeline holds the release before the bug reaches a user. It is the same graph animating at the top of the page."
              />
            </p>

            <div className="pill-row">
              {NODE_IDS.map((id) => (
                <span key={id} className="pill">
                  <span className="dot" style={{ background: STATE_HEX[nodeStates[id] ?? "idle"] }} />
                  {id}
                </span>
              ))}
            </div>

            <div className="btn-row" style={{ marginTop: 26 }}>
              <button type="button" className="btn btn-primary" onClick={onRun}>
                <T pt="Executar pipeline" en="Run pipeline" />
              </button>
              <button type="button" className="btn" onClick={onReset}>
                <T pt="Limpar" en="Clear" />
              </button>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <i />
              <i />
              <i />
              <span style={{ marginLeft: 6 }}>actions · deploy.yml</span>
            </div>
            <div className="terminal-body" ref={logRef}>
              <div className="prompt">$ gh workflow run deploy.yml --ref main</div>
              {log.map((line, i) => (
                <div className="log-line" key={`${line.id}-${line.time}-${i}`}>
                  <span className="at">{line.time}</span>
                  <span className="who">{line.id}</span>
                  <span style={{ color: line.color }}>{line.text}</span>
                </div>
              ))}
              <div className="cursor">_</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
