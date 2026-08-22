import type { Jogo } from '@/types'
import { Bandeja } from './Bandeja'
import { Tabuleiro } from './Tabuleiro'
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
  type EstadoXadrez,
  type LanceXadrez,
} from './rules'

/**
 * The whole of chess, as the shell sees it. Nothing outside this file is
 * imported by `src/shell/`.
 */
export const xadrez: Jogo<EstadoXadrez, LanceXadrez> = {
  id: 'xadrez',
  nome: 'Xadrez',
  criarEstado,
  lancesLegais,
  aplicar,
  encerrar,
  vezDe,
  avaliarFim,
  historico,
  serializar,
  desserializarLance,
  Tabuleiro,
  Lateral: Bandeja,
  criarWorker: () =>
    new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }),
}

export default xadrez
