import { LEVELS } from './protocol'
import type { EngineRequest, EngineResponse } from './protocol'
import { search } from './search'

/**
 * The engine runs here, off the main thread, so the interface stays
 * responsive no matter how long the search takes. The worker is stateless:
 * every request carries the position, which makes it impossible for the
 * engine and the board to drift apart.
 */

const ctx = self as unknown as {
  postMessage(message: EngineResponse): void
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<EngineRequest>) => void,
  ): void
}

ctx.addEventListener('message', (event) => {
  const request = event.data
  if (!request || request.type !== 'search') return

  const result = search(request.fen, LEVELS[request.level])
  if (!result) return

  ctx.postMessage({
    type: 'bestmove',
    id: request.id,
    from: result.from,
    to: result.to,
    promotion: result.promotion,
    depth: result.depth,
  })
})
