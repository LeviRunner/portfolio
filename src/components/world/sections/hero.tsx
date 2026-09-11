import { T } from "../t";

interface HeroProps {
  statusColor: string;
  statusText: string;
  onFireCommit: () => void;
  onRun: () => void;
}

export function Hero({ statusColor, statusText, onFireCommit, onRun }: HeroProps) {
  return (
    <section id="st-hero" className="station hero">
      <button
        type="button"
        className="hero-hit"
        onClick={onFireCommit}
        aria-label="Disparar um commit"
      />
      <div className="hero-scrim" />
      <div className="hero-fade" />

      <div className="shell hero-shell">
        <div className="status-badge">
          <span className="dot" style={{ background: statusColor }} />
          <span>deploy.yml · {statusText}</span>
        </div>

        <h1>Matheus Santos Moises</h1>

        <p className="hero-kicker">
          <T
            pt="dados & analytics · business intelligence · cloud & devops"
            en="data & analytics · business intelligence · cloud & devops"
          />
        </p>

        <p className="hero-lede">
          <T
            pt="Cinco anos em produção levando o dado da origem até um painel em que o gestor confia — e sustentando o ambiente que roda por trás dele. São Paulo, Brasil."
            en="Five years in production taking data from source to a dashboard leadership actually trusts — and keeping alive the infrastructure running behind it. São Paulo, Brazil."
          />
        </p>

        <div className="btn-row" style={{ marginTop: 36 }}>
          <button type="button" className="btn btn-primary" onClick={onRun}>
            git push origin main
          </button>
          <a className="btn" href="https://github.com/LeviRunner" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a
            className="btn"
            href="https://www.linkedin.com/in/matheus-santos-moises/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a className="btn" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
            <T pt="Currículo" en="Résumé" />
          </a>
        </div>

        <div className="legend">
          <span>
            <span className="dot" style={{ background: "var(--accent)" }} />
            SUCCESS
          </span>
          <span>
            <span className="dot" style={{ background: "var(--amber)" }} />
            RUNNING / RETRY
          </span>
          <span>
            <span className="dot" style={{ background: "var(--red)" }} />
            FAILED
          </span>
          <span className="hint">
            <T
              pt="CLIQUE NA CENA PARA DISPARAR UM COMMIT"
              en="CLICK THE SCENE TO FIRE A COMMIT"
            />
          </span>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden>
        ↓
      </div>
    </section>
  );
}
