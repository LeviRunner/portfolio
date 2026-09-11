import type { FocusKey } from "@/lib/world/stations";
import { T } from "../t";

const PROJECTS = [
  {
    name: "DevRank",
    href: "https://devrank.com.br/",
    tags: ["Python", "Cloudflare", "Next.js"],
    pt: "Plataforma educacional gamificada em produção sobre o ecossistema Cloudflare. Infraestrutura completa — domínio, DNS, Workers, e-mail transacional com SPF/DKIM — e backend em Python com métricas analíticas e correção automatizada de código em tempo real.",
    en: "Gamified learning platform running in production on the Cloudflare ecosystem. Full infrastructure — domain, DNS, Workers, transactional email with SPF/DKIM — plus a Python backend with analytics and real-time automated code grading.",
  },
  {
    name: "DataLens",
    href: "https://github.com/LeviRunner/DataLens",
    tags: ["DuckDB", "Polars", "Power BI"],
    pt: "Análise de dados configurável, open source: gera o perfil automático de qualquer fonte (CSV, Excel, SQL, JSON, API) sem escrever código. Arquitetura reestruturada para DuckDB + Polars + pandera + APScheduler sobre Parquet, com integração direta ao Power BI.",
    en: "Configurable open-source data analysis: auto-profiles any source (CSV, Excel, SQL, JSON, API) with no code. Architecture rebuilt on DuckDB + Polars + pandera + APScheduler over Parquet, with direct Power BI integration.",
  },
  {
    name: "TechStore",
    href: "https://github.com/LeviRunner",
    tags: ["Next.js", "Azure", "PostgreSQL"],
    pt: "Loja fictícia usada como vitrine técnica: catálogo, carrinho, checkout e área administrativa. Deploy em produção na Azure (App Service + PostgreSQL gerenciado) com pipeline de entrega contínua.",
    en: "A fictional store used as a technical showcase: catalogue, cart, checkout and admin area. Deployed to production on Azure (App Service + managed PostgreSQL) with a continuous delivery pipeline.",
  },
];

interface Props {
  focus: (key: FocusKey, index: number) => void;
}

export function Shipped({ focus }: Props) {
  return (
    <section id="projetos" className="station">
      <div id="st-projects" className="shell">
        <div className="eyebrow">
          <span className="num">05</span>
          <span className="label">
            <T pt="EM PRODUÇÃO" en="SHIPPED" />
          </span>
          <span className="rule" />
        </div>

        <div className="project-grid" onMouseLeave={() => focus("projects", -1)}>
          {PROJECTS.map((project, i) => (
            <a
              key={project.name}
              className="project"
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => focus("projects", i)}
            >
              <div className="project-head">
                <h3>{project.name}</h3>
                <span className="arrow">↗</span>
              </div>
              <p>
                <T pt={project.pt} en={project.en} />
              </p>
              <div className="tag-row">
                {project.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
