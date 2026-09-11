# matheus.data

Portfólio pessoal de Matheus Santos Moises — uma jornada contínua em WebGL onde o
scroll da página conduz a câmera por uma infraestrutura 3D viva.
Next.js 16 + three.js, publicado em [matheusdata.dev](https://matheusdata.dev)
via Cloudflare Workers (OpenNext).

## A ideia

Não há cenas 3D separadas trocando de lugar. Existe **um único canvas fixo**
(`.world-canvas`, atrás de todo o conteúdo) e **um mundo 3D só**, com oito estações
posicionadas em coordenadas reais. Rolar a página desliza a câmera por uma
`CatmullRomCurve3` que atravessa esse mundo — o visitante viaja pela infraestrutura
em vez de assistir a slides.

| # | Seção | Estação no mundo |
| --- | --- | --- |
| — | Hero | grafo de CI/CD vivo |
| 01 | Dados & ETL | fontes → ETL → warehouse → painel |
| 02 | Cloud | cluster isométrico, load balancer e autoscaling |
| 03 | Entrega contínua | o mesmo grafo, de perfil, no portal de release |
| 04 | Trajetória | anéis orbitais por período |
| 05 | Em produção | painéis holográficos atrás dos cartões |
| 06 | Stack | constelação de cinco aglomerados |
| 07 | Command center | núcleo com os endpoints em órbita |

Uma **espinha de dados** liga as estações na ordem do trajeto e 1100 pontos de poeira
dão paralaxe entre elas. O `FogExp2` faz a estação seguinte aparecer no horizonte
antes de você chegar nela.

## Estrutura

```
src/
├── app/
│   ├── layout.tsx        # fontes, metadata, <html lang>
│   ├── page.tsx          # renderiza o portfólio
│   ├── globals.css       # tokens de cor/tipo e o interruptor bilíngue
│   └── world.css         # os componentes visuais da página
├── components/world/
│   ├── portfolio.tsx     # amarra o mundo 3D às oito seções
│   ├── use-world.ts      # ciclo de vida do engine e do pipeline
│   ├── t.tsx             # texto bilíngue
│   ├── rail.tsx          # trilho que marca a estação atual
│   ├── site-header.tsx
│   └── sections/         # uma seção por arquivo
└── lib/world/
    ├── engine.ts         # renderer, câmera em spline, scroll, loop
    ├── stations.ts       # os oito builders 3D e o mapa do mundo (LAYOUT)
    ├── pipeline.ts       # CICD_NODES / CICD_RUN — a fonte da verdade
    └── palette.ts        # cores e helpers de geometria
```

### Como a câmera segue o scroll

`measure()` lê o centro de cada seção (`#st-hero`, `#st-etl`, …) e monta as âncoras.
`scrollToU()` converte `window.scrollY` no parâmetro `u` da spline de forma que a
estação *i* seja alcançada exatamente quando a seção *i* está centralizada — isso
funciona com seções de alturas diferentes, o que uma interpolação linear do scroll
não faria. O `u` passa por um `damp()` independente de taxa de quadros, então mesmo
uma rolagem brusca vira um movimento fluido.

### Enquadramento por estação

Cada entrada do `LAYOUT` declara `pos` (onde o conteúdo 3D vive), `cam` (deslocamento
da câmera), `bias` (fração da meia-largura que empurra o objeto para um lado) e
`lift` (fração da meia-altura que o sobe, abrindo espaço para o conteúdo embaixo).
`bias` e `lift` viram unidades de mundo a cada resize, a partir do FOV e do aspecto.
Em telas estreitas o `bias` zera e a câmera recua 34%: o 3D vira fundo e o texto
assume a coluna inteira.

### Estado do pipeline

`CICD_RUN` é uma lista `[nó, estado, atraso]` — a fonte única da verdade. Os botões e
o clique no hero chamam o mesmo `world.run()`, que agenda os passos; cada evento pinta
o nó nas **duas** instâncias do grafo (hero e entrega, que leem o mesmo `store.nodeState`)
e escreve uma linha no terminal com timestamp real. Há um retry proposital no `test:int`
para mostrar falha e recuperação.

### Acessibilidade e performance

- o engine entra por `import()` dinâmico: three.js (~88 KB gz) fica fora do bundle inicial
- `prefers-reduced-motion`: a câmera para de flutuar e o tempo do mundo corre a 25%
- o loop pausa com a aba em segundo plano
- só as estações a menos de 1,6 índice da câmera rodam `update()`
- sem WebGL, `:root[data-webgl="off"]` devolve fundos opacos e o pipeline segue no terminal

### Bilíngue

Cada texto passa por `<T pt en />`, que renderiza os dois idiomas; uma regra de CSS em
`:root[data-lang]` mostra um e esconde o outro. Zero re-render, zero dicionário em JS.

## Desenvolvimento

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

## Deploy

Cloudflare Workers via OpenNext, com domínio próprio configurado em `wrangler.jsonc`:

```bash
npx wrangler login              # uma vez, interativo
npx opennextjs-cloudflare build
npx wrangler deploy
```
