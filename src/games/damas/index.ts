import type { Jogo } from '@/types'
import { Bandeja } from './Bandeja'
import { Tabuleiro } from './Tabuleiro'
import {
  aplicar,
  avaliarFim,
  criarEstado,
  desserializarLance,
  encerrar,
  lancesLegais,
  serializar,
  vezDe,
  type EstadoDamas,
  type LanceDamas,
} from './rules'

/** All of draughts, as the shell sees it. */
export const damas: Jogo<EstadoDamas, LanceDamas> = {
  id: 'damas',
  nome: 'Damas',
  criarEstado,
  lancesLegais,
  aplicar,
  encerrar,
  vezDe,
  avaliarFim,
  serializar,
  desserializarLance,
  Tabuleiro,
  Lateral: Bandeja,
  criarWorker: () =>
    new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }),
}

export default damas
