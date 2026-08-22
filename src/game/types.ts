import type { Color, PieceSymbol, Square } from 'chess.js'

/** Difficulty, in the product's own words. */
export type Level = 'tranquilo' | 'normal' | 'desafio'

/** How the single game ended. There is no fifth possibility. */
export type Outcome = 'vitoria' | 'derrota' | 'empate' | 'encerrada'

export type Screen = 'inicio' | 'partida' | 'fim'

/**
 * A piece with a stable identity across the whole game.
 *
 * The board is never re-rendered to animate a move: each piece keeps its
 * DOM node from the first move to the last, and only its `square` changes.
 * That is what lets GSAP tween a single element instead of the grid.
 */
export type PieceView = {
  id: string
  color: Color
  type: PieceSymbol
  square: Square
}

/** A captured piece, for the tray. Order of capture is preserved. */
export type CapturedPiece = {
  id: string
  color: Color
  type: PieceSymbol
}
