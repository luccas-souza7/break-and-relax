import type { Chess, Move, Square } from 'chess.js'

import type { PecaCapturada, PecaVista } from './tipos'

/**
 * Piece identity across a game.
 *
 * The board layer is static; pieces are separate elements that keep their DOM
 * node for the whole game so a move can be tweened on one element. That only
 * works if every piece has an id that survives the move — which means the
 * piece list is updated incrementally from the move descriptor, never rebuilt
 * from the resulting position.
 *
 * The four cases that make this non-trivial:
 *   - a plain move changes one square
 *   - a capture removes a piece that sits on the destination square
 *   - en passant removes a piece that does NOT sit on the destination square
 *   - castling moves two pieces, and promotion changes a piece's type
 */

export function lerPecas(chess: Chess): PecaVista[] {
  const pecas: PecaVista[] = []
  for (const linha of chess.board()) {
    for (const casa of linha) {
      if (!casa) continue
      pecas.push({
        id: `${casa.color}${casa.type}${casa.square}`,
        cor: casa.color,
        tipo: casa.type,
        casa: casa.square,
      })
    }
  }
  return pecas
}

/** The square the captured pawn actually occupies on an en passant capture. */
function casaDaVitimaEnPassant(move: Move): Square {
  return `${move.to[0]}${move.from[1]}` as Square
}

/** Where the rook starts and ends when the king castles. */
function lanceDaTorre(move: Move): { de: Square; para: Square } | undefined {
  const fileira = move.to[1]
  if (move.isKingsideCastle()) {
    return { de: `h${fileira}` as Square, para: `f${fileira}` as Square }
  }
  if (move.isQueensideCastle()) {
    return { de: `a${fileira}` as Square, para: `d${fileira}` as Square }
  }
  return undefined
}

export type LanceAplicado = {
  pecas: PecaVista[]
  capturada?: PecaCapturada
}

export function aplicarLance(pecas: PecaVista[], move: Move): LanceAplicado {
  const casaDaVitima = move.captured
    ? move.isEnPassant()
      ? casaDaVitimaEnPassant(move)
      : move.to
    : undefined

  const torre = lanceDaTorre(move)

  let capturada: PecaCapturada | undefined
  const proximas: PecaVista[] = []

  for (const peca of pecas) {
    if (casaDaVitima && peca.casa === casaDaVitima && peca.cor !== move.color) {
      capturada = { id: peca.id, cor: peca.cor, tipo: peca.tipo }
      continue
    }

    if (peca.casa === move.from) {
      proximas.push({
        ...peca,
        casa: move.to,
        tipo: move.isPromotion() && move.promotion ? move.promotion : peca.tipo,
      })
      continue
    }

    if (torre && peca.casa === torre.de) {
      proximas.push({ ...peca, casa: torre.para })
      continue
    }

    proximas.push(peca)
  }

  return { pecas: proximas, capturada }
}
