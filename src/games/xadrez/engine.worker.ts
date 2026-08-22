import type { PedidoBusca, RespostaBusca } from '@/types'
import { buscarLance } from './busca'

/**
 * The chess engine, off the main thread so the interface stays responsive no
 * matter how long the search takes.
 *
 * Stateless by design: every request carries the position, which makes it
 * impossible for the engine and the board to drift apart.
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

  const lance = buscarLance(String(pedido.estado), pedido.nivel)
  if (!lance) return

  ctx.postMessage({ tipo: 'lance', id: pedido.id, lance })
})
