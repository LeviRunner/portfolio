"use client";

import { useCallback, useEffect, useState } from "react";
import { Rail } from "./rail";
import { Reticle } from "./reticle";
import { SiteHeader } from "./site-header";
import { useWorld } from "./use-world";
import { Hero } from "./sections/hero";
import { DataEtl } from "./sections/data-etl";
import { Cloud } from "./sections/cloud";
import { Delivery } from "./sections/delivery";
import { TrackRecord } from "./sections/track-record";
import { Shipped } from "./sections/shipped";
import { Stack } from "./sections/stack";
import { CommandCenter } from "./sections/command-center";

type Lang = "pt" | "en";

/**
 * A jornada inteira: um canvas fixo com o mundo 3D e, por cima, as oito seções
 * que a câmera visita conforme a página rola.
 */
export function WorldPortfolio() {
  const world = useWorld();
  const [lang, setLang] = useState<Lang>("pt");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.lang = lang;
    root.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((current) => (current === "pt" ? "en" : "pt"));
  }, []);

  const shipped = world.nodeStates["deploy:prod"] === "pass";

  return (
    <>
      <canvas ref={world.canvasRef} className="world-canvas" aria-hidden />
      <Reticle />
      <Rail station={world.station} />
      <SiteHeader onToggleLang={toggleLang} />

      <main className="stage" id="top">
        <Hero
          statusColor={world.running ? "var(--amber)" : "var(--accent)"}
          statusText={world.running ? "running" : shipped ? "passing" : "idle"}
          onFireCommit={world.fireCommit}
          onRun={world.runPipeline}
        />
        <DataEtl focus={world.focus} />
        <Cloud replicas={world.replicas} onReplicas={world.setReplicas} />
        <Delivery
          nodeStates={world.nodeStates}
          log={world.log}
          onRun={world.runPipeline}
          onReset={world.resetPipeline}
        />
        <TrackRecord />
        <Shipped focus={world.focus} />
        <Stack focus={world.focus} />
        <CommandCenter focus={world.focus} />
      </main>
    </>
  );
}
