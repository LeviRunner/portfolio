"use client";

import { useEffect, useState } from "react";
import type { FocusKey } from "@/lib/world/stations";
import { T } from "../t";

const ENDPOINTS = [
  { verb: "GET", path: "/github", value: "github.com/LeviRunner", href: "https://github.com/LeviRunner" },
  {
    verb: "GET",
    path: "/linkedin",
    value: "in/matheus-santos-moises",
    href: "https://www.linkedin.com/in/matheus-santos-moises/",
  },
  {
    verb: "POST",
    path: "/email",
    value: "matheus.santos.m2099@outlook.com",
    href: "mailto:matheus.santos.m2099@outlook.com",
  },
  { verb: "GET", path: "/resume.pdf", value: "matheusdata.dev/resume.pdf", href: "/resume.pdf" },
];

/** Relógio de São Paulo. Começa vazio para o HTML do servidor bater com o do cliente. */
function useSaoPauloTime(): string {
  const [now, setNow] = useState("");

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());

    setNow(format());
    const id = setInterval(() => setNow(format()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

interface Props {
  focus: (key: FocusKey, index: number) => void;
}

export function CommandCenter({ focus }: Props) {
  const now = useSaoPauloTime();

  return (
    <footer id="contato" className="station">
      <div id="st-core" className="shell" style={{ paddingBottom: 56 }}>
        <div className="half-wide half-right">
          <div className="eyebrow">
            <span className="num">07</span>
            <span className="label">COMMAND CENTER</span>
            <span className="rule" />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div className="plate-wide">
              <h2 className="section-title">
                <T pt="Aberto a novas oportunidades" en="Open to new opportunities" />
              </h2>
              <p className="contact-lede">
                <T
                  pt="Se o seu problema envolve dado que não fecha, painel em que ninguém confia ou banco que cai de madrugada — é exatamente o que eu faço."
                  en="If your problem is data that never reconciles, a dashboard nobody trusts, or a database that falls over at night — that is exactly what I do."
                />
              </p>
              <div className="availability">
                <span>
                  <span className="dot" style={{ background: "var(--accent)" }} />
                  <T pt="disponível" en="available" />
                </span>
                <span>São Paulo · UTC−3</span>
                <span className="now">{now}</span>
              </div>
            </div>

            <div className="endpoints">
              <div className="endpoints-head">endpoints</div>
              <div onMouseLeave={() => focus("endpoints", -1)}>
                {ENDPOINTS.map((endpoint, i) => (
                  <a
                    key={endpoint.path}
                    className="endpoint"
                    href={endpoint.href}
                    {...(endpoint.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    onMouseEnter={() => focus("endpoints", i)}
                  >
                    <span className={endpoint.verb === "POST" ? "verb verb-post" : "verb"}>
                      {endpoint.verb}
                    </span>
                    <span className="path">{endpoint.path}</span>
                    <span className="value">{endpoint.value}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="colophon">
          <span>© 2026 Matheus Santos Moises</span>
          <span>
            three.js · WebGL ·{" "}
            <T pt="8 estações, um mundo só" en="8 stations, one single world" />
          </span>
        </div>
      </div>
    </footer>
  );
}
