import type { Desfecho, Destaque } from '@/types'

/**
 * Brazilian draughts. Pure TypeScript — no React, no DOM, no window. This is
 * the file the worker imports.
 *
 * The rules that decide games, stated once so nothing is ambiguous:
 *  - a man moves one square diagonally forward, and captures both forward and
 *    backward;
 *  - capturing is compulsory, and among the available sequences the one that
 *    takes the most pieces must be chosen (ties are free);
 *  - a sequence continues while the same piece can keep capturing;
 *  - a man promotes only if it *finishes* the move on the last rank; passing
 *    through it mid-sequence leaves it a man;
 *  - a king slides any distance, and captures at a distance, landing on any
 *    free square beyond the piece it took;
 *  - captured pieces leave the board only when the sequence ends, so they
 *    still block, and none of them may be jumped twice.
 */

export type Cor = 'clara' | 'escura'

/** The user plays the light pieces and moves first. */
export const HUMANO: Cor = 'clara'
export const MAQUINA: Cor = 'escura'

export type PecaDamas = {
  id: string
  cor: Cor
  dama: boolean
  casa: number
}

export type LanceDamas = {
  de: number
  /** Landing squares in order; the last one is where the piece ends up. */
  passos: number[]
  /** Squares of the pieces taken, in the order they were jumped. */
  capturadas: number[]
  promove: boolean
}

export type EstadoDamas = {
  readonly pecas: PecaDamas[]
  readonly vez: Cor
  readonly capturadasPeloHumano: PecaDamas[]
  readonly capturadasPelaMaquina: PecaDamas[]
  readonly ultimoLance: { de: number; para: number } | null
  /** Plies with kings only and no capture, for the 20-move draw. */
  readonly lancesEstereis: number
  readonly historico: string[]
  readonly encerradaPeloUsuario: boolean
}

/* ---- board geometry ---- */

export const linhaDe = (casa: number) => casa >> 3
export const colunaDe = (casa: number) => casa & 7
export const casaEm = (linha: number, coluna: number) => linha * 8 + coluna
export const dentro = (linha: number, coluna: number) =>
  linha >= 0 && linha < 8 && coluna >= 0 && coluna < 8

/** Play happens on the dark squares; a1 is dark and sits bottom left. */
export const casaEscura = (linha: number, coluna: number) => (linha + coluna) % 2 === 1

/** e.g. 27 -> "d5". */
export function notacao(casa: number): string {
  return `${'abcdefgh'[colunaDe(casa)]}${8 - linhaDe(casa)}`
}

const DIRECOES: Array<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

/** Light climbs the board, dark descends. */
const avanco = (cor: Cor) => (cor === 'clara' ? -1 : 1)
const ultimaLinha = (cor: Cor) => (cor === 'clara' ? 0 : 7)

/* ---- state ---- */

export function criarEstado(): EstadoDamas {
  const pecas: PecaDamas[] = []
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if (!casaEscura(linha, coluna)) continue
      const casa = casaEm(linha, coluna)
      if (linha < 3) pecas.push({ id: `e${casa}`, cor: 'escura', dama: false, casa })
      else if (linha > 4) pecas.push({ id: `c${casa}`, cor: 'clara', dama: false, casa })
    }
  }
  return {
    pecas,
    vez: HUMANO,
    capturadasPeloHumano: [],
    capturadasPelaMaquina: [],
    ultimoLance: null,
    lancesEstereis: 0,
    historico: [],
    encerradaPeloUsuario: false,
  }
}

export type Tabuleiro = (PecaDamas | undefined)[]

export function montarTabuleiro(pecas: PecaDamas[]): Tabuleiro {
  const tabuleiro: Tabuleiro = new Array(64)
  for (const peca of pecas) tabuleiro[peca.casa] = peca
  return tabuleiro
}

/* ---- move generation ---- */

type Parcial = { casa: number; capturadas: number[]; passos: number[] }

/**
 * Every way this piece can keep capturing, followed to the end.
 *
 * Captured pieces stay on the board while the sequence runs: they still block
 * the way, and `capturadas` stops any of them being jumped a second time.
 */
