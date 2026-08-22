import type { Color, PieceSymbol, Square } from 'chess.js'

/** Difficulty, in the product's own words. */
export type Level = 'tranquilo' | 'normal' | 'desafio'

/** How the single game ended. There is no fifth possibility. */
export type Outcome = 'vitoria' | 'derrota' | 'empate' | 'encerrada'

/**
 * A square worth looking at once the game is over.
 *
 * `decisivo`  — answers "why did it end": the mated king, the stalemated king.
 * `atacante`  — the pieces that carried the ending out.
 * `bloqueado` — where the king could not go. This is the one that makes a
 *               stalemate or a mate make sense to someone staring at it.
 */
export type Destaque = {
  chave: string
  tipo: 'decisivo' | 'atacante' | 'bloqueado'
}

/**
 * How the game ended, in words the loser can read.
 *
 * The shell renders this and knows nothing about chess: the title, the
 * sentence and the squares to light up all arrive ready.
 */
export type Desfecho = {
  resultado: Outcome
  titulo: string
  explicacao: string
  destaques: Destaque[]
}

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
