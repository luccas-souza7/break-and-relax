import type { Color, PieceSymbol, Square } from 'chess.js'

/** A piece with an identity that survives the whole game. */
export type PecaVista = {
  id: string
  cor: Color
  tipo: PieceSymbol
  casa: Square
}

/** A captured piece, for the tray. Order of capture is preserved. */
export type PecaCapturada = {
  id: string
  cor: Color
  tipo: PieceSymbol
}

export type LanceXadrez = {
  de: Square
  para: Square
  promocao?: PieceSymbol
  /**
   * Set by the rules, not guessed by the board. En passant lands on an empty
   * square and is still a capture, which is exactly the case a "is something
   * standing there?" check gets wrong.
   */
  captura: boolean
}
