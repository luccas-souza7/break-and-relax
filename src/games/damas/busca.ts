import { buscar } from '@/engine/minimax'
import type { Nivel } from '@/types'
import {
  colunaDe,
  lancesNoTabuleiro,
  linhaDe,
  montarTabuleiro,
  type Cor,
  type EstadoDamas,
  type LanceDamas,
  type PecaDamas,
  type Tabuleiro,
} from './rules'

/**
 * Draughts wiring for the shared minimax.
 *
 * Draughts takes far more depth than chess for the same budget: compulsory
 * capture cuts the branching factor hard, and most positions offer a handful
 * of moves rather than thirty.
 */

export type ConfigNivel = {
  profundidadeMax: number
  tetoMs: number
  escolhas: number
}

export const NIVEIS_DAMAS: Record<Nivel, ConfigNivel> = {
  tranquilo: { profundidadeMax: 4, tetoMs: 600, escolhas: 3 },
  normal: { profundidadeMax: 6, tetoMs: 600, escolhas: 1 },
  desafio: { profundidadeMax: 8, tetoMs: 1000, escolhas: 1 },
}

const VALOR_PEDRA = 100
const VALOR_DAMA = 300
/** A man is worth a little more the closer it gets to promoting. */
const BONUS_AVANCO = 6
/** Holding the back row keeps the opponent from crowning. */
const BONUS_FILEIRA_DE_TRAS = 12
/** A piece on the edge file can never be captured, and never does much. */
const PENA_BORDA = 8

function valorDaPeca(peca: PecaDamas): number {
  if (peca.dama) return VALOR_DAMA

  const linha = linhaDe(peca.casa)
  const coluna = colunaDe(peca.casa)
  // How far this man has come, counted from its own side.
  const avanco = peca.cor === 'clara' ? 7 - linha : linha
  let valor = VALOR_PEDRA + avanco * BONUS_AVANCO
  if (coluna === 0 || coluna === 7) valor -= PENA_BORDA
  const fileiraDeTras = peca.cor === 'clara' ? 7 : 0
  if (linha === fileiraDeTras) valor += BONUS_FILEIRA_DE_TRAS
  return valor
}

/** Positive is good for the light pieces. */
function avaliarTabuleiro(tabuleiro: Tabuleiro): number {
  let nota = 0
  for (const peca of tabuleiro) {
    if (!peca) continue
    nota += peca.cor === 'clara' ? valorDaPeca(peca) : -valorDaPeca(peca)
  }
  return nota
}

const PERDA = 100000

type Posicao = { tabuleiro: Tabuleiro; vez: Cor }

type Desfazer = {
  lance: LanceDamas
  peca: PecaDamas
  eraDama: boolean
  capturadas: PecaDamas[]
}

function fazer(posicao: Posicao, lance: LanceDamas, pilha: Desfazer[]): void {
  const destino = lance.passos[lance.passos.length - 1]
  const peca = posicao.tabuleiro[lance.de]!
  const capturadas: PecaDamas[] = []

  for (const casa of lance.capturadas) {
    capturadas.push(posicao.tabuleiro[casa]!)
    posicao.tabuleiro[casa] = undefined
  }

  pilha.push({ lance, peca, eraDama: peca.dama, capturadas })

  posicao.tabuleiro[lance.de] = undefined
  const movida: PecaDamas = {
    ...peca,
    casa: destino,
    dama: peca.dama || lance.promove,
  }
  posicao.tabuleiro[destino] = movida
  posicao.vez = posicao.vez === 'clara' ? 'escura' : 'clara'
}

function desfazer(posicao: Posicao, pilha: Desfazer[]): void {
  const registro = pilha.pop()
  if (!registro) return
  const destino = registro.lance.passos[registro.lance.passos.length - 1]
  posicao.tabuleiro[destino] = undefined
  posicao.tabuleiro[registro.lance.de] = { ...registro.peca, dama: registro.eraDama }
  for (const peca of registro.capturadas) posicao.tabuleiro[peca.casa] = peca
  posicao.vez = posicao.vez === 'clara' ? 'escura' : 'clara'
}

/** Captures first, and the bigger the sequence the better. */
function ordem(lance: LanceDamas): number {
  return lance.capturadas.length * 100 + (lance.promove ? 10 : 0)
}

export function buscarLance(estado: EstadoDamas, nivel: Nivel): LanceDamas | null {
  const config = NIVEIS_DAMAS[nivel]
  const posicao: Posicao = { tabuleiro: montarTabuleiro(estado.pecas), vez: estado.vez }
  const pilha: Desfazer[] = []

  const resultado = buscar<Posicao, LanceDamas>({
    estado: posicao,
    lances: (p) => lancesNoTabuleiro(p.tabuleiro, p.vez),
    fazer: (p, l) => fazer(p, l, pilha),
    desfazer: (p) => desfazer(p, pilha),
    avaliar: (p) => {
      const nota = avaliarTabuleiro(p.tabuleiro)
      return p.vez === 'clara' ? nota : -nota
    },
    // No move means this side has lost; a longer resistance scores better.
    semLances: (_p, ply) => -PERDA + ply,
    ordem,
    profundidadeMax: config.profundidadeMax,
    tetoMs: config.tetoMs,
    escolhas: config.escolhas,
  })

  return resultado ? resultado.lance : null
}
