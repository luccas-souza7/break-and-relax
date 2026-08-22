import { useCallback, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Color, Move, PieceSymbol, Square } from 'chess.js'

import { applyMove, readPieces } from './pieceTracker'
import type { CapturedPiece, Outcome, PieceView } from './types'

/** The user is always White. That decision is not exposed anywhere. */
export const HUMAN: Color = 'w'
export const ENGINE: Color = 'b'

export type PendingPromotion = { from: Square; to: Square }

type GameSnapshot = {
  pieces: PieceView[]
  turn: Color
  lastMove: { from: Square; to: Square } | null
  capturedByHuman: CapturedPiece[]
  capturedByEngine: CapturedPiece[]
  checkPulse: number
  outcome: Outcome | null
  elapsedMs: number
}

const EMPTY_TARGETS: ReadonlyMap<Square, boolean> = new Map()

function initialSnapshot(chess: Chess): GameSnapshot {
  return {
    pieces: readPieces(chess),
    turn: chess.turn(),
    lastMove: null,
    capturedByHuman: [],
    capturedByEngine: [],
    checkPulse: 0,
    outcome: null,
    elapsedMs: 0,
  }
}

/**
 * Reads the outcome from the position. The rules all come from chess.js:
 * checkmate, stalemate, threefold repetition, the fifty-move rule and
 * insufficient material are never re-implemented here.
 */
function outcomeOf(chess: Chess): Outcome | null {
  if (chess.isCheckmate()) return chess.turn() === HUMAN ? 'derrota' : 'vitoria'
  if (chess.isGameOver()) return 'empate'
  return null
}

export function useChessGame() {
  const chessRef = useRef(new Chess())
  const startedAt = useRef<number | null>(null)
  // A throwaway board for the opening snapshot, so no ref is read while rendering.
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => initialSnapshot(new Chess()))
  const [selected, setSelected] = useState<Square | null>(null)
  const [targets, setTargets] = useState<ReadonlyMap<Square, boolean>>(EMPTY_TARGETS)
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null)

  /** Legal destinations for a square; true marks a capture. */
  const destinationsOf = useCallback((square: Square): ReadonlyMap<Square, boolean> => {
    const map = new Map<Square, boolean>()
    for (const move of chessRef.current.moves({ square, verbose: true })) {
      // En passant lands on an empty square but is still a capture.
      map.set(move.to, map.get(move.to) === true || Boolean(move.captured))
    }
    return map
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(null)
    setTargets(EMPTY_TARGETS)
  }, [])

  const commit = useCallback((move: Move) => {
    setSnapshot((current) => {
      const chess = chessRef.current
      const result = applyMove(current.pieces, move)
      const captured = result.captured
      return {
        pieces: result.pieces,
        turn: chess.turn(),
        lastMove: { from: move.from, to: move.to },
        capturedByHuman:
          captured && move.color === HUMAN
            ? [...current.capturedByHuman, captured]
            : current.capturedByHuman,
        capturedByEngine:
          captured && move.color === ENGINE
            ? [...current.capturedByEngine, captured]
            : current.capturedByEngine,
        checkPulse: chess.inCheck() ? current.checkPulse + 1 : current.checkPulse,
        outcome: outcomeOf(chess),
        elapsedMs: current.elapsedMs,
      }
    })
  }, [])

  /**
   * Plays a move that has already been validated as legal by chess.js.
   * Every move — human or engine — goes through here, so an illegal engine
   * suggestion would throw rather than reach the board.
   */
  const play = useCallback(
    (from: Square, to: Square, promotionPiece?: PieceSymbol): Move | null => {
      const chess = chessRef.current
      let move: Move
      try {
        move = chess.move({ from, to, promotion: promotionPiece })
      } catch {
        return null
      }
      if (startedAt.current === null) startedAt.current = performance.now()
      clearSelection()
      commit(move)
      return move
    },
    [clearSelection, commit],
  )

  /** One tap selects, the next tap moves. No drag and drop anywhere. */
  const selectSquare = useCallback(
    (square: Square) => {
      const chess = chessRef.current
      if (chess.isGameOver()) return

      if (selected === square) {
        clearSelection()
        return
      }

      if (selected) {
        const legal = chess
          .moves({ square: selected, verbose: true })
          .filter((move) => move.to === square)
        if (legal.length > 0) {
          if (legal.some((move) => move.isPromotion())) {
            setPromotion({ from: selected, to: square })
            return
          }
          play(selected, square)
          return
        }
      }

      const piece = chess.get(square)
      if (piece && piece.color === HUMAN && chess.turn() === HUMAN) {
        setSelected(square)
        setTargets(destinationsOf(square))
        return
      }
      clearSelection()
    },
    [clearSelection, destinationsOf, play, selected],
  )

  const choosePromotion = useCallback(
    (piece: PieceSymbol) => {
      if (!promotion) return
      const { from, to } = promotion
      setPromotion(null)
      play(from, to, piece)
    },
    [play, promotion],
  )

  const cancelPromotion = useCallback(() => {
    setPromotion(null)
    clearSelection()
  }, [clearSelection])

  /** Ending the break is never questioned and never blamed on the user. */
  const resign = useCallback(() => {
    clearSelection()
    setSnapshot((current) => ({
      ...current,
      outcome: 'encerrada',
      elapsedMs: startedAt.current === null ? 0 : performance.now() - startedAt.current,
    }))
  }, [clearSelection])

  /** Called when the game ends by a chess condition rather than by leaving. */
  const sealElapsed = useCallback(() => {
    setSnapshot((current) =>
      current.elapsedMs > 0
        ? current
        : {
            ...current,
            elapsedMs: startedAt.current === null ? 0 : performance.now() - startedAt.current,
          },
    )
  }, [])

  const reset = useCallback(() => {
    chessRef.current = new Chess()
    startedAt.current = null
    clearSelection()
    setPromotion(null)
    setSnapshot(initialSnapshot(chessRef.current))
  }, [clearSelection])

  return {
    chess: chessRef,
    ...snapshot,
    selected,
    targets,
    promotion,
    selectSquare,
    choosePromotion,
    cancelPromotion,
    play,
    resign,
    sealElapsed,
    reset,
  }
}
