import type { Color, PieceSymbol, Square } from 'chess.js'

/**
 * What the pieces are called. Text only: the images live in `pieces.ts`, so
 * the rules can name a piece without dragging twelve SVGs behind them.
 */

/** Piece names carry grammatical gender, which the colour adjective follows. */
const NOMES: Record<PieceSymbol, { substantivo: string; feminino: boolean }> = {
  p: { substantivo: 'peão', feminino: false },
  n: { substantivo: 'cavalo', feminino: false },
  b: { substantivo: 'bispo', feminino: false },
  r: { substantivo: 'torre', feminino: true },
  q: { substantivo: 'dama', feminino: true },
  k: { substantivo: 'rei', feminino: false },
}

/** Relative worth, used only to sort the captured tray. */
export const ORDEM_PECA: Record<PieceSymbol, number> = {
  q: 0,
  r: 1,
  b: 2,
  n: 3,
  p: 4,
  k: 5,
}

export function nomeDaPeca(cor: Color, tipo: PieceSymbol): string {
  const { substantivo, feminino } = NOMES[tipo]
  const tom = cor === 'w' ? 'branc' : 'pret'
  return `${substantivo} ${tom}${feminino ? 'a' : 'o'}`
}

/** e.g. "e4, cavalo branco" or "d5, casa vazia". */
export function descreverCasa(
  casa: Square,
  peca: { cor: Color; tipo: PieceSymbol } | undefined,
): string {
  return peca ? `${casa}, ${nomeDaPeca(peca.cor, peca.tipo)}` : `${casa}, casa vazia`
}