function sequenciasDeCaptura(
  tabuleiro: Tabuleiro,
  origem: number,
  cor: Cor,
  dama: boolean,
  parcial: Parcial,
  saidas: Parcial[],
): void {
  const linha = linhaDe(parcial.casa)
  const coluna = colunaDe(parcial.casa)
  let estendeu = false

  for (const [dl, dc] of DIRECOES) {
    if (dama) {
      // Slide over empty squares until the first piece in this direction.
      let distancia = 1
      while (dentro(linha + dl * distancia, coluna + dc * distancia)) {
        const alvo = casaEm(linha + dl * distancia, coluna + dc * distancia)
        const ocupante = tabuleiro[alvo]
        const vago = !ocupante || alvo === origem
        if (vago) {
          distancia++
          continue
        }
        // A piece of ours, or one already taken, ends the direction.
        if (ocupante.cor === cor || parcial.capturadas.includes(alvo)) break
        // Two pieces side by side can never be jumped.
        let pouso = distancia + 1
        while (dentro(linha + dl * pouso, coluna + dc * pouso)) {
          const destino = casaEm(linha + dl * pouso, coluna + dc * pouso)
          const naCasa = tabuleiro[destino]
          if (naCasa && destino !== origem) break
          estendeu = true
          sequenciasDeCaptura(
            tabuleiro,
            origem,
            cor,
            dama,
            {
              casa: destino,
              capturadas: [...parcial.capturadas, alvo],
              passos: [...parcial.passos, destino],
            },
            saidas,
          )
          pouso++
        }
        break
      }
      continue
    }

    // A man jumps the adjacent square, forwards or backwards.
    if (!dentro(linha + dl, coluna + dc) || !dentro(linha + dl * 2, coluna + dc * 2)) continue
    const alvo = casaEm(linha + dl, coluna + dc)
    const destino = casaEm(linha + dl * 2, coluna + dc * 2)
    const ocupante = tabuleiro[alvo]
    if (!ocupante || ocupante.cor === cor) continue
    if (parcial.capturadas.includes(alvo)) continue
    const naCasa = tabuleiro[destino]
    if (naCasa && destino !== origem) continue

    estendeu = true
    sequenciasDeCaptura(
      tabuleiro,
      origem,
      cor,
      dama,
      {
        casa: destino,
        capturadas: [...parcial.capturadas, alvo],
        passos: [...parcial.passos, destino],
      },
      saidas,
    )
  }

  // Only maximal sequences count: stopping early is not a legal move.
  if (!estendeu && parcial.capturadas.length > 0) saidas.push(parcial)
}

function lancesSimples(tabuleiro: Tabuleiro, peca: PecaDamas): LanceDamas[] {
  const linha = linhaDe(peca.casa)
  const coluna = colunaDe(peca.casa)
  const saidas: LanceDamas[] = []

  for (const [dl, dc] of DIRECOES) {
    if (!peca.dama && dl !== avanco(peca.cor)) continue
    let distancia = 1
    while (dentro(linha + dl * distancia, coluna + dc * distancia)) {
      const destino = casaEm(linha + dl * distancia, coluna + dc * distancia)
      if (tabuleiro[destino]) break
      saidas.push({
        de: peca.casa,
        passos: [destino],
        capturadas: [],
        promove: !peca.dama && linhaDe(destino) === ultimaLinha(peca.cor),
      })
      if (!peca.dama) break
      distancia++
    }
  }
  return saidas
}

/**
 * Move generation against a board, so the search can work on a mutable one
 * and the interface on an immutable state without the rules being written
 * twice.
 */
export function lancesNoTabuleiro(tabuleiro: Tabuleiro, vez: Cor): LanceDamas[] {
  const minhas: PecaDamas[] = []
  for (const peca of tabuleiro) if (peca && peca.cor === vez) minhas.push(peca)

  const capturas: LanceDamas[] = []
  for (const peca of minhas) {
    const saidas: Parcial[] = []
    sequenciasDeCaptura(
      tabuleiro,
      peca.casa,
      peca.cor,
      peca.dama,
      { casa: peca.casa, capturadas: [], passos: [] },
      saidas,
    )
    for (const s of saidas) {
      capturas.push({
        de: peca.casa,
        passos: s.passos,
        capturadas: s.capturadas,
        // A man that only passes over the last rank stays a man; what counts
        // is the square it finishes on.
        promove: !peca.dama && linhaDe(s.casa) === ultimaLinha(peca.cor),
      })
    }
  }

  if (capturas.length > 0) {
    // The majority law: whichever sequence takes the most.
    const maior = Math.max(...capturas.map((c) => c.capturadas.length))
    return capturas.filter((c) => c.capturadas.length === maior)
  }

  return minhas.flatMap((peca) => lancesSimples(tabuleiro, peca))
}

export function lancesLegais(e: EstadoDamas): LanceDamas[] {
  if (e.encerradaPeloUsuario) return []
  return lancesNoTabuleiro(montarTabuleiro(e.pecas), e.vez)
}

