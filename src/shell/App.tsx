import { useCallback, useEffect, useRef, useState } from 'react'

import { gsap, prefersReducedMotion } from '@/anim/motion'
import type { Desfecho, IdJogo, JogoQualquer, Nivel } from '@/types'
import { TelaInicio } from './TelaInicio'
import { useMaquina } from './useMaquina'
import { TelaPartida } from './TelaPartida'

/**
 * Two screens, one page, no router.
 *
 * The shell keeps time, drives the machine and writes the ending on screen
 * without knowing which game is being played: everything it needs arrives
 * through the `Jogo` contract. The end of a game is not a third screen — the
 * board stays mounted exactly where it was and the reason is written
 * underneath.
 */

/**
 * Loaded on demand: opening the site does not download a game until it is
 * chosen. Draughts and dominoes join this map when they exist.
 */
const CARREGADORES: Partial<Record<IdJogo, () => Promise<{ default: JogoQualquer }>>> = {
  xadrez: () => import('@/games/xadrez'),
}

export default function App() {
  const [jogo, setJogo] = useState<JogoQualquer | null>(null)
  const [estado, setEstado] = useState<unknown>(null)
  const [nivel, setNivel] = useState<Nivel>('normal')
  const [entranceKey, setEntranceKey] = useState(0)
  const [decorridoMs, setDecorridoMs] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const inicioRef = useRef<number | null>(null)

  const emPartida = jogo !== null && estado !== null

  const desfecho: Desfecho | null = emPartida ? jogo.avaliarFim(estado) : null
  const lancesLegais = emPartida && !desfecho ? jogo.lancesLegais(estado) : []
  const suaVez = emPartida && !desfecho && jogo.vezDe(estado) === 'humano'

  const { pensar, esquecer, pensando } = useMaquina(emPartida ? jogo : null)

  /**
   * Fades the current screen out before swapping, unless motion is off.
   *
   * The swap is driven by a timer, never by the animation finishing. GSAP
   * runs on requestAnimationFrame, which stops in a hidden tab — hanging the
   * state change off onComplete would strand the page on a faded screen.
   */
  const sair = useCallback((executar: () => void) => {
    const palco = stageRef.current
    if (prefersReducedMotion() || !palco) {
      executar()
      return
    }
    gsap.to(palco, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    window.setTimeout(() => {
      executar()
      gsap.killTweensOf(palco)
      gsap.set(palco, { opacity: 1 })
    }, 280)
  }, [])

  /*
   * Advancing happens here, not inside a state updater. A game's `aplicar`
   * is free to own a live rules object — chess.js has to keep the move
   * history for threefold repetition — and React invokes updaters twice in
   * development to surface exactly that kind of impurity. Called twice, the
   * second attempt fails and React keeps the stale state while the real
   * position has already moved on.
   */
  const jogarLance = useCallback(
    (lance: unknown) => {
      if (!jogo || estado === null) return
      if (inicioRef.current === null) inicioRef.current = performance.now()
      setEstado(jogo.aplicar(estado, lance))
    },
    [jogo, estado],
  )

  /*
   * The machine's turn. The search runs in a worker, so this never blocks.
   *
   * `pensando` is deliberately absent from both the guard and the deps: it
   * flips as soon as the search starts, and an effect that re-runs on its own
   * side effect would cancel the request it just made and never play a move.
   * The position signature below is what stops a duplicate request.
   */
  const pedidoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!emPartida || desfecho || suaVez) return

    const serializado = jogo.serializar(estado)
    const assinatura = JSON.stringify(serializado)
    if (pedidoRef.current === assinatura) return
    pedidoRef.current = assinatura

    let cancelado = false
    void pensar(serializado, nivel).then((bruto) => {
      if (cancelado || bruto == null) {
        if (!cancelado) pedidoRef.current = null
        return
      }
      const lance = jogo.desserializarLance(estado, bruto)
      if (lance) jogarLance(lance)
      else pedidoRef.current = null
    })

    return () => {
      cancelado = true
      pedidoRef.current = null
    }
  }, [emPartida, desfecho, suaVez, jogo, estado, nivel, pensar, jogarLance])

  /* The game is over the moment the position says so. Nothing moves. */
  useEffect(() => {
    if (!desfecho) return
    esquecer()
    setDecorridoMs((atual: number) =>
      atual > 0 ? atual : inicioRef.current === null ? 0 : performance.now() - inicioRef.current,
    )
  }, [desfecho, esquecer])

  const comecar = useCallback(async () => {
    const carregar = CARREGADORES.xadrez
    if (!carregar) return
    const modulo = await carregar()
    const carregado = modulo.default
    sair(() => {
      pedidoRef.current = null
      inicioRef.current = null
      setDecorridoMs(0)
      setJogo(() => carregado)
      setEstado(carregado.criarEstado())
      setEntranceKey((k) => k + 1)
    })
  }, [sair])

  const encerrar = useCallback(() => {
    if (!jogo || estado === null) return
    setEstado(jogo.encerrar(estado))
  }, [jogo, estado])

  const outraPartida = useCallback(() => {
    sair(() => {
      pedidoRef.current = null
      inicioRef.current = null
      setDecorridoMs(0)
      setJogo(null)
      setEstado(null)
      setEntranceKey((k) => k + 1)
    })
  }, [sair])

  return (
    <div ref={stageRef}>
      {emPartida ? (
        <TelaPartida
          jogo={jogo}
          estado={estado}
          lancesLegais={lancesLegais}
          /* The machine's turn starts the moment the user moves, not when the
             worker gets around to answering — otherwise the indicator says
             "sua vez" for a beat while the board is not actually yours. */
          suaVez={suaVez && !pensando}
          onLance={jogarLance}
          onEncerrar={encerrar}
          entranceKey={entranceKey}
          desfecho={desfecho}
          decorridoMs={decorridoMs}
          historico={jogo.historico(estado)}
          onOutraPartida={outraPartida}
        />
      ) : (
        <TelaInicio nivel={nivel} onNivelChange={setNivel} onComecar={comecar} />
      )}
    </div>
  )
}
