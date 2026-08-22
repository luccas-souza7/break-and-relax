import type { PieceSymbol, Square } from 'chess.js'

import type { Level } from '@/game/types'

export type EngineRequest = {
  type: 'search'
  /** Search id, echoed back so a stale answer can be discarded. */
  id: number
  fen: string
  level: Level
}

export type EngineResponse = {
  type: 'bestmove'
  id: number
  from: Square
  to: Square
  promotion?: PieceSymbol
  /** Plies actually completed — the search never reports a partial depth. */
  depth: number
}

export type LevelConfig = {
  /** Ceiling for iterative deepening. */
  maxDepth: number
  /** Hard wall-clock budget per move, in milliseconds. */
  budgetMs: number
  /** Extend the search over captures until the position is quiet. */
  quiescence: boolean
  /**
   * How many of the best moves to draw from. Above one, the pick is random
   * with descending weight — enough to let a careless move go unpunished.
   */
  choices: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  tranquilo: { maxDepth: 1, budgetMs: 600, quiescence: false, choices: 3 },
  normal: { maxDepth: 3, budgetMs: 600, quiescence: false, choices: 1 },
  desafio: { maxDepth: 4, budgetMs: 1000, quiescence: true, choices: 1 },
}

export const LEVEL_LABELS: Record<Level, string> = {
  tranquilo: 'Tranquilo',
  normal: 'Normal',
  desafio: 'Desafio',
}

/**
 * The machine never answers instantly, even when it could. A reply that lands
 * in ten milliseconds reads as a bug and breaks the rhythm of the break.
 */
export const MIN_REPLY_MS = 350
