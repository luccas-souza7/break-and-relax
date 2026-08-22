import type { Color, PieceSymbol } from 'chess.js'

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
