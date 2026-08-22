import { Chess } from 'chess.js'
import type { PieceSymbol, Square } from 'chess.js'

import { buscar } from '@/engine/minimax'
import type { Nivel } from '@/types'
import { MATE, VALOR_PECA, avaliar } from './avaliacao'
import { algebraic, internos, type LanceInterno } from './internoChessJs'

/** Chess-specific wiring for the shared minimax. */

export type ConfigNivel = {
  profundidadeMax: number
  tetoMs: number
  quiescencia: boolean
  escolhas: number
}

export const NIVEIS_XADREZ: Record<Nivel, ConfigNivel> = {
  tranquilo: { profundidadeMax: 1, tetoMs: 600, quiescencia: false, escolhas: 3 },
  normal: { profundidadeMax: 3, tetoMs: 600, quiescencia: false, escolhas: 1 },
  desafio: { profundidadeMax: 4, tetoMs: 1000, quiescencia: true, escolhas: 1 },
}

export type LanceBruto = { de: Square; para: Square; promocao?: PieceSymbol }

/** Most Valuable Victim / Least Valuable Attacker, plus promotions. */
function ordem(lance: LanceInterno): number {
  let nota = 0
  if (lance.captured) nota += 10 * VALOR_PECA[lance.captured] - VALOR_PECA[lance.piece]
  if (lance.promotion) nota += VALOR_PECA[lance.promotion]
  return nota
}

export function buscarLance(fen: string, nivel: Nivel): LanceBruto | null {
  const chess = new Chess(fen)
  const api = internos(chess)
  const config = NIVEIS_XADREZ[nivel]

  const resultado = buscar<Chess, LanceInterno>({
    estado: chess,
    lances: () => api._moves({ legal: true }),
    fazer: (_e, l) => api._makeMove(l),
    desfazer: () => void api._undoMove(),
    avaliar: (e, quantidade) => {
      const nota = avaliar(e, quantidade)
      return e.turn() === 'w' ? nota : -nota
    },
    // No legal move means mate or stalemate; a nearer mate is worth more.
    semLances: (e, ply) => (e.inCheck() ? -MATE + ply : 0),
    empatado: (e) =>
      e.isDrawByFiftyMoves() || e.isThreefoldRepetition() || e.isInsufficientMaterial(),
    ordem,
    quiescencia: {
      ativa: config.quiescencia,
      ehCaptura: (l) => l.captured !== undefined,
      maxPly: 4,
    },
    profundidadeMax: config.profundidadeMax,
    tetoMs: config.tetoMs,
    escolhas: config.escolhas,
  })

  if (!resultado) return null
  return {
    de: algebraic(resultado.lance.from),
    para: algebraic(resultado.lance.to),
    promocao: resultado.lance.promotion,
  }
}
