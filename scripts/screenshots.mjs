/*
 * Gera todas as imagens de docs/img/ do zero: npm run screenshots
 *
 * Print tirado a mao nao e reproduzivel e envelhece em silencio. Aqui o dev
 * server sobe, as imagens saem, o server cai, e o resultado e o mesmo em
 * qualquer maquina.
 *
 * Roda contra o dev server, e nao contra o preview, porque os hooks de
 * src/dev/testHooks.ts so existem em desenvolvimento. Sem eles cada print
 * dependeria de a maquina responder igual toda vez, o que nao acontece: a
 * busca tem teto de relogio, entao a profundidade alcancada muda conforme a
 * CPU.
 *
 * Os PNGs saem primeiro. Se o GIF falhar, o processo sai com codigo 1 dizendo
 * a causa, e nenhum PNG ja gerado e apagado.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ffmpegPath from 'ffmpeg-static'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = join(RAIZ, 'docs', 'img')
const TEMP = join(RAIZ, 'scratch', 'video')

/** Meio de jogo da Italiana, brancas na vez. O bispo de c4 tem seis destinos. */
const FEN_MEIO = 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7'
/** Mate do pastor: curto, reconhecivel, e acende os tres tipos de destaque. */
const FEN_MATE = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'
/** 3 minutos e 47 segundos: uma pausa plausivel, nao um numero redondo. */
const SEGUNDOS = 227

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

/** So considera pronta a tela cujo tabuleiro ja montou. */
async function abrirPartida(page, { jogo = 'xadrez' } = {}) {
  if (jogo === 'damas') await page.getByRole('radio', { name: 'Damas' }).click()
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.waitForSelector('[data-square]')
  await espera(400)
}

async function tirarPrints(browser) {
  const feitos = []

  const nova = async (viewport) => {
    const contexto = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    const page = await contexto.newPage()
    // O estado final aparece sem depender de timing de animacao.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const erros = []
    page.on('pageerror', (e) => erros.push(String(e.message)))
    page.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
    return { contexto, page, erros }
  }

  const salvar = async (page, erros, nome) => {
    if (erros.length) throw new Error(`erro de console antes de ${nome}: ${erros[0]}`)
    const caminho = join(SAIDA, nome)
    await page.screenshot({ path: caminho })
    const kb = statSync(caminho).size / 1024
    feitos.push({ nome, kb })
    console.log(`  ${nome.padEnd(22)} ${kb.toFixed(0).padStart(4)} KB`)
  }

  /* 1 e 2. Tela de inicio, no desktop e no celular, sem tocar em nada: xadrez
     e Normal ja sao o estado inicial. */
  for (const [nome, viewport] of [
    ['inicio.png', { width: 1440, height: 900 }],
    ['inicio-mobile.png', { width: 390, height: 844 }],
  ]) {
    const { contexto, page, erros } = await nova(viewport)
    await page.goto(URL_BASE)
    await page.waitForSelector('button:has-text("Começar")')
    await espera(300)
    await salvar(page, erros, nome)
    await contexto.close()
  }

  /* 3. Meio de partida no xadrez, com o bispo de c4 selecionado. */
  {
    const { contexto, page, erros } = await nova({ width: 1440, height: 900 })
    await page.goto(URL_BASE)
    await abrirPartida(page)
    await page.evaluate((fen) => window.__brSetPosition(fen), FEN_MEIO)
    await espera(300)
    await page.evaluate(() => window.__brSelecionar('c4'))
    await espera(300)
    await salvar(page, erros, 'partida-xadrez.png')
    await contexto.close()
  }

  /* 4. Tela de fim com xeque-mate. O tempo entra antes da posicao, porque a
     casca so preenche o decorrido se ele ainda estiver zerado. */
  {
    const { contexto, page, erros } = await nova({ width: 1440, height: 900 })
    await page.goto(URL_BASE)
    await abrirPartida(page)
    await page.evaluate((s) => window.__brSetTempo(s), SEGUNDOS)
    await page.evaluate((fen) => window.__brSetPosition(fen), FEN_MATE)
    await page.waitForSelector('[data-fim="cartao"]')
    await espera(400)
    await salvar(page, erros, 'fim-xadrez.png')
    await contexto.close()
  }

  /* 5. Damas com a captura obrigatoria em curso: d4 escolhida, o primeiro
     salto dado em f6, e os dois desfechos possiveis anelados. */
  {
    const { contexto, page, erros } = await nova({ width: 1440, height: 900 })
    await page.goto(URL_BASE)
    await abrirPartida(page, { jogo: 'damas' })
    await page.evaluate(() => window.__brSetPosition('captura-obrigatoria'))
    await espera(300)
    await page.evaluate(() => window.__brSelecionar('d4'))
    await espera(200)
    await page.evaluate(() => window.__brSelecionar('f6'))
    await espera(300)
    await salvar(page, erros, 'partida-damas.png')
    await contexto.close()
  }

  return feitos
}

