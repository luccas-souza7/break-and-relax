import { useCallback, useEffect, useRef, useState } from 'react'

// Inlined rather than emitted as its own file: a separate worker script is
// fetched, and a fetch from a page opened off the disk is blocked outright.
import EngineWorker from './engine.worker.ts?worker&inline'
import { MIN_REPLY_MS } from './protocol'
import type { EngineRequest, EngineResponse } from './protocol'
import type { Level } from '@/game/types'

type Pending = {
  id: number
  settle: (response: EngineResponse | null) => void
}

/**
 * Talks to the engine worker.
 *
 * Two things matter here. The worker is created once and reused, so no game
 * ever pays for a cold start; and the answer is always held back to at least
 * MIN_REPLY_MS, because a reply that arrives instantly reads as a glitch.
 */
export function useEngine() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const nextId = useRef(0)
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    const worker = new EngineWorker()
    workerRef.current = worker

    worker.addEventListener('message', (event: MessageEvent<EngineResponse>) => {
      const pending = pendingRef.current
      // A reply for a game that has already moved on is simply dropped.
      if (!pending || event.data.id !== pending.id) return
      pendingRef.current = null
      pending.settle(event.data)
    })

    return () => {
      pendingRef.current?.settle(null)
      pendingRef.current = null
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const think = useCallback(
    async (fen: string, level: Level): Promise<EngineResponse | null> => {
      const worker = workerRef.current
      if (!worker) return null

      pendingRef.current?.settle(null)
      const id = ++nextId.current
      setThinking(true)

      const startedAt = performance.now()
      const answer = await new Promise<EngineResponse | null>((resolve) => {
        pendingRef.current = { id, settle: resolve }
        const request: EngineRequest = { type: 'search', id, fen, level }
        worker.postMessage(request)
      })

      const remaining = MIN_REPLY_MS - (performance.now() - startedAt)
      if (answer && remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      setThinking(false)
      return answer
    },
    [],
  )

  /** Drops whatever the engine was working on, without stopping the worker. */
  const forget = useCallback(() => {
    pendingRef.current?.settle(null)
    pendingRef.current = null
    setThinking(false)
  }, [])

  return { think, forget, thinking }
}
