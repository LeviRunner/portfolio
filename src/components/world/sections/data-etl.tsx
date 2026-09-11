import type { FocusKey } from "@/lib/world/stations";
import { T } from "../t";

const STAGES = [
  { pt: "origem", en: "source", detail: ["API · SQL", "CSV · JSON"] },
  { pt: "etl", en: "etl", detail: ["Python · Polars", "pandera"] },
  { pt: "warehouse", en: "warehouse", detail: ["DuckDB · Parquet", "PostgreSQL"] },
  { pt: "painel", en: "dashboard", detail: ["Power BI · DAX", "star schema"] },
];

interface Props {
  focus: (key: FocusKey, index: number) => void;
}

export function DataEtl({ focus }: Props) {
  return (
    <section id="dados" className="station">
      <div id="st-etl" className="shell">
        <div className="half plate">
          <div className="eyebrow">
            <span className="num">01</span>
            <span className="label">
              <T pt="DADOS & ETL" en="DATA & ETL" />
            </span>
            <span className="rule" />
          </div>

          <h2 className="section-title">
            <T
              pt="Do dado bruto ao painel confiável"
              en="From raw data to a dashboard you can trust"
            />
          </h2>

          <p className="lede">
            <T
              pt={
                <>
                  Múltiplas origens convergem para um bloco de transformação e saem tipadas,
                  validadas e modeladas. Modelagem dimensional em{" "}
                  <em style={{ color: "var(--ink-2)", fontStyle: "normal" }}>star schema</em>, fluxos
                  de ETL desenhados para integridade, SQL avançado e DAX. Python automatiza coleta e
                  tratamento, e a consolidação manual deixa de existir.
                </>
              }
              en={
                <>
                  Several sources converge into one transformation block and come out typed,
                  validated and modelled. Dimensional{" "}
                  <em style={{ color: "var(--ink-2)", fontStyle: "normal" }}>star schema</em>{" "}
                  modelling, ETL flows designed around integrity, advanced SQL and DAX. Python
                  automates collection and cleaning, so manual consolidation stops existing.
                </>
              }
            />
          </p>

          <p className="lede">
            <T
              pt={
                <>
                  No{" "}
                  <a href="https://github.com/LeviRunner/DataLens" target="_blank" rel="noopener noreferrer">
                    DataLens
                  </a>{" "}
                  essa esteira virou produto: reestruturei a arquitetura para DuckDB + Polars +
                  pandera + APScheduler sobre Parquet, saindo de um fluxo em pandas que estourava a
                  memória no Streamlit.
                </>
              }
              en={
                <>
                  In{" "}
                  <a href="https://github.com/LeviRunner/DataLens" target="_blank" rel="noopener noreferrer">
                    DataLens
                  </a>{" "}
                  this pipeline became a product: I rebuilt the architecture on DuckDB + Polars +
                  pandera + APScheduler over Parquet, replacing a pandas flow that blew up memory
                  inside Streamlit.
                </>
              }
            />
          </p>

          <div className="stage-grid" onMouseLeave={() => focus("etl", -1)}>
            {STAGES.map((stage, i) => (
              <div key={stage.en} className="stage-card" onMouseEnter={() => focus("etl", i)}>
                <b>
                  <T pt={stage.pt} en={stage.en} />
                </b>
                <small>
                  {stage.detail[0]}
                  <br />
                  {stage.detail[1]}
                </small>
              </div>
            ))}
          </div>

          <div className="fig">FIG.01 · INGESTÃO → TRANSFORMAÇÃO → CARGA</div>
        </div>
      </div>
    </section>
  );
}
