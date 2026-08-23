import { Chess } from 'chess.js'
import type { Color, Move, Square } from 'chess.js'

import type { Desfecho } from '@/types'
import { ENCERRADA, avaliarFim as lerDesfecho } from './outcome'
import { aplicarLance, lerPecas } from './pieceTracker'
import type { LanceXadrez, PecaCapturada, PecaVista } from './tipos'

export type { LanceXadrez, PecaCapturada, PecaVista }

/**
 * Chess rules. Pure TypeScript: no React, no DOM, no window. This is the
 * file the worker imports, and the only place chess.js is consulted.
 *
 * Every rule comes from chess.js: castling, en passant, promotion, check,
 * checkmate, stalemate, threefold repetition and the fifty-move rule are
 * never re-implemented here.
 */

/** The user is always White. That decision is not exposed anywhere. */
export const HUMANO: Color = 'w'
export const MAQUINA: Color = 'b'

/**
 * The state the interface holds.
 *
 * `chess` is a live object and `aplicar` advances it in place, returning a
 * fresh wrapper so React sees a new reference. Cloning it per move would be
 * both slower and wrong: threefold repetition and the fifty-move rule need
 * the game's history, which a FEN does not carry. Nothing here keeps an
 * earlier state (there is no undo and no time travel), so sharing is safe.
 */
export type EstadoXadrez = {
  readonly chess: Chess
  readonly versao: number
  readonly pecas: PecaVista[]
  readonly capturadasPeloHumano: PecaCapturada[]
  readonly capturadasPelaMaquina: PecaCapturada[]
  readonly ultimoLance: { de: Square; para: Square } | null
  /** Increments on every check, so the board can pulse exactly once. */
  readonly xeques: number
  readonly encerradaPeloUsuario: boolean
}

export function criarEstado(): EstadoXadrez {
  const chess = new Chess()
  return {
    chess,
    versao: 0,
    pecas: lerPecas(chess),
    capturadasPeloHumano: [],
    capturadasPelaMaquina: [],
    ultimoLance: null,
    xeques: 0,
    encerradaPeloUsuario: false,
  }
}

export function lancesLegais(e: EstadoXadrez): LanceXadrez[] {
  if (e.encerradaPeloUsuario || e.chess.isGameOver()) return []
  return e.chess.moves({ verbose: true }).map((m) => ({
    de: m.from,
    para: m.to,
    promocao: m.promotion,
    captura: m.captured !== undefined,
  }))
}

export function aplicar(e: EstadoXadrez, lance: LanceXadrez): EstadoXadrez {
  let move: Move
  try {
    move = e.chess.move({ from: lance.de, to: lance.para, promotion: lance.promocao })
  } catch {
    // An illegal move never reaches the board; the state is returned untouched.
    return e
  }

  const resultado = aplicarLance(e.pecas, move)
  const capturada = resultado.capturada

  return {
    ...e,
    versao: e.versao + 1,
    pecas: resultado.pecas,
    capturadasPeloHumano:
      capturada && move.color === HUMANO
        ? [...e.capturadasPeloHumano, capturada]
        : e.capturadasPeloHumano,
    capturadasPelaMaquina:
      capturada && move.color === MAQUINA
        ? [...e.capturadasPelaMaquina, capturada]
        : e.capturadasPelaMaquina,
    ultimoLance: { de: move.from, para: move.to },
    xeques: e.chess.inCheck() ? e.xeques + 1 : e.xeques,
  }
}

/** Ending the break is never questioned and never blamed on the user. */
export function encerrar(e: EstadoXadrez): EstadoXadrez {
  if (e.encerradaPeloUsuario || e.chess.isGameOver()) return e
  return { ...e, versao: e.versao + 1, encerradaPeloUsuario: true }
}

export function vezDe(e: EstadoXadrez): 'humano' | 'maquina' {
  return e.chess.turn() === HUMANO ? 'humano' : 'maquina'
}

export function avaliarFim(e: EstadoXadrez): Desfecho | null {
  if (e.encerradaPeloUsuario) return ENCERRADA
  return lerDesfecho(e.chess)
}

/** The worker only needs the position. */
export function serializar(e: EstadoXadrez): string {
  return e.chess.fen()
}

export function desserializarLance(e: EstadoXadrez, bruto: unknown): LanceXadrez | null {
  const lance = bruto as LanceXadrez | null
  if (!lance || typeof lance.de !== 'string' || typeof lance.para !== 'string') return null
  // Only a move the position actually allows is handed back.
  return lancesLegais(e).some(
    (l) => l.de === lance.de && l.para === lance.para && l.promocao === lance.promocao,
  )
    ? lance
    : null
}
