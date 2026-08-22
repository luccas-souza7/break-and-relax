import { useLayoutEffect, useRef } from 'react'

import { canAnimateEntrance, gsap } from '@/anim/motion'
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
  /** Non-null once the game is over. */
  desfecho: Desfecho | null
  decorridoMs: number
  onOutraPartida: () => void
}

/**
 * The board, during and after the game.
 *
 * During: nothing on screen measures anything — no clock, no move count, no
 * progress of any kind. Only whose turn it is.
 *
 * After: the same board, at full opacity — smaller, never dimmed. The end of a
 * game is not a different screen; it is this one with three more rows
 * underneath, and the board gives up the height they need.
 *
 * Rows, not stacking: `auto` for the slot, `minmax(240px, 1fr)` for the board,
 * `auto` for everything below. The board takes the height that is left and
 * never pushes anyone. 240px is the legibility floor — below it the position
 * cannot be read, and reading it is the whole point of this screen. It is also
 * what the root's `min-height: min-content` adds up to decide when the page
 * has genuinely run out of room.
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
  onOutraPartida,
}: PropsTelaPartida) {
  const rootRef = useRef<HTMLDivElement>(null)
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
        duration: 0.7,
        delay: 0.5,
        ease: 'power1.out',
      })
    }, rootRef)
    return () => contexto.revert()
  }, [entranceKey])

  /* Until the closing timeline lands, the clock shows the real time straight
     away so the static layout can be checked on its own. */
  useLayoutEffect(() => {
    if (!desfecho) return
    const digitos = tempoRef.current?.querySelector<HTMLElement>('[data-fim="digitos"]')
    if (digitos) digitos.textContent = formatDuration(decorridoMs)
  }, [desfecho, decorridoMs])

  return (
    <div
      ref={rootRef}
      className="tela-partida grid h-full grid-rows-[auto_minmax(240px,1fr)] gap-[clamp(8px,2dvh,20px)] px-3 py-[clamp(8px,2dvh,20px)] sm:px-6"
    >
      {/* One slot, two tenants: whose turn it is, or the time once it is over. */}
      <div className="flex min-h-8 items-center justify-center">
        {desfecho ? (
          <div ref={tempoRef}>
            <div
              data-fim="digitos"
              className="relogio text-[clamp(40px,11dvh,120px)]"
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
        exactly the same place.
      */}
      <div
        data-linha-tabuleiro
        className="grid min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-rows-1 md:gap-6 md:[container-type:size]"
      >
        <div className="hidden min-w-0 md:block" aria-hidden="true" />

        {/*
          Two ways of arriving at the same square, because the constraint that
          binds differs by layout.

          Single column: the track is the full width, so `max-width: 100%` has
          something definite to resolve against and clamps a height-derived
          width down.

          Three columns: the middle track is `auto`, sized *by* this item, so a
          percentage max-width is circular and gets ignored — which is how the
          board came out 888px wide inside a 768px viewport. Container query
          units break the loop: 100cqh and 100cqw read the row, not the track,
          and 11rem is the room the two side columns need.
        */}
        <div
          data-centro
          className="mx-auto aspect-square h-full max-w-full justify-self-center md:h-auto md:w-[min(100cqh,calc(100cqw-11rem))] md:self-center"
        >
          <Tabuleiro
            estado={estado}
            lancesLegais={lancesLegais}
            interativo={suaVez && !desfecho}
            destaques={desfecho?.destaques ?? []}
            onLance={onLance}
            entranceKey={entranceKey}
          />
        </div>

        <div className="min-w-0 md:justify-self-start md:self-start">
          {Lateral ? <Lateral estado={estado} fim={desfecho !== null} /> : null}
        </div>
      </div>

      {desfecho ? (
        <TelaFim desfecho={desfecho} onOutraPartida={onOutraPartida} />
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
  )
}
