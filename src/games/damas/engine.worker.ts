import type { PedidoBusca, RespostaBusca } from '@/types'
import { buscarLance } from './busca'
import type { EstadoDamas } from './rules'

/**
 * The draughts engine, off the main thread. Stateless: every request carries
 * the position, so the engine and the board cannot drift apart.
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

  const lance = buscarLance(pedido.estado as EstadoDamas, pedido.nivel)
  if (!lance) return

  ctx.postMessage({ tipo: 'lance', id: pedido.id, lance })
})
