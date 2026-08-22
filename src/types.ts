import type { ComponentType } from 'react'

/**
 * The contract between the shell and a game.
 *
 * The shell renders three screens, keeps time, talks to a worker and writes
 * the ending on screen — and knows nothing about chess, draughts or dominoes
 * while doing it. Nothing under `src/shell/` may import from
 * `src/games/<id>/rules.ts`; everything it needs arrives through here.
 *
 * If the shell ever needs to know what a king is, this interface is wrong.
 */

export type IdJogo = 'xadrez' | 'damas' | 'domino'

export type Nivel = 'tranquilo' | 'normal' | 'desafio'

export type Resultado = 'vitoria' | 'derrota' | 'empate' | 'encerrada'

/**
 * A place worth looking at once the game is over: a square, or the id of a
 * domino. The shell paints it and never asks what it means.
 *
 * `decisivo`  — answers "why did it end": the mated king, the last tile down.
 * `atacante`  — what carried the ending out.
 * `bloqueado` — where the loser could not go. This is the one that makes a
 *               mate or a stalemate make sense to someone staring at it.
 */
export type Destaque = {
  chave: string
  tipo: 'decisivo' | 'atacante' | 'bloqueado'
}

/** How it ended, in words the loser can read. Filled with real detail. */
export type Desfecho = {
  resultado: Resultado
  /** "Xeque-mate", "Empate por afogamento", "Jogo trancado". */
  titulo: string
  /** One or two sentences of plain Portuguese. No jargon left unexplained. */
  explicacao: string
  destaques: Destaque[]
}

/**
 * Props every game's board gets. Selecting a piece, choosing a promotion or
 * picking which end of the line to play on are all the game's business: it
 * hands back a finished move and nothing else.
 */
export type PropsTabuleiro<Estado, Lance> = {
  estado: Estado
  lancesLegais: Lance[]
  interativo: boolean
  /** Empty while the game is running. */
  destaques: Destaque[]
  onLance: (lance: Lance) => void
  /** Changes when a new game starts, for entrance animations. */
  entranceKey: number
}

/** Side content: the captured tray, the machine's revealed hand. */
export type PropsLateral<Estado> = {
  estado: Estado
  fim: boolean
}

export type Jogo<Estado, Lance> = {
  id: IdJogo
  nome: string

  criarEstado(): Estado
  lancesLegais(e: Estado): Lance[]
  aplicar(e: Estado, l: Lance): Estado
  /**
   * The user ended the break. Always available, never questioned, and never
   * able to overwrite a game that already finished on its own.
   */
  encerrar(e: Estado): Estado
  vezDe(e: Estado): 'humano' | 'maquina'
  /** null while the game is still going. */
  avaliarFim(e: Estado): Desfecho | null
  /** Readable notation, newest last. The shell shows only the tail. */
  historico(e: Estado): string[]

  /**
   * What the worker needs to search from. The shell forwards it without
   * looking inside; only the game and its own worker know the shape.
   */
  serializar(e: Estado): unknown
  /** Turns the worker's answer back into a move this state understands. */
  desserializarLance(e: Estado, bruto: unknown): Lance | null

  Tabuleiro: ComponentType<PropsTabuleiro<Estado, Lance>>
  Lateral?: ComponentType<PropsLateral<Estado>>
  criarWorker(): Worker
}

/** Any game, once the shell stops caring about its type parameters. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JogoQualquer = Jogo<any, any>

/* ---- worker protocol, shared by every game ---- */

export type PedidoBusca = {
  tipo: 'buscar'
  /** Echoed back, so an answer for a position already left behind is dropped. */
  id: number
  estado: unknown
  nivel: Nivel
}

export type RespostaBusca = {
  tipo: 'lance'
  id: number
  lance: unknown
}

/**
 * The machine never answers instantly, even when it could. A reply that lands
 * in ten milliseconds reads as a bug and breaks the rhythm of the break.
 */
export const ESPERA_MINIMA_MS = 350
