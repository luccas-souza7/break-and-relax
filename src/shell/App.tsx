import { useCallback, useEffect, useRef, useState } from 'react'

import { DURACAO, EASE, gsap, prefersReducedMotion } from '@/anim/motion'
import type { Desfecho, IdJogo, JogoQualquer, Nivel } from '@/types'
import { TelaInicio } from './TelaInicio'
import { useMaquina } from './useMaquina'
import { TelaPartida } from './TelaPartida'

/**
 * Two screens, one page, no router.
 *
 * The shell keeps time, drives the machine and writes the ending on screen
 * without knowing which game is being played: everything it needs arrives
 * through the `Jogo` contract. The end of a game is not a third screen: the
 * board stays mounted, gives up the height the explanation needs, and the
 * reason is written underneath it.
 */

/**
 * Loaded on demand: opening the site does not download a game until it is
 * chosen.
 */
const CARREGADORES: Partial<Record<IdJogo, () => Promise<{ default: JogoQualquer }>>> = {
  xadrez: () => import('@/games/xadrez'),
  damas: () => import('@/games/damas'),
}

export default function App() {
  const [jogo, setJogo] = useState<JogoQualquer | null>(null)
  const [estado, setEstado] = useState<unknown>(null)
  const [escolhido, setEscolhido] = useState<IdJogo>('xadrez')
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
   * runs on requestAnimationFrame, which stops in a hidden tab, so hanging the
   * state change off onComplete would strand the page on a faded screen.
   */
  const sair = useCallback((executar: () => void) => {
    const palco = stageRef.current
    if (prefersReducedMotion() || !palco) {
      executar()
      return
    }
    gsap.to(palco, { opacity: 0, duration: DURACAO.saida, ease: EASE.saida })
    window.setTimeout(() => {
      executar()
      gsap.killTweensOf(palco)
      gsap.set(palco, { opacity: 1 })
    }, DURACAO.saida * 1000)
  }, [])

  /*
   * Advancing happens here, not inside a state updater. A game's `aplicar`
   * is free to own a live rules object (chess.js has to keep the move
   * history for threefold repetition), and React invokes updaters twice in
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

  const abrir = useCallback(
    async (id: IdJogo, nivelEscolhido: Nivel) => {
      const carregar = CARREGADORES[id]
      if (!carregar) return
      const { default: carregado } = await carregar()
      sair(() => {
        pedidoRef.current = null
        inicioRef.current = null
        setDecorridoMs(0)
        setNivel(nivelEscolhido)
        setEscolhido(id)
        setJogo(() => carregado)
        setEstado(carregado.criarEstado())
        setEntranceKey((k) => k + 1)
      })
    },
    [sair],
  )

  const comecar = useCallback(() => void abrir(escolhido, nivel), [abrir, escolhido, nivel])

  /** Removes the decision for whoever just wants to stop thinking. */
  const tantoFaz = useCallback(() => {
    const jogos = Object.keys(CARREGADORES) as IdJogo[]
    const niveis: Nivel[] = ['tranquilo', 'normal', 'desafio']
    const sorteia = <T,>(lista: T[]) => lista[(Math.random() * lista.length) | 0]
    void abrir(sorteia(jogos), sorteia(niveis))
  }, [abrir])

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
    <div ref={stageRef} className="app">
      {emPartida ? (
        <TelaPartida
          jogo={jogo}
          estado={estado}
          lancesLegais={lancesLegais}
          /* The machine's turn starts the moment the user moves, not when the
             worker gets around to answering. Otherwise the indicator says
             "sua vez" for a beat while the board is not actually yours. */
          suaVez={suaVez && !pensando}
          onLance={jogarLance}
          onEncerrar={encerrar}
          entranceKey={entranceKey}
          desfecho={desfecho}
          decorridoMs={decorridoMs}
          onOutraPartida={outraPartida}
        />
      ) : (
        <TelaInicio
          jogo={escolhido}
          onJogoChange={setEscolhido}
          nivel={nivel}
          onNivelChange={setNivel}
          onComecar={comecar}
          onTantoFaz={tantoFaz}
        />
      )}
    </div>
  )
}
