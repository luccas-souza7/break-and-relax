import { useLayoutEffect, useRef } from 'react'

import { canAnimateEntrance, gsap, prefersReducedMotion } from '@/anim/motion'
import type { Desfecho, JogoQualquer } from '@/types'
import { TelaFim } from './TelaFim'
import { formatDuration } from './time'

type PropsTelaPartida = {
  jogo: JogoQualquer
  estado: unknown
  lancesLegais: unknown[]
  suaVez: boolean
  onLance: (lance: unknown) => void
  onEncerrar: () => void
  entranceKey: number
  /** Non-null once the game is over. The board stays exactly where it is. */
  desfecho: Desfecho | null
  decorridoMs: number
  historico: string[]
  onOutraPartida: () => void
}

/**
 * The board, during and after the game.
 *
 * During: nothing on screen measures anything — no clock, no move count, no
 * progress of any kind. Only whose turn it is.
 *
 * After: the same board, in the same place, at full opacity. The end of a
 * game is not a different screen — it is this one, with the reason written
 * underneath. Unmounting the board and mounting an end screen would move it,
 * and moving it is the one thing this must not do.
 */
export function TelaPartida({
  jogo,
  estado,
  lancesLegais,
  suaVez,
  onLance,
  onEncerrar,
  entranceKey,
  desfecho,
  decorridoMs,
  historico,
  onOutraPartida,
}: PropsTelaPartida) {
  const rootRef = useRef<HTMLDivElement>(null)
  const tabuleiroRef = useRef<HTMLDivElement>(null)
  const tempoRef = useRef<HTMLDivElement>(null)

  const Tabuleiro = jogo.Tabuleiro
  const Lateral = jogo.Lateral

  /* The turn indicator arrives after the board has finished assembling. */
  useLayoutEffect(() => {
    if (!canAnimateEntrance()) return
    const contexto = gsap.context(() => {
      gsap.from('[data-anim="turn"]', {
        opacity: 0,
        y: 6,
        duration: 0.35,
        delay: 0.5,
        ease: 'power2.out',
      })
    }, rootRef)
    return () => contexto.revert()
  }, [entranceKey])

  /*
   * The closing sequence. One timeline, in the order the eye should travel:
   * the squares that decided it light up, the time arrives over the board and
   * counts itself up, then gets out of the way so the position is readable,
   * and only then does the explanation appear.
   */
  useLayoutEffect(() => {
    if (!desfecho) return
    const digitos = tempoRef.current?.querySelector<HTMLElement>('[data-fim="digitos"]')

    if (prefersReducedMotion() || !canAnimateEntrance()) {
      // Same end state, arrived at instantly.
      if (digitos) digitos.textContent = formatDuration(decorridoMs)
      return
    }

    const contexto = gsap.context(() => {
      const board = tabuleiroRef.current?.getBoundingClientRect()
      const bloco = tempoRef.current?.getBoundingClientRect()

      /* The time is rendered where it ends up, above the board, and is only
         transformed to start over the board's centre. Animating back to
         identity is exact; animating toward a measured target drifts. */
      let deslocamento = { x: 0, y: 0, escala: 1 }
      if (board && bloco && bloco.width > 0) {
        deslocamento = {
          x: board.left + board.width / 2 - (bloco.left + bloco.width / 2),
          y: board.top + board.height / 2 - (bloco.top + bloco.height / 2),
          escala: (board.width * 0.55) / bloco.width,
        }
      }

      const linha = gsap.timeline()

      linha.from(
        '[data-destaque]',
        { opacity: 0, duration: 0.25, ease: 'power1.out', stagger: 0.08 },
        0.3,
      )

      linha.set(
        tempoRef.current,
        {
          x: deslocamento.x,
          y: deslocamento.y,
          scale: deslocamento.escala,
          transformOrigin: 'center center',
          autoAlpha: 0,
        },
        0,
      )
      linha.to(tempoRef.current, { autoAlpha: 1, duration: 0.3 }, 0.7)

      // Counting is done on a proxy in whole seconds: the minutes only tick
      // when the seconds roll over, and the last frame lands on the real value.
      const contador = { ms: 0 }
      linha.to(
        contador,
        {
          ms: decorridoMs,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => {
            if (digitos) digitos.textContent = formatDuration(contador.ms)
          },
          onComplete: () => {
            if (digitos) digitos.textContent = formatDuration(decorridoMs)
          },
        },
        0.7,
      )

      linha.to(
        tempoRef.current,
        { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power2.inOut' },
        1.9,
      )
      linha.to('[data-fim="placa"]', { autoAlpha: 0, duration: 0.4 }, 1.9)

      linha.from('[data-fim="cartao"]', { opacity: 0, y: 10, duration: 0.4 }, 2.4)
      linha.from('[data-fim="acoes"]', { opacity: 0, duration: 0.4 }, 2.7)
    }, rootRef)

    return () => contexto.revert()
  }, [desfecho, decorridoMs])

  return (
    <div
      ref={rootRef}
      className="flex min-h-svh flex-col items-center justify-between px-3 py-6 sm:px-6"
    >
      {/* One slot, two tenants: whose turn it is, or the time once it is over. */}
      <div className="flex min-h-10 items-center justify-center pt-2 pb-6">
        {desfecho ? (
          <div ref={tempoRef} className="relative">
            <span
              data-fim="placa"
              aria-hidden="true"
              className="absolute -inset-x-3 -inset-y-1 rounded-md bg-superficie/92 backdrop-blur-[2px]"
            />
            <div
              data-fim="digitos"
              className="relogio relative text-3xl sm:text-4xl"
              aria-label={`Tempo da partida: ${formatDuration(decorridoMs)}`}
            >
              00:00
            </div>
          </div>
        ) : (
          <p
            data-anim="turn"
            aria-live="polite"
            className="text-sm tracking-wide text-acento sm:text-base"
          >
            {suaVez ? 'sua vez' : 'pensando'}
          </p>
        )}
      </div>

      {/*
        Three columns, minmax(0,1fr) auto minmax(0,1fr). The outer tracks are
        equal by construction, so the middle one is centred on the viewport
        whatever the sides hold — an empty tray and a full one put the board in
        exactly the same place. `justify-center` on a flex row would not.
      */}
      <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
        <div className="hidden min-w-0 md:block" aria-hidden="true" />

        <div ref={tabuleiroRef} className="w-full justify-self-center md:w-[min(72vh,40rem)]">
          <Tabuleiro
            estado={estado}
            lancesLegais={lancesLegais}
            interativo={suaVez && !desfecho}
            destaques={desfecho?.destaques ?? []}
            onLance={onLance}
            entranceKey={entranceKey}
          />
        </div>

        <div className="min-w-0 overflow-x-auto md:justify-self-start">
          {Lateral ? <Lateral estado={estado} fim={desfecho !== null} /> : null}
        </div>
      </div>

      <div className="w-full pt-8 pb-2">
        {desfecho ? (
          <TelaFim
            desfecho={desfecho}
            historico={historico}
            onOutraPartida={onOutraPartida}
          />
        ) : (
          /* Leaving is always available, and never made to feel like a failure. */
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onEncerrar}
              className="rounded-sm px-2 py-1 text-xs font-normal text-tinta-fraca transition-colors hover:text-tinta"
            >
              Encerrar partida
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
