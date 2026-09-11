import { T } from "./t";

const LINKS = [
  { href: "#dados", pt: "01 · dados", en: "01 · data" },
  { href: "#cloud", pt: "02 · cloud", en: "02 · cloud" },
  { href: "#entrega", pt: "03 · ci/cd", en: "03 · ci/cd" },
  { href: "#trajetoria", pt: "04 · trajetória", en: "04 · track record" },
  { href: "#projetos", pt: "05 · produção", en: "05 · shipped" },
  { href: "#stack", pt: "06 · stack", en: "06 · stack" },
];

export function SiteHeader({ onToggleLang }: { onToggleLang: () => void }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#top" className="wordmark">
          matheus<span>.data</span>
        </a>
        <nav className="site-nav" aria-label="Seções">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              <T pt={link.pt} en={link.en} />
            </a>
          ))}
        </nav>
        <button type="button" className="lang-toggle" onClick={onToggleLang}>
          <T pt="EN" en="PT" />
        </button>
      </div>
    </header>
  );
}
