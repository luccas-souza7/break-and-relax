import type { Nivel } from '@/types'
import {
  ehCarroca,
  pontas,
  pontos,
  somaDaMao,
  type LanceDomino,
  type Pedra,
  type Ponta,
  type VistaDaMaquina,
} from './rules'

/**
 * The machine's dominoes play.
 *
 * There is no minimax here and there should not be: dominoes is a game of
 * hidden information, and a tree search over a position it cannot see would
 * be theatre. What follows is an explicit heuristic, stated per level.
 */

export const TETO_MS = 400

type Candidato = { lance: LanceDomino; pedra: Pedra; ponta: Ponta }

function candidatos(vista: VistaDaMaquina): Candidato[] {
  const extremos = pontas(vista.mesa)
  const saidas: Candidato[] = []
  for (const pedra of vista.mao) {
    if (!extremos) {
      saidas.push({ lance: { tipo: 'jogar', pedra: pedra.id, ponta: 'direita' }, pedra, ponta: 'direita' })
      continue
    }
    if (pedra.a === extremos.esquerda || pedra.b === extremos.esquerda) {
      saidas.push({ lance: { tipo: 'jogar', pedra: pedra.id, ponta: 'esquerda' }, pedra, ponta: 'esquerda' })
    }
    if (pedra.a === extremos.direita || pedra.b === extremos.direita) {
      saidas.push({ lance: { tipo: 'jogar', pedra: pedra.id, ponta: 'direita' }, pedra, ponta: 'direita' })
    }
  }
  return saidas
}

/** The number left showing after this stone is laid on that end. */
function numeroAberto(vista: VistaDaMaquina, candidato: Candidato): number {
  const extremos = pontas(vista.mesa)
  if (!extremos) return candidato.pedra.b
  const encostado =
    candidato.ponta === 'esquerda' ? extremos.esquerda : extremos.direita
  return candidato.pedra.a === encostado ? candidato.pedra.b : candidato.pedra.a
}

/** How many different numbers the hand still covers once this stone is gone. */
function varidadeRestante(vista: VistaDaMaquina, candidato: Candidato): number {
  const resto = vista.mao.filter((p) => p.id !== candidato.pedra.id)
  return new Set(resto.flatMap((p) => [p.a, p.b])).size
}

const sortear = <T,>(lista: T[]): T => lista[(Math.random() * lista.length) | 0]

function pontuar(vista: VistaDaMaquina, candidato: Candidato, nivel: Nivel): number {
  let nota = 0

  // Doubles are dead weight later on, so they go down early.
  const cedo = vista.mesa.length <= 6
  if (ehCarroca(candidato.pedra)) nota += cedo ? 60 : 15

  // Otherwise shed weight.
  nota += pontos(candidato.pedra)

  // Keeping several different numbers covered is what stops a lock.
  nota += varidadeRestante(vista, candidato) * 4

  if (nivel === 'desafio') {
    const aberto = numeroAberto(vista, candidato)
    const usuarioNaoTem = vista.passouEm.includes(aberto)
    /*
     * The user has shown they cannot play these numbers. With the boneyard
     * empty and the count in our favour, leaving one showing is how the game
     * gets locked while we are ahead. Otherwise it is avoided: locking from
     * behind hands the win over.
     */
    if (usuarioNaoTem) {
      const podeTrancar = vista.dorme === 0
      const naFrente = somaDaMao(vista.mao) < vista.pedrasDoHumano * 6
      nota += podeTrancar && naFrente ? 80 : -40
    }
  }

  return nota
}

export function escolherLance(vista: VistaDaMaquina, nivel: Nivel): LanceDomino {
  const opcoes = candidatos(vista)

  if (opcoes.length === 0) {
    return vista.dorme > 0 ? { tipo: 'comprar' } : { tipo: 'passar' }
  }

  if (nivel === 'tranquilo') return sortear(opcoes).lance

  let melhor = opcoes[0]
  let melhorNota = -Infinity
  for (const candidato of opcoes) {
    const nota = pontuar(vista, candidato, nivel)
    if (nota > melhorNota) {
      melhorNota = nota
      melhor = candidato
    }
  }
  return melhor.lance
}
