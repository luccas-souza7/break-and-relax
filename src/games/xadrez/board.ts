import type { Square } from 'chess.js'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

/**
 * Every square, ordered the way the user sees them: rank 8 first, file a
 * first. The board is always shown from White's side, because the user is White.
 */
export const SQUARES_IN_VIEW: Square[] = RANKS.flatMap((rank) =>
  FILES.map((file) => `${file}${rank}` as Square),
)

/** Column 0 is file a. */
export function colOf(square: Square): number {
  return square.charCodeAt(0) - 97
}

/** Row 0 is rank 8, matching the on-screen order. */
export function rowOf(square: Square): number {
  return 8 - Number(square[1])
}

export function squareAt(row: number, col: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square
}

/** a8 is light, and (row + col) even follows from that. */
export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0
}
