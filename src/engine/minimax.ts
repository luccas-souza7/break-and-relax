/**
 * Minimax with alpha-beta pruning, shared by chess and draughts.
 *
 * The time budget is a hard wall. When it runs out mid-iteration the whole
 * iteration is discarded and the answer comes from the last depth that
 * actually finished — a half-searched depth plays worse than a shallower
 * complete one.
 *
 * Moves are made and unmade on a single mutable position rather than through
 * an immutable `aplicar`. That is deliberate: chess.js measures about 70us to
 * generate moves for a position, and cloning the position at every node would
 * cost more than the search itself. The pure `aplicar` in the game contract
 * still exists — it is what the interface uses to advance React state.
 */

class SemTempo extends Error {}

/** Checking the clock at every node costs more than it saves. */
const INTERVALO_RELOGIO = 63

export type Busca<E, L> = {
  estado: E
  /** Legal moves in the current position, best guesses first if cheap. */
  lances: (e: E) => L[]
  fazer: (e: E, l: L) => void
  desfazer: (e: E) => void
  /**
   * Score from the point of view of the side to move. Receives the move count
   * already generated for this node so it never has to generate them again.
   */
  avaliar: (e: E, quantidadeDeLances: number) => number
  /**
   * Terminal score when there are no legal moves, from the side to move's
   * point of view — a loss is hugely negative. `ply` lets a nearer mate score
   * better than a distant one.
   */
  semLances: (e: E, ply: number) => number
  /** True when the position is drawn by rule regardless of moves available. */
  empatado?: (e: E) => boolean
  /** Higher sorts first. Captures before quiet moves. */
  ordem?: (l: L) => number
  /** Extend over captures at the horizon until the position is quiet. */
  quiescencia?: { ativa: boolean; ehCaptura: (l: L) => boolean; maxPly: number }
  profundidadeMax: number
  tetoMs: number
  /** Above one, the pick is random among the best, with descending weight. */
  escolhas: number
}

type Contexto<E, L> = Busca<E, L> & { prazo: number; nos: number }

function tique<E, L>(c: Contexto<E, L>): void {
  c.nos++
  if ((c.nos & INTERVALO_RELOGIO) === 0 && performance.now() >= c.prazo) {
    throw new SemTempo()
  }
}

function ordenar<E, L>(c: Contexto<E, L>, lances: L[]): L[] {
  return c.ordem ? lances.sort((a, b) => c.ordem!(b) - c.ordem!(a)) : lances
}

function quiescente<E, L>(c: Contexto<E, L>, alfa: number, beta: number, ply: number): number {
  tique(c)

  const lances = c.lances(c.estado)
  if (lances.length === 0) return c.semLances(c.estado, ply)
  if (c.empatado?.(c.estado)) return 0

  const parado = c.avaliar(c.estado, lances.length)
  const q = c.quiescencia!
  if (ply >= q.maxPly) return parado
  if (parado >= beta) return beta
  if (parado > alfa) alfa = parado

  for (const lance of ordenar(c, lances.filter(q.ehCaptura))) {
    c.fazer(c.estado, lance)
    const nota = -quiescente(c, -beta, -alfa, ply + 1)
    c.desfazer(c.estado)
    if (nota >= beta) return beta
    if (nota > alfa) alfa = nota
  }
  return alfa
}

function negamax<E, L>(
  c: Contexto<E, L>,
  profundidade: number,
  alfa: number,
  beta: number,
  ply: number,
): number {
  tique(c)

  const lances = c.lances(c.estado)
  if (lances.length === 0) return c.semLances(c.estado, ply)
  if (c.empatado?.(c.estado)) return 0

  if (profundidade <= 0) {
    return c.quiescencia?.ativa
      ? quiescente(c, alfa, beta, 0)
      : c.avaliar(c.estado, lances.length)
  }

  let melhor = alfa
  for (const lance of ordenar(c, lances)) {
    c.fazer(c.estado, lance)
    const nota = -negamax(c, profundidade - 1, -beta, -melhor, ply + 1)
    c.desfazer(c.estado)
    if (nota >= beta) return beta
    if (nota > melhor) melhor = nota
  }
  return melhor
}

type Candidato<L> = { lance: L; nota: number }

/** Descending weights, so the best move is still the likeliest one. */
function sorteioPonderado<L>(pool: Candidato<L>[]): Candidato<L> {
  const pesos = pool.map((_, i) => pool.length - i)
  const total = pesos.reduce((s, p) => s + p, 0)
  let bilhete = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    bilhete -= pesos[i]
    if (bilhete <= 0) return pool[i]
  }
  return pool[0]
}

export type ResultadoBusca<L> = {
  lance: L
  nota: number
  /** Plies fully searched. Never reports an abandoned iteration. */
  profundidade: number
  nos: number
}

export function buscar<E, L>(opcoes: Busca<E, L>): ResultadoBusca<L> | null {
  const c: Contexto<E, L> = {
    ...opcoes,
    prazo: performance.now() + opcoes.tetoMs,
    nos: 0,
  }

  const raiz = c.lances(c.estado)
  if (raiz.length === 0) return null

  let candidatos: Candidato<L>[] = ordenar(c, raiz).map((lance) => ({ lance, nota: 0 }))
  let profundidadeConcluida = 0

  for (let profundidade = 1; profundidade <= c.profundidadeMax; profundidade++) {
    try {
      const notas: Candidato<L>[] = []
      let alfa = -Infinity
      for (const { lance } of candidatos) {
        c.fazer(c.estado, lance)
        const nota = -negamax(c, profundidade - 1, -Infinity, -alfa, 1)
        c.desfazer(c.estado)
        notas.push({ lance, nota })
        /* Narrowing the root window is only safe when a single move is
           chosen; a weighted pick needs every root score comparable. */
        if (c.escolhas === 1 && nota > alfa) alfa = nota
      }
      // A stable sort keeps the previous order among equals, which is what
      // makes iterative deepening improve the ordering.
      notas.sort((a, b) => b.nota - a.nota)
      candidatos = notas
      profundidadeConcluida = profundidade
    } catch (erro) {
      if (erro instanceof SemTempo) break
      throw erro
    }
  }

  const pool = candidatos.slice(0, Math.max(1, c.escolhas))
  const escolhido = pool.length > 1 ? sorteioPonderado(pool) : candidatos[0]

  return {
    lance: escolhido.lance,
    nota: escolhido.nota,
    profundidade: profundidadeConcluida,
    nos: c.nos,
  }
}
