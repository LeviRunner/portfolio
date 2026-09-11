import { T } from "../t";

const REQUESTS_PER_REPLICA = 320;

interface Props {
  replicas: number;
  onReplicas: (n: number) => void;
}

export function Cloud({ replicas, onReplicas }: Props) {
  const rps = (replicas * REQUESTS_PER_REPLICA).toLocaleString("pt-BR");

  return (
    <section id="cloud" className="station">
      <div id="st-cloud" className="shell">
        <div className="half half-right plate">
          <div className="eyebrow">
            <span className="num">02</span>
            <span className="label">
              <T pt="INFRAESTRUTURA CLOUD" en="CLOUD INFRASTRUCTURE" />
            </span>
            <span className="rule" />
          </div>

          <h2 className="section-title">
            <T pt="Infra que escala sem drama" en="Infrastructure that scales without drama" />
          </h2>

          <p className="lede">
            <T
              pt="Contêineres sobem e descem conforme a carga, o balanceador reparte o tráfego e nenhuma requisição fica órfã. Docker e Kubernetes sobre Linux, provisionamento com Terraform e Ansible, Nginx na borda, Azure · AWS · GCP · Cloudflare."
              en="Containers scale up and down with load, the balancer spreads traffic and no request is orphaned. Docker and Kubernetes on Linux, provisioning with Terraform and Ansible, Nginx at the edge, Azure · AWS · GCP · Cloudflare."
            />
          </p>

          <p className="lede">
            <T
              pt={
                <>
                  O{" "}
                  <a href="https://devrank.com.br/" target="_blank" rel="noopener noreferrer">
                    DevRank
                  </a>{" "}
                  roda inteiro no ecossistema Cloudflare: domínio, DNS, Workers e e-mail
                  transacional com SPF/DKIM, tudo sob minha responsabilidade.
                </>
              }
              en={
                <>
                  <a href="https://devrank.com.br/" target="_blank" rel="noopener noreferrer">
                    DevRank
                  </a>{" "}
                  runs entirely on the Cloudflare ecosystem: domain, DNS, Workers and transactional
                  email with SPF/DKIM, all under my ownership.
                </>
              }
            />
          </p>

          <div className="scaler">
            <div className="scaler-head">
              <span>
                <T pt="RÉPLICAS DESEJADAS" en="DESIRED REPLICAS" />
              </span>
              <output>{replicas}</output>
            </div>
            <input
              type="range"
              min={3}
              max={144}
              step={1}
              value={replicas}
              onChange={(e) => onReplicas(Number(e.target.value))}
              aria-label="Réplicas desejadas"
            />
            <div className="scaler-foot">
              <span>kubectl scale --replicas={replicas}</span>
              <span>≈ {rps} req/s</span>
            </div>
          </div>

          <div className="fig">FIG.02 · CLUSTER · LB · AUTOSCALING</div>
        </div>
      </div>
    </section>
  );
}
