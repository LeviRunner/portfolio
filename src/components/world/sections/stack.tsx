import type { ReactNode } from "react";
import type { FocusKey } from "@/lib/world/stations";
import { T } from "../t";

interface Group {
  title: { pt: string; en: string };
  skills: ReactNode[];
}

const GROUPS: Group[] = [
  {
    title: { pt: "DADOS & BI", en: "DATA & BI" },
    skills: [
      <T key="sql" pt="SQL avançado" en="Advanced SQL" />,
      <T key="dim" pt="Modelagem dimensional" en="Dimensional modelling" />,
      "Star schema", "ETL", "Power BI", "DAX", "Tableau", "Google Data Studio",
      <T key="eda" pt="Análise exploratória" en="Exploratory analysis" />,
      "KPIs",
    ],
  },
  {
    title: { pt: "ENGENHARIA EM PYTHON", en: "PYTHON ENGINEERING" },
    skills: [
      "Python", "R", "Polars", "pandas", "DuckDB", "pandera", "APScheduler",
      "Parquet", "Spark", "Hadoop", "Hive",
      <T key="dq" pt="Qualidade de dados" en="Data quality" />,
    ],
  },
  {
    title: { pt: "BANCOS DE DADOS", en: "DATABASES" },
    skills: [
      "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
      <T key="tuning" pt="Tuning de consultas" en="Query tuning" />,
      <T key="idx" pt="Indexação" en="Indexing" />,
      <T key="bkp" pt="Backup & restauração" en="Backup & restore" />,
    ],
  },
  {
    title: { pt: "CLOUD & DEVOPS", en: "CLOUD & DEVOPS" },
    skills: [
      "Azure", "AWS", "GCP", "Cloudflare", "Terraform", "Linux", "Nginx",
      "Docker", "Kubernetes", "GitHub Actions", "Ansible", "Git", "Prometheus", "Grafana",
    ],
  },
  {
    title: { pt: "APLICAÇÕES", en: "APPLICATIONS" },
    skills: [
      "FastAPI", "Streamlit", "SQLAlchemy", "TypeScript", "JavaScript",
      "Node.js", "React", "PHP",
      <T key="ia" pt="IA Generativa" en="Generative AI" />,
    ],
  },
];

interface Props {
  focus: (key: FocusKey, index: number) => void;
}

export function Stack({ focus }: Props) {
  return (
    <section id="stack" className="station">
      <div id="st-stack" className="shell">
        <div className="plate-wide">
          <div className="eyebrow">
            <span className="num">06</span>
            <span className="label">STACK</span>
            <span className="rule" />
          </div>

          <div className="stack-grid" onMouseLeave={() => focus("stack", -1)}>
            {GROUPS.map((group, i) => (
              <div
                key={group.title.en}
                className="stack-group"
                onMouseEnter={() => focus("stack", i)}
              >
                <h3>
                  <T pt={group.title.pt} en={group.title.en} />
                </h3>
                <div className="chip-row">
                  {group.skills.map((skill, k) => (
                    <span className="chip" key={k}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
