import { useCallback, useEffect, useRef, useState } from 'react'

import { ESPERA_MINIMA_MS } from '@/types'
import type { JogoQualquer, Nivel, PedidoBusca, RespostaBusca } from '@/types'

type Pendente = {
  id: number
  resolver: (resposta: RespostaBusca | null) => void
}

/**
 * Talks to whichever game's worker is currently loaded.
 *
 * The worker is created when the match starts and terminated when it is left,
 * so nothing keeps running behind an idle start screen. The answer is always
 * held back to at least ESPERA_MINIMA_MS — a reply that arrives instantly
 * reads as a glitch and breaks the rhythm of the break.
 */
export function useMaquina(jogo: JogoQualquer | null) {
  const workerRef = useRef<Worker | null>(null)
  const pendenteRef = useRef<Pendente | null>(null)
  const proximoId = useRef(0)
  const [pensando, setPensando] = useState(false)

  useEffect(() => {
    if (!jogo) return

    const worker = jogo.criarWorker()
    workerRef.current = worker

    worker.addEventListener('message', (evento: MessageEvent<RespostaBusca>) => {
      const pendente = pendenteRef.current
      // An answer for a position already left behind is simply dropped.
      if (!pendente || evento.data.id !== pendente.id) return
      pendenteRef.current = null
      pendente.resolver(evento.data)
    })

    return () => {
      pendenteRef.current?.resolver(null)
      pendenteRef.current = null
      worker.terminate()
      workerRef.current = null
      setPensando(false)
    }
  }, [jogo])

  const pensar = useCallback(
    async (estadoSerializado: unknown, nivel: Nivel): Promise<unknown | null> => {
      const worker = workerRef.current
      if (!worker) return null

      pendenteRef.current?.resolver(null)
      const id = ++proximoId.current
      setPensando(true)

      const inicio = performance.now()
      const resposta = await new Promise<RespostaBusca | null>((resolver) => {
        pendenteRef.current = { id, resolver }
        const pedido: PedidoBusca = { tipo: 'buscar', id, estado: estadoSerializado, nivel }
        worker.postMessage(pedido)
      })

      const restante = ESPERA_MINIMA_MS - (performance.now() - inicio)
      if (resposta && restante > 0) {
        await new Promise((r) => setTimeout(r, restante))
      }

      setPensando(false)
      return resposta ? resposta.lance : null
    },
    [],
  )

  /** Drops whatever the machine was working on, without stopping the worker. */
  const esquecer = useCallback(() => {
    pendenteRef.current?.resolver(null)
    pendenteRef.current = null
    setPensando(false)
  }, [])

  return { pensar, esquecer, pensando }
}
