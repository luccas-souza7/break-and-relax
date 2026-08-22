import { Chess } from 'chess.js'
import type { PieceSymbol, Square } from 'chess.js'

import { MATE_SCORE, PIECE_VALUE, evaluate } from './evaluation'
import { algebraic, internals, type InternalMove } from './internal'
import type { LevelConfig } from './protocol'

/**
 * Minimax with alpha-beta pruning, move ordering and iterative deepening.
 *
 * The time budget is a hard wall. When it runs out mid-iteration the whole
 * iteration is discarded and the answer comes from the last depth that
 * actually finished — a half-searched depth plays worse than a shallower
 * complete one.
 */

class OutOfTime extends Error {}

/** How many extra plies of captures quiescence may follow. */
const MAX_QUIESCENCE_PLY = 4

/** Checking the clock on every node costs more than it saves. */
const CLOCK_INTERVAL = 63

type SearchContext = {
  chess: Chess
  moves: () => InternalMove[]
  make: (move: InternalMove) => void
  unmake: () => void
  deadline: number
  quiescence: boolean
  nodes: number
}

function tick(context: SearchContext): void {
  context.nodes++
  if ((context.nodes & CLOCK_INTERVAL) === 0 && performance.now() >= context.deadline) {
    throw new OutOfTime()
  }
}

/** Evaluation from the point of view of the side to move. */
function sideToMoveScore(context: SearchContext, moveCount: number): number {
  const score = evaluate(context.chess, moveCount)
  return context.chess.turn() === 'w' ? score : -score
}

/** Most Valuable Victim / Least Valuable Attacker, plus promotions. */
function orderingScore(move: InternalMove): number {
  let score = 0
  if (move.captured) score += 10 * PIECE_VALUE[move.captured] - PIECE_VALUE[move.piece]
  if (move.promotion) score += PIECE_VALUE[move.promotion]
  return score
}

function ordered(moves: InternalMove[]): InternalMove[] {
  return moves.sort((a, b) => orderingScore(b) - orderingScore(a))
}

/** Repetition, the fifty-move rule and bare kings all score as level. */
function isDrawn(chess: Chess): boolean {
  return (
    chess.isDrawByFiftyMoves() ||
    chess.isThreefoldRepetition() ||
    chess.isInsufficientMaterial()
  )
}

function quiescence(
  context: SearchContext,
  alpha: number,
  beta: number,
  ply: number,
): number {
  tick(context)

  const moves = context.moves()
  if (moves.length === 0) return context.chess.inCheck() ? -MATE_SCORE + ply : 0
  if (isDrawn(context.chess)) return 0

  const standPat = sideToMoveScore(context, moves.length)
  if (ply >= MAX_QUIESCENCE_PLY) return standPat
  if (standPat >= beta) return beta
  if (standPat > alpha) alpha = standPat

  const captures = ordered(moves.filter((move) => move.captured !== undefined))
  for (const move of captures) {
    context.make(move)
    const score = -quiescence(context, -beta, -alpha, ply + 1)
    context.unmake()
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }

  return alpha
}

function negamax(
  context: SearchContext,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
): number {
  tick(context)

  const moves = context.moves()
  // No legal move means mate or stalemate; a nearer mate is worth more.
  if (moves.length === 0) return context.chess.inCheck() ? -MATE_SCORE + ply : 0
  if (isDrawn(context.chess)) return 0

  if (depth <= 0) {
    return context.quiescence
      ? quiescence(context, alpha, beta, 0)
      : sideToMoveScore(context, moves.length)
  }

  let best = alpha
  for (const move of ordered(moves)) {
    context.make(move)
    const score = -negamax(context, depth - 1, -beta, -best, ply + 1)
    context.unmake()
    if (score >= beta) return beta
    if (score > best) best = score
  }
  return best
}

export type SearchResult = {
  from: Square
  to: Square
  promotion?: PieceSymbol
  score: number
  /** Plies fully searched. Never reports an abandoned iteration. */
  depth: number
  nodes: number
}

type Candidate = { move: InternalMove; score: number }

/** Descending weights, so the best move is still the likeliest one. */
function weightedPick(candidates: Candidate[]): Candidate {
  const weights = candidates.map((_, index) => candidates.length - index)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let ticket = Math.random() * total
  for (let index = 0; index < candidates.length; index++) {
    ticket -= weights[index]
    if (ticket <= 0) return candidates[index]
  }
  return candidates[0]
}

export function search(fen: string, config: LevelConfig): SearchResult | null {
  const chess = new Chess(fen)
  const api = internals(chess)

  const context: SearchContext = {
    chess,
    moves: () => api._moves({ legal: true }),
    make: (move) => api._makeMove(move),
    unmake: () => void api._undoMove(),
    deadline: performance.now() + config.budgetMs,
    quiescence: config.quiescence,
    nodes: 0,
  }

  const rootMoves = context.moves()
  if (rootMoves.length === 0) return null

  let candidates: Candidate[] = ordered(rootMoves).map((move) => ({ move, score: 0 }))
  let completedDepth = 0

  for (let depth = 1; depth <= config.maxDepth; depth++) {
    try {
      const scored: Candidate[] = []
      let alpha = -Infinity
      for (const { move } of candidates) {
        context.make(move)
        const score = -negamax(context, depth - 1, -Infinity, -alpha, 1)
        context.unmake()
        scored.push({ move, score })
        /* Narrowing the root window is only safe when a single move is
           chosen; a weighted pick needs every root score to be comparable. */
        if (config.choices === 1 && score > alpha) alpha = score
      }
      // A stable sort keeps the previous iteration's order among equals,
      // which is what makes iterative deepening improve the ordering.
      scored.sort((a, b) => b.score - a.score)
      candidates = scored
      completedDepth = depth
    } catch (error) {
      if (error instanceof OutOfTime) break
      throw error
    }
  }

  const pool = candidates.slice(0, Math.max(1, config.choices))
  const chosen = pool.length > 1 ? weightedPick(pool) : candidates[0]

  return {
    from: algebraic(chosen.move.from),
    to: algebraic(chosen.move.to),
    promotion: chosen.move.promotion,
    score: chosen.score,
    depth: completedDepth,
    nodes: context.nodes,
  }
}
