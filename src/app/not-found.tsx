import Link from "next/link";

export default function NotFound() {
  return (
    <main className="station">
      <div className="shell">
        <div className="half plate">
          <div className="eyebrow">
            <span className="num">404</span>
            <span className="label">NOT FOUND</span>
            <span className="rule" />
          </div>
          <h1 className="section-title">Essa rota não existe</h1>
          <p className="lede">
            O endereço que você abriu não corresponde a nenhuma seção do portfólio.
          </p>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/">
              ← voltar para a home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
