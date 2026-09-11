import type { ReactNode } from "react";
import { T } from "../t";

interface Role {
  when: string;
  title: { pt: string; en: string };
  at: string;
  href?: string;
  tags: ReactNode[];
  bullets: { pt: string; en: string }[];
}

const ROLES: Role[] = [
  {
    when: "MAI 2025 → JUN 2026",
    title: { pt: "Analista de Dados", en: "Data Analyst" },
    at: "Los Trigales",
    href: "https://www.lostrigales.com.py",
    tags: ["SQL", "Power BI", "ETL", <T key="log" pt="Logística" en="Logistics" />],
    bullets: [
      {
        pt: "Modelagem dimensional em star schema e painéis em Power BI com DAX para KPIs operacionais.",
        en: "Star-schema dimensional modelling and Power BI dashboards with DAX for operational KPIs.",
      },
      {
        pt: "Desenho de fluxos de ETL para garantir a integridade das informações logísticas.",
        en: "ETL flow design to guarantee the integrity of logistics data.",
      },
      {
        pt: "Automação em Python de coleta e tratamento, eliminando consolidações manuais recorrentes.",
        en: "Python automation of collection and cleaning, removing recurring manual consolidation.",
      },
      {
        pt: "Planejamento analítico de rotas e controle de inventário de ativos ponta a ponta.",
        en: "Analytical route planning and end-to-end asset inventory control.",
      },
    ],
  },
  {
    when: "JAN 2021 → DEZ 2024",
    title: { pt: "Assistente de Banco de Dados", en: "Database Assistant" },
    at: "BunkerGames",
    href: "https://www.bunkergames.com.br",
    tags: ["PostgreSQL", "DevOps", "24/7", "Grafana"],
    bullets: [
      {
        pt: "Tuning de consultas e estratégia de indexação em PostgreSQL e MySQL, reduzindo tempo de resposta em operações críticas.",
        en: "Query tuning and indexing strategy on PostgreSQL and MySQL, cutting response time on critical operations.",
      },
      {
        pt: "Alta disponibilidade da plataforma em regime crítico 24/7, com identificação de gargalos e mitigação de falhas.",
        en: "24/7 high availability of the platform, identifying bottlenecks and mitigating query failures.",
      },
      {
        pt: "Rotinas de backup e restauração validadas periodicamente, assegurando recuperabilidade da base.",
        en: "Backup and restore routines validated periodically, ensuring the database stayed recoverable.",
      },
      {
        pt: "Observabilidade da infraestrutura com Prometheus e Grafana em ambiente Linux.",
        en: "Infrastructure observability with Prometheus and Grafana on Linux.",
      },
    ],
  },
  {
    when: "ABR 2018 → DEZ 2020",
    title: { pt: "Assistente Financeiro", en: "Finance Assistant" },
    at: "Cap Vida",
    tags: [],
    bullets: [
      {
        pt: "Auditoria de fluxos de caixa e conciliação bancária, a origem da minha leitura de regra de negócio.",
        en: "Cash-flow auditing and bank reconciliation, where my reading of business rules comes from.",
      },
      {
        pt: "Relatórios operacionais para suporte à tomada de decisão gerencial.",
        en: "Operational reporting to support management decisions.",
      },
    ],
  },
];

const STUDIES = [
  {
    when: "2023 → 2027",
    what: { pt: "Bacharelado em Ciência da Computação", en: "BSc in Computer Science" },
    where: "Estácio",
  },
  {
    when: "JUL 2026 → NOV 2026",
    what: {
      pt: "Formação em Dados & Inteligência Artificial",
      en: "Professional program in Data & AI",
    },
    where: "DIO",
  },
];

export function TrackRecord() {
  return (
    <section id="trajetoria" className="station">
      <div id="st-timeline" className="shell">
        <div className="plate-wide half-wide half-right">
          <div className="eyebrow">
            <span className="num">04</span>
            <span className="label">
              <T pt="TRAJETÓRIA" en="TRACK RECORD" />
            </span>
            <span className="rule" />
          </div>

          {ROLES.map((role) => (
            <article className="role" key={role.at}>
              <div>
                <div className="role-when">{role.when}</div>
                <h3>
                  <T pt={role.title.pt} en={role.title.en} />
                </h3>
                {role.href ? (
                  <a className="role-at" href={role.href} target="_blank" rel="noopener noreferrer">
                    {role.at} ↗
                  </a>
                ) : (
                  <span className="role-at">{role.at}</span>
                )}
                {role.tags.length > 0 && (
                  <div className="tag-row">
                    {role.tags.map((tag, i) => (
                      <span className="tag" key={i}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ul className="bullets">
                {role.bullets.map((b) => (
                  <li key={b.en}>
                    <T pt={b.pt} en={b.en} />
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <div className="study-grid">
            {STUDIES.map((s) => (
              <div className="study" key={s.where}>
                <div className="study-when">{s.when}</div>
                <div className="study-what">
                  <T pt={s.what.pt} en={s.what.en} />
                </div>
                <div className="study-where">{s.where}</div>
              </div>
            ))}
            <div className="study">
              <div className="study-when">
                <T pt="IDIOMAS" en="LANGUAGES" />
              </div>
              <div className="study-what" style={{ color: "var(--ink-2)" }}>
                <T
                  pt="Português nativo · Espanhol fluente · Inglês avançado"
                  en="Native Portuguese · Fluent Spanish · Advanced English"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
