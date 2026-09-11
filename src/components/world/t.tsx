import type { ReactNode } from "react";

interface TProps {
  pt: ReactNode;
  en: ReactNode;
}

/**
 * Texto bilíngue. Os dois idiomas vão para o HTML e o CSS decide qual aparece
 * (ver `[data-t]` em globals.css) — sem re-render e sem dicionário em JS.
 */
export function T({ pt, en }: TProps) {
  return (
    <>
      <span data-t="pt">{pt}</span>
      <span data-t="en">{en}</span>
    </>
  );
}
