import type { PedidoBusca, RespostaBusca } from '@/types'
import { escolherLance } from './heuristica'
import type { VistaDaMaquina } from './rules'

/**
 * The dominoes player, off the main thread for consistency with the other
 * games. It only ever sees what a player could see: the table, its own hand,
 * how many stones the user holds and how big the boneyard is.
 */

const ctx = self as unknown as {
  postMessage(mensagem: RespostaBusca): void
  addEventListener(
    tipo: 'message',
    ouvinte: (evento: MessageEvent<PedidoBusca>) => void,
  ): void
}

ctx.addEventListener('message', (evento) => {
  const pedido = evento.data
  if (!pedido || pedido.tipo !== 'buscar') return
  const lance = escolherLance(pedido.estado as VistaDaMaquina, pedido.nivel)
  ctx.postMessage({ tipo: 'lance', id: pedido.id, lance })
})
