import { T } from "./t";

/** Espelha a ordem de LAYOUT em src/lib/world/stations.ts. */
const STOPS = [
  { href: "#top", pt: "hero", en: "hero" },
  { href: "#dados", pt: "01 dados", en: "01 data" },
  { href: "#cloud", pt: "02 cloud", en: "02 cloud" },
  { href: "#entrega", pt: "03 ci/cd", en: "03 ci/cd" },
  { href: "#trajetoria", pt: "04 trajetória", en: "04 track record" },
  { href: "#projetos", pt: "05 produção", en: "05 shipped" },
  { href: "#stack", pt: "06 stack", en: "06 stack" },
  { href: "#contato", pt: "07 contato", en: "07 contact" },
];

/** Trilho da jornada: mostra em que estação a câmera está e leva a qualquer uma. */
export function Rail({ station }: { station: number }) {
  return (
    <nav className="rail" aria-label="Estações">
      {STOPS.map((stop, i) => (
        <a key={stop.href} href={stop.href} data-on={i === station}>
          <i aria-hidden />
          <b>
            <T pt={stop.pt} en={stop.en} />
          </b>
        </a>
      ))}
    </nav>
  );
}
