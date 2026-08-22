import type { Jogo } from '@/types'
import { MaoDaMaquina } from './MaoDaMaquina'
import { Mesa } from './Mesa'
import {
  aplicar,
  avaliarFim,
  criarEstado,
  desserializarLance,
  encerrar,
  historico,
  lancesLegais,
  serializar,
  vezDe,
  type EstadoDomino,
  type LanceDomino,
} from './rules'

/** All of dominoes, as the shell sees it. */
export const domino: Jogo<EstadoDomino, LanceDomino> = {
  id: 'domino',
  nome: 'Dominó',
  criarEstado,
  lancesLegais,
  aplicar,
  encerrar,
  vezDe,
  avaliarFim,
  historico,
  serializar,
  desserializarLance,
  Tabuleiro: Mesa,
  Lateral: MaoDaMaquina,
  criarWorker: () =>
    new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }),
}

export default domino
