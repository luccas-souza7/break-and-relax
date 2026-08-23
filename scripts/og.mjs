/*
 * Gera public/og.png, a imagem do preview do link: npm run og
 *
 * O cartao nao e desenhado a mao em editor nenhum. Ele sai daqui pelo mesmo
 * motivo dos prints de docs/img/: arte feita a mao nao e reproduzivel e
 * envelhece calada quando a marca muda de lugar.
 *
 * O cavalo nao e redesenhado aqui, e lido de public/favicon.svg. Guia e preview
 * mostram o mesmo arquivo, entao nao existe a possibilidade de um mudar e o
 * outro ficar para tras.
 *
 * Consequencia de licenca: o favicon e obra derivada das pecas Cburnett, sob
 * CC BY-SA 3.0, e o PNG que sai daqui embute esse desenho. Logo o og.png herda
 * a mesma licenca, e nao a MIT do repositorio. A atribuicao esta no favicon,
 * no README e em public/THIRD-PARTY-NOTICES.txt.
 *
 * As fontes entram embutidas em base64, e nao por file://, porque a pagina e
 * montada com setContent e nasce sem origem: dali o Chromium recusa buscar
 * arquivo do disco. Embutido tambem garante o mesmo desenho sem rede.
 *
 * O PNG e versionado de proposito. O deploy roda apenas npm ci e npm run build,
 * nunca Playwright, entao a imagem precisa ja estar no repositorio.
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = join(RAIZ, 'public', 'og.png')

/* Medida canonica do cartao, a que os metadados do index.html anunciam. */
const LARGURA = 1200
const ALTURA = 630

/* A mesma frase do meta description. Duas copias, um texto so. */
const FRASE =
  'Uma pausa de verdade: uma partida contra a máquina, sem cadastro e sem relógio correndo.'

/* Tokens de src/index.css: --fundo, --tinta e --tinta-fraca. */
const FUNDO = '#E8EBE3'
const TINTA = '#1B211C'
const TINTA_FRACA = '#656B62'

/** Subset latino de cada fonte, embutido para a pagina nao depender do disco. */
function fonteEmbutida(pacote, arquivo) {
  const caminho = join(RAIZ, 'node_modules', '@fontsource-variable', pacote, 'files', arquivo)
  return readFileSync(caminho).toString('base64')
}

const BRICOLAGE = fonteEmbutida('bricolage-grotesque', 'bricolage-grotesque-latin-wght-normal.woff2')
const PUBLIC_SANS = fonteEmbutida('public-sans', 'public-sans-latin-wght-normal.woff2')

const cavalo = readFileSync(join(RAIZ, 'public', 'favicon.svg'), 'utf8')

/*
 * O nome repete .marca de src/index.css (Bricolage 600, caixa alta, 0.2em de
 * entreletra), so que grande. A margem negativa a direita descarta o espaco que
 * a entreletra deixa depois da ultima letra, senao o bloco parece torto.
 */
const pagina = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Bricolage Grotesque Variable';
        font-weight: 200 800;
        src: url(data:font/woff2;base64,${BRICOLAGE}) format('woff2');
      }
      @font-face {
        font-family: 'Public Sans Variable';
        font-weight: 100 900;
        src: url(data:font/woff2;base64,${PUBLIC_SANS}) format('woff2');
      }
      html,
      body {
        margin: 0;
        width: ${LARGURA}px;
        height: ${ALTURA}px;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 72px;
        background: ${FUNDO};
        -webkit-font-smoothing: antialiased;
      }
      .cavalo {
        width: 280px;
        flex: none;
      }
      .texto {
        width: 620px;
        flex: none;
      }
      .marca {
        margin: 0 -0.2em 0 0;
        font-family: 'Bricolage Grotesque Variable', sans-serif;
        font-weight: 600;
        font-size: 48px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: ${TINTA};
      }
      .frase {
        margin: 24px 0 0;
        font-family: 'Public Sans Variable', sans-serif;
        font-weight: 400;
        font-size: 26px;
        line-height: 1.5;
        color: ${TINTA_FRACA};
      }
    </style>
  </head>
  <body>
    <div class="cavalo">${cavalo}</div>
    <div class="texto">
      <p class="marca">Break and Relax</p>
      <p class="frase">${FRASE}</p>
    </div>
  </body>
</html>`

const browser = await chromium.launch()
let saida = 0

try {
  const page = await browser.newPage({
    viewport: { width: LARGURA, height: ALTURA },
    deviceScaleFactor: 1,
  })
  await page.setContent(pagina)
  // Sem esta espera o print pode sair na fonte de reserva, e so as vezes.
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: SAIDA })

  const kb = statSync(SAIDA).size / 1024
  console.log(`public/og.png: ${LARGURA}x${ALTURA}, ${kb.toFixed(0)} KB`)
  if (kb > 300) {
    console.error('acima do teto de 300 KB, que e o limite pratico dos previews')
    saida = 1
  }
} catch (erro) {
  console.error(`FALHOU: ${erro.message}`)
  saida = 1
} finally {
  await browser.close()
}

process.exit(saida)
