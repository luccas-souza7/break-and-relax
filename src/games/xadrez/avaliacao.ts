import type { Chess, Color, PieceSymbol } from 'chess.js'

/**
 * Evaluation: material, piece-square tables and a small mobility bonus.
 * Always scored from White's point of view; the search flips the sign.
 */

export const VALOR_PECA: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
}

export const MATE = 100000

/* Tables are written the way the board reads: index 0 is a8, index 63 is h1.
   They are stated from White's side and mirrored vertically for Black. */
const PAWN = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
]

const KNIGHT = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50,
]

const BISHOP = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
]

const ROOK = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
]

const QUEEN = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20,
]

const KING_MIDDLEGAME = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20,
]

const KING_ENDGAME = [
 -50,-40,-30,-20,-20,-30,-40,-50,
 -30,-20,-10,  0,  0,-10,-20,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-30,  0,  0,  0,  0,-30,-30,
 -50,-30,-30,-30,-30,-30,-30,-50,
]

const TABLES: Record<Exclude<PieceSymbol, 'k'>, number[]> = {
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  q: QUEEN,
}

/** Below this much non-pawn material, the king should walk toward the centre. */
const ENDGAME_THRESHOLD = 1300

const MOBILITY_WEIGHT = 2

function squareBonus(type: PieceSymbol, color: Color, index: number, endgame: boolean): number {
  // Black reads the same table from the other end of the board.
  const i = color === 'w' ? index : (7 - Math.floor(index / 8)) * 8 + (index % 8)
  if (type === 'k') return endgame ? KING_ENDGAME[i] : KING_MIDDLEGAME[i]
  return TABLES[type][i]
}

export function avaliar(chess: Chess, moveCount?: number): number {
  const board = chess.board()

  let heavyMaterial = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type !== 'p' && cell.type !== 'k') heavyMaterial += VALOR_PECA[cell.type]
    }
  }
  const endgame = heavyMaterial < ENDGAME_THRESHOLD

  let score = 0
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col]
      if (!cell) continue
      const index = row * 8 + col
      const value = VALOR_PECA[cell.type] + squareBonus(cell.type, cell.color, index, endgame)
      score += cell.color === 'w' ? value : -value
    }
  }

  /* A small nudge toward having somewhere to go. Counted for the side to
     move only, because generating both sides' moves would cost more than it is
     worth at these depths. The search passes in the count it already has. */
  const mobility = (moveCount ?? chess.moves().length) * MOBILITY_WEIGHT
  score += chess.turn() === 'w' ? mobility : -mobility

  return score
}
