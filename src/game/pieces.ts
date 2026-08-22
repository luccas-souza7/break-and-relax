import type { Color, PieceSymbol, Square } from 'chess.js'

import bB from '@/assets/pieces/bB.svg'
import bK from '@/assets/pieces/bK.svg'
import bN from '@/assets/pieces/bN.svg'
import bP from '@/assets/pieces/bP.svg'
import bQ from '@/assets/pieces/bQ.svg'
import bR from '@/assets/pieces/bR.svg'
import wB from '@/assets/pieces/wB.svg'
import wK from '@/assets/pieces/wK.svg'
import wN from '@/assets/pieces/wN.svg'
import wP from '@/assets/pieces/wP.svg'
import wQ from '@/assets/pieces/wQ.svg'
import wR from '@/assets/pieces/wR.svg'

/** Cburnett piece set by Colin M.L. Burnett, CC BY-SA 3.0. */
export const PIECE_SVG: Record<Color, Record<PieceSymbol, string>> = {
  w: { p: wP, n: wN, b: wB, r: wR, q: wQ, k: wK },
  b: { p: bP, n: bN, b: bB, r: bR, q: bQ, k: bK },
}

/** Piece names carry grammatical gender, which the colour adjective follows. */
const PIECE_NAMES: Record<PieceSymbol, { noun: string; feminine: boolean }> = {
  p: { noun: 'peão', feminine: false },
  n: { noun: 'cavalo', feminine: false },
  b: { noun: 'bispo', feminine: false },
  r: { noun: 'torre', feminine: true },
  q: { noun: 'dama', feminine: true },
  k: { noun: 'rei', feminine: false },
}

/** Relative worth, used only to sort the captured tray. */
export const PIECE_ORDER: Record<PieceSymbol, number> = {
  q: 0,
  r: 1,
  b: 2,
  n: 3,
  p: 4,
  k: 5,
}

export function pieceName(color: Color, type: PieceSymbol): string {
  const { noun, feminine } = PIECE_NAMES[type]
  const shade = color === 'w' ? 'branc' : 'pret'
  return `${noun} ${shade}${feminine ? 'a' : 'o'}`
}

/** e.g. "e4, cavalo branco" or "d5, casa vazia". */
export function describeSquare(
  square: Square,
  piece: { color: Color; type: PieceSymbol } | undefined,
): string {
  return piece ? `${square}, ${pieceName(piece.color, piece.type)}` : `${square}, casa vazia`
}
