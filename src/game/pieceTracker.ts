import type { Chess, Move, Square } from 'chess.js'

import type { CapturedPiece, PieceView } from './types'

/**
 * Piece identity across a game.
 *
 * The board layer is static; pieces are separate elements that keep their
 * DOM node for the whole game so a move can be tweened on one element.
 * That only works if every piece has an id that survives the move — which
 * means the piece list is updated incrementally from the move descriptor,
 * never rebuilt from the resulting position.
 *
 * The four cases that make this non-trivial:
 *   - a plain move changes one square
 *   - a capture removes a piece that sits on the destination square
 *   - en passant removes a piece that does NOT sit on the destination square
 *   - castling moves two pieces, and promotion changes a piece's type
 */

export function readPieces(chess: Chess): PieceView[] {
  const pieces: PieceView[] = []
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue
      pieces.push({
        id: `${cell.color}${cell.type}${cell.square}`,
        color: cell.color,
        type: cell.type,
        square: cell.square,
      })
    }
  }
  return pieces
}

/** The square the captured pawn actually occupies on an en passant capture. */
function enPassantVictimSquare(move: Move): Square {
  return `${move.to[0]}${move.from[1]}` as Square
}

/** Where the rook starts and ends when the king castles. */
function castlingRookMove(move: Move): { from: Square; to: Square } | undefined {
  const rank = move.to[1]
  if (move.isKingsideCastle()) {
    return { from: `h${rank}` as Square, to: `f${rank}` as Square }
  }
  if (move.isQueensideCastle()) {
    return { from: `a${rank}` as Square, to: `d${rank}` as Square }
  }
  return undefined
}

export type AppliedMove = {
  pieces: PieceView[]
  captured?: CapturedPiece
  /** Ids that changed square, so the animation layer knows what to tween. */
  movedIds: string[]
}

export function applyMove(pieces: PieceView[], move: Move): AppliedMove {
  const victimSquare = move.captured
    ? move.isEnPassant()
      ? enPassantVictimSquare(move)
      : move.to
    : undefined

  const rookMove = castlingRookMove(move)

  let captured: CapturedPiece | undefined
  const movedIds: string[] = []

  const next: PieceView[] = []
  for (const piece of pieces) {
    if (victimSquare && piece.square === victimSquare && piece.color !== move.color) {
      captured = { id: piece.id, color: piece.color, type: piece.type }
      continue
    }

    if (piece.square === move.from) {
      movedIds.push(piece.id)
      next.push({
        ...piece,
        square: move.to,
        type: move.isPromotion() && move.promotion ? move.promotion : piece.type,
      })
      continue
    }

    if (rookMove && piece.square === rookMove.from) {
      movedIds.push(piece.id)
      next.push({ ...piece, square: rookMove.to })
      continue
    }

    next.push(piece)
  }

  return { pieces: next, captured, movedIds }
}