/**
 * Grava o video com as animacoes ligadas e converte com paleta.
 *
 * O Playwright comeca a gravar quando a pagina nasce, entao o carregamento
 * entra no arquivo. Por isso o corte de entrada: marco o instante do clique
 * que abre a jogada e passo esse deslocamento ao ffmpeg. Os dois filtros do
 * documento ficam como escritos.
 */
async function gravarGif(browser) {
  if (!ffmpegPath) {
    throw new Error(
      'ffmpeg-static devolveu null: o download do postinstall falhou, por proxy ou firewall. ' +
        'Rode npm rebuild ffmpeg-static com acesso a rede e tente de novo.',
    )
  }

  rmSync(TEMP, { recursive: true, force: true })
  mkdirSync(TEMP, { recursive: true })

  /* Grava em 1024x640 e nao em 1280x800: a saida e a mesma (800 de largura,
     16:10), mas menos pixel de origem significa menos detalhe fino para o
     dithering espalhar, e o GIF fecha com folga sob os 2 MB em vez de raspar
     o teto. */
  const contexto = await browser.newContext({
    viewport: { width: 1024, height: 640 },
    recordVideo: { dir: TEMP, size: { width: 1024, height: 640 } },
  })
  const page = await contexto.newPage()
  const nascimento = Date.now()

  await page.goto(URL_BASE)
  await page.waitForSelector('button:has-text("Começar")')
  await espera(900)
  await abrirPartida(page)
  await espera(900)

  // A partir daqui e o que o GIF mostra.
  const inicioDaCena = Date.now()
  await page.locator('[data-square="e2"]').click()
  await espera(220)
  await page.locator('[data-square="e4"]').click()

  // Espera a maquina responder de verdade, em vez de chutar um tempo.
  await page.waitForFunction(
    () => document.querySelector('[aria-live="polite"]')?.textContent === 'sua vez',
    undefined,
    { timeout: 15000 },
  )
  await espera(250)

  await page.evaluate((s) => window.__brSetTempo(s), SEGUNDOS)
  await page.evaluate(() => window.__brSetTela('fim'))
  await espera(3200)

  const corte = (inicioDaCena - nascimento) / 1000
  await contexto.close() // fecha o arquivo de video

  const webm = readdirSync(TEMP)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => join(TEMP, f))[0]
  if (!webm) throw new Error('o Playwright nao gravou nenhum .webm')

  const paleta = join(TEMP, 'paleta.png')
  const gif = join(SAIDA, 'demo.gif')
  const ff = (args) => execFileSync(ffmpegPath, args, { stdio: 'pipe' })

  const gerar = (duracao) => {
    ff(['-ss', String(corte), '-t', String(duracao), '-i', webm,
      '-vf', 'fps=12,scale=800:-1:flags=lanczos,palettegen=stats_mode=diff',
      '-y', paleta])
    ff(['-ss', String(corte), '-t', String(duracao), '-i', webm, '-i', paleta,
      '-lavfi', 'fps=12,scale=800:-1:flags=lanczos,paletteuse=dither=bayer:bayer_scale=3',
      '-y', gif])
    return statSync(gif).size / (1024 * 1024)
  }

  let mb = gerar(4)
  console.log(`  demo.gif (4s)          ${mb.toFixed(2)} MB`)
  if (mb > 2) {
    // O documento manda cortar a duracao antes de baixar a qualidade.
    mb = gerar(3)
    console.log(`  demo.gif (3s)          ${mb.toFixed(2)} MB  (cortado por peso)`)
  }
  if (mb > 2) throw new Error(`demo.gif ficou em ${mb.toFixed(2)} MB, acima do teto de 2 MB`)

  rmSync(TEMP, { recursive: true, force: true })
  return mb
}

/* ---- execucao ---- */

const servidor = await createServer({ root: RAIZ, logLevel: 'warn' })
await servidor.listen()
const URL_BASE = servidor.resolvedUrls.local[0]
console.log(`dev server em ${URL_BASE}\n`)

mkdirSync(SAIDA, { recursive: true })
const browser = await chromium.launch()
let saida = 0

try {
  console.log('prints:')
  const feitos = await tirarPrints(browser)
  const gordo = feitos.find((f) => f.kb > 400)
  if (gordo) throw new Error(`${gordo.nome} ficou com ${gordo.kb.toFixed(0)} KB, acima de 400 KB`)

  try {
    console.log('\ngif:')
    await gravarGif(browser)
  } catch (erro) {
    // Os PNGs ja gerados ficam. O GIF nunca e pulado em silencio.
    console.error(`\nFALHOU o GIF: ${erro.message}`)
    console.error('Os PNGs acima foram gerados e permanecem em docs/img/.')
    saida = 1
  }

  const total = readdirSync(SAIDA).reduce((s, f) => s + statSync(join(SAIDA, f)).size, 0)
  console.log(`\ntotal em docs/img/: ${(total / (1024 * 1024)).toFixed(2)} MB (teto 4 MB)`)
  if (total > 4 * 1024 * 1024) {
    console.error('acima do teto de 4 MB')
    saida = 1
  }
} catch (erro) {
  console.error(`\nFALHOU: ${erro.message}`)
  saida = 1
} finally {
  await browser.close()
  await servidor.close()
}

process.exit(saida)