/* ---- applying ---- */

function textoDoLance(lance: LanceDamas): string {
  const casas = [lance.de, ...lance.passos].map(notacao)
  return casas.join(lance.capturadas.length > 0 ? 'x' : '-')
}

export function aplicar(e: EstadoDamas, lance: LanceDamas): EstadoDamas {
  const destino = lance.passos[lance.passos.length - 1]
  const tomadas = new Set(lance.capturadas)

  const capturadas: PecaDamas[] = []
  const pecas: PecaDamas[] = []
  for (const peca of e.pecas) {
    if (tomadas.has(peca.casa)) {
      capturadas.push(peca)
      continue
    }
    if (peca.casa === lance.de) {
      pecas.push({ ...peca, casa: destino, dama: peca.dama || lance.promove })
      continue
    }
    pecas.push(peca)
  }

  const soDamas = pecas.every((p) => p.dama)
  const esteril = soDamas && lance.capturadas.length === 0

  return {
    pecas,
    vez: e.vez === 'clara' ? 'escura' : 'clara',
    capturadasPeloHumano:
      e.vez === HUMANO ? [...e.capturadasPeloHumano, ...capturadas] : e.capturadasPeloHumano,
    capturadasPelaMaquina:
      e.vez === MAQUINA ? [...e.capturadasPelaMaquina, ...capturadas] : e.capturadasPelaMaquina,
    ultimoLance: { de: lance.de, para: destino },
    lancesEstereis: esteril ? e.lancesEstereis + 1 : 0,
    historico: [...e.historico, textoDoLance(lance)],
    encerradaPeloUsuario: false,
  }
}

export function encerrar(e: EstadoDamas): EstadoDamas {
  if (e.encerradaPeloUsuario || avaliarFim(e)) return e
  return { ...e, encerradaPeloUsuario: true }
}

export function vezDe(e: EstadoDamas): 'humano' | 'maquina' {
  return e.vez === HUMANO ? 'humano' : 'maquina'
}

/* ---- endings ---- */

const ENCERRADA: Desfecho = {
  resultado: 'encerrada',
  titulo: 'Encerrada',
  explicacao: 'A pausa era esse tempo mesmo.',
  destaques: [],
}

/** Forty plies — twenty each — of kings shuffling with nothing taken. */
const LIMITE_ESTERIL = 40

export function avaliarFim(e: EstadoDamas): Desfecho | null {
  if (e.encerradaPeloUsuario) return ENCERRADA

  if (e.lancesEstereis >= LIMITE_ESTERIL) {
    return {
      resultado: 'empate',
      titulo: 'Empate',
      explicacao:
        'Passaram 20 lances de cada lado só com damas, sem nenhuma captura. A partida termina empatada.',
      destaques: [],
    }
  }

  const minhas = e.pecas.filter((p) => p.cor === e.vez)
  if (minhas.length > 0 && lancesLegais(e).length > 0) return null

  const perdeuOHumano = e.vez === HUMANO
  const quem = perdeuOHumano ? 'Você' : 'A máquina'
  const semPecas = minhas.length === 0

  // The pieces that could not move are the answer to "why did it end".
  const destaques: Destaque[] = semPecas
    ? e.pecas.map((p) => ({ chave: String(p.casa), tipo: 'atacante' as const }))
    : minhas.map((p) => ({ chave: String(p.casa), tipo: 'decisivo' as const }))

  return {
    resultado: perdeuOHumano ? 'derrota' : 'vitoria',
    titulo: 'Fim de jogo',
    explicacao: semPecas
      ? `${quem} ficou sem peças no tabuleiro.`
      : `${quem} ainda tinha peças, mas nenhuma delas podia se mover. Quem não tem lance legal perde.`,
    destaques,
  }
}

export function historico(e: EstadoDamas): string[] {
  return e.historico
}

/* ---- worker protocol ---- */

export function serializar(e: EstadoDamas): EstadoDamas {
  return e
}

export function desserializarLance(e: EstadoDamas, bruto: unknown): LanceDamas | null {
  const lance = bruto as LanceDamas | null
  if (!lance || typeof lance.de !== 'number' || !Array.isArray(lance.passos)) return null
  const alvo = lance.passos[lance.passos.length - 1]
  return (
    lancesLegais(e).find(
      (l) =>
        l.de === lance.de &&
        l.passos[l.passos.length - 1] === alvo &&
        l.capturadas.length === lance.capturadas.length &&
        l.passos.join() === lance.passos.join(),
    ) ?? null
  )
}
