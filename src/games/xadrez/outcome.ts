import type { Chess, Color, Square } from 'chess.js'

import type { Desfecho, Destaque } from '@/types'
import { colOf, rowOf, squareAt } from './board'
import { nomeDaPeca } from './nomes'

/**
 * Turns a finished position into something a person can read.
 *
 * Every sentence is filled with the real squares and the real pieces — a
 * generic "you lost" is exactly what this screen exists to replace. The
 * player should be able to look at the board and see why it ended.
 */

const HUMAN: Color = 'w'

function kingSquare(chess: Chess, color: Color): Square | null {
  return chess.findPiece({ type: 'k', color })[0] ?? null
}

/**
 * The squares around the king that are not blocked by his own men. On a mate
 * or a stalemate every one of them is covered by the opponent — that is what
 * makes it a mate or a stalemate — so they all light up as unavailable.
 */
function escapeSquares(chess: Chess, king: Square, color: Color): Square[] {
  const row = rowOf(king)
  const col = colOf(king)
  const out: Square[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r < 0 || r > 7 || c < 0 || c > 7) continue
      const square = squareAt(r, c)
      const piece = chess.get(square)
      if (piece && piece.color === color) continue
      out.push(square)
    }
  }
  return out
}

function blocked(squares: Square[]): Destaque[] {
  return squares.map((chave) => ({ chave, tipo: 'bloqueado' as const }))
}

/** Reads the position after the losing side has run out of moves. */
function mate(chess: Chess): Desfecho {
  const loser = chess.turn()
  const winner: Color = loser === 'w' ? 'b' : 'w'
  const king = kingSquare(chess, loser)

  const destaques: Destaque[] = []
  let atacante = ''
  let casaAtacante = ''

  if (king) {
    destaques.push({ chave: king, tipo: 'decisivo' })
    destaques.push(...blocked(escapeSquares(chess, king, loser)))

    // chess.js hands us the attackers directly, so the sentence names the
    // piece that actually did it rather than a guess.
    for (const square of chess.attackers(king, winner)) {
      destaques.push({ chave: square, tipo: 'atacante' })
      if (!atacante) {
        const piece = chess.get(square)
        if (piece) {
          atacante = nomeDaPeca(piece.color, piece.type)
          casaAtacante = square
        }
      }
    }
  }

  const humanLost = loser === HUMAN
  return {
    resultado: humanLost ? 'derrota' : 'vitoria',
    titulo: 'Xeque-mate',
    explicacao: humanLost
      ? `Seu rei em ${king} está atacado por ${atacante} em ${casaAtacante}. As casas de fuga estão marcadas — todas cobertas.`
      : `O rei da máquina em ${king} está atacado por ${atacante} em ${casaAtacante} e não tem para onde ir, nem como bloquear ou capturar.`,
    destaques,
  }
}

function stalemate(chess: Chess): Desfecho {
  const stuck = chess.turn()
  const king = kingSquare(chess, stuck)
  const destaques: Destaque[] = []
  if (king) {
    destaques.push({ chave: king, tipo: 'decisivo' })
    destaques.push(...blocked(escapeSquares(chess, king, stuck)))
  }
  return {
    resultado: 'empate',
    titulo: 'Empate por afogamento',
    explicacao:
      'Não era xeque, mas você não tinha nenhum lance legal. Quando isso acontece, a partida termina empatada em vez de perdida.',
    destaques,
  }
}

const EMPATES: Record<string, { titulo: string; explicacao: string }> = {
  repeticao: {
    titulo: 'Empate por repetição',
    explicacao:
      'A mesma posição apareceu três vezes na partida, com as mesmas peças podendo fazer os mesmos lances.',
  },
  cinquenta: {
    titulo: 'Empate pela regra dos 50 lances',
    explicacao:
      'Passaram 50 lances de cada lado sem nenhuma captura e sem nenhum peão andar. A regra encerra a partida em empate.',
  },
  material: {
    titulo: 'Empate por material insuficiente',
    explicacao: 'Não sobrou peça suficiente no tabuleiro para nenhum dos dois dar mate.',
  },
}

/** The one ending that is not read off the board. */
export const ENCERRADA: Desfecho = {
  resultado: 'encerrada',
  titulo: 'Encerrada',
  explicacao: 'A pausa era esse tempo mesmo.',
  destaques: [],
}

/** null while the game is still going. Every rule comes from chess.js. */
export function avaliarFim(chess: Chess): Desfecho | null {
  if (chess.isCheckmate()) return mate(chess)
  if (chess.isStalemate()) return stalemate(chess)

  // Order matters only for which sentence gets shown; any of them ends it.
  if (chess.isInsufficientMaterial()) {
    return { resultado: 'empate', ...EMPATES.material, destaques: [] }
  }
  if (chess.isThreefoldRepetition()) {
    return { resultado: 'empate', ...EMPATES.repeticao, destaques: [] }
  }
  if (chess.isDrawByFiftyMoves()) {
    return { resultado: 'empate', ...EMPATES.cinquenta, destaques: [] }
  }
  if (chess.isGameOver()) {
    return { resultado: 'empate', ...EMPATES.material, destaques: [] }
  }
  return null
}
