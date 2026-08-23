import type { Chess, Color, PieceSymbol, Square } from 'chess.js'

/**
 * chess.js's own move generator, reached without its presentation layer.
 *
 * Why this exists: the public `moves({ verbose: true })` builds a `Move`
 * object per move, and each one regenerates the whole legal move list to
 * disambiguate SAN and serialises two FENs for `before`/`after`. Measured on
 * a middlegame position that is ~3000us per call against ~70us for the
 * generator underneath it: a 40x tax that makes any real search impossible.
 *
 * So the search calls the generator directly. The rules are still entirely
 * chess.js's: this file adds no move generation of its own, it only skips the
 * SAN and FEN formatting that a search never looks at. Everything the user
 * touches still goes through the public API.
 *
 * The list `_moves({ legal: true })` returns was verified to match
 * `moves({ verbose: true })` exactly, and `_makeMove`/`_undoMove` were
 * verified to restore the position over hundreds of plies.
 */

export type LanceInterno = {
  color: Color
  from: number
  to: number
  piece: PieceSymbol
  captured?: PieceSymbol
  promotion?: PieceSymbol
  flags: number
}

type ChessInterno = {
  _moves(options?: { legal?: boolean; piece?: PieceSymbol; square?: Square }): LanceInterno[]
  _makeMove(move: LanceInterno): void
  _undoMove(): LanceInterno | null
}

export function internos(chess: Chess): ChessInterno {
  return chess as unknown as ChessInterno
}

/** 0x88 square index to algebraic notation. */
export function algebraic(square: number): Square {
  return ('abcdefgh'[square & 15] + String(8 - (square >> 4))) as Square
}

/** 0x88 square index to a row-major index where 0 is a8, the table layout. */
export function tableIndex(square: number): number {
  return (square >> 4) * 8 + (square & 15)
}
