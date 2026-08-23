import { useLayoutEffect, useRef } from 'react'

import { DURACAO, EASE, Flip, canAnimateEntrance, gsap } from '@/anim/motion'
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
 * During: nothing on screen measures anything: no clock, no move count, no
 * progress of any kind. Only whose turn it is.
 *
 * After: the same board, at full opacity, only smaller, never dimmed. The end of a
 * game is not a different screen; it is this one with three more rows
 * underneath, and the board gives up the height they need.
 *
 * Rows, not stacking: `auto` for the slot, `minmax(240px, 1fr)` for the board,
 * `auto` for everything below. The board takes the height that is left and
 * never pushes anyone. 240px is the legibility floor: below it the position
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
  const tabuleiroRef = useRef<HTMLDivElement>(null)

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

  /*
   * Flip needs the geometry from before the layout changed, and by the time an
   * effect runs React has already applied it. So the board's state is captured
   * on every playing render. It only ever changes when the end rows appear,
   * so any of those captures is the right "before".
   */
  const estadoFlip = useRef<ReturnType<typeof Flip.getState> | null>(null)
  useLayoutEffect(() => {
    if (desfecho || !tabuleiroRef.current) return
    estadoFlip.current = Flip.getState(tabuleiroRef.current)
  })

  /*
   * The closing sequence: one timeline, and a slow one on purpose. This is the
   * quietest moment of the site: nothing here is a result screen.
   */
  useLayoutEffect(() => {
    if (!desfecho) return
    const digitos = tempoRef.current?.querySelector<HTMLElement>('[data-fim="digitos"]')

    if (!canAnimateEntrance()) {
      // Same end state, arrived at instantly.
      if (digitos) digitos.textContent = formatDuration(decorridoMs)
      return
    }

    const contexto = gsap.context(() => {
      const linha = gsap.timeline()

      linha.from(
        '[data-fim="vez-saindo"]',
        { opacity: 1, duration: DURACAO.saida, ease: EASE.saida },
        0,
      )

      linha.from(
        '[data-destaque]',
        {
          opacity: 0,
          duration: DURACAO.destaque,
          ease: EASE.entrada,
          stagger: DURACAO.destaqueStagger,
        },
        0.2,
      )

      /* The rows below already occupy their real space; this animates the
         board from the size it had to the size it now has. */
      if (estadoFlip.current && tabuleiroRef.current) {
        linha.add(
          Flip.from(estadoFlip.current, {
            duration: DURACAO.layout,
            ease: EASE.layout,
          }),
          0.5,
        )
      }

      /*
       * The clock waits for the board to finish shrinking rather than arriving
       * at 1.1s as first drawn. Flip animates from the board's old, larger box,
       * which reaches up through this very slot on its way down, so fading the
       * clock in during that would put the two on top of each other, and the
       * clock covering the board is exactly what this screen must never do.
       */
      linha.from(
        tempoRef.current,
        { opacity: 0, y: 6, duration: DURACAO.entrada, ease: EASE.entrada },
        1.6,
      )

      /* Counted on a proxy in whole seconds, so the minutes only tick when the
         seconds roll over, and the last frame lands on the real value. */
      const contador = { ms: 0 }
      linha.to(
        contador,
        {
          ms: decorridoMs,
          duration: DURACAO.contagem,
          ease: EASE.contagem,
          onUpdate: () => {
            if (digitos) digitos.textContent = formatDuration(contador.ms)
          },
          onComplete: () => {
            if (digitos) digitos.textContent = formatDuration(decorridoMs)
          },
        },
        1.9,
      )

      linha.from(
        '[data-fim="cartao"]',
        { opacity: 0, y: 8, duration: 0.8, ease: EASE.entrada },
        2.4,
      )

      /* Plain opacity, never autoAlpha: the button must answer a click from the
         moment its fade starts, not once the timeline finishes. */
      linha.set('[data-fim="acoes"]', { pointerEvents: 'none' }, 0)
      linha.from(
        ['[data-fim="acoes"]', '[data-fim="rodape"]'],
        { opacity: 0, y: 8, duration: 0.8, ease: EASE.entrada },
        2.9,
      )
      linha.set('[data-fim="acoes"]', { pointerEvents: 'auto' }, 2.9)

      /* Nobody should have to sit through it. */
      const pular = () => linha.progress(1)
      const aoTeclar = (evento: KeyboardEvent) => {
        if (evento.key === 'Escape') pular()
      }
      const raiz = rootRef.current
      raiz?.addEventListener('click', pular)
      window.addEventListener('keydown', aoTeclar)
      linha.eventCallback('onComplete', () => {
        raiz?.removeEventListener('click', pular)
        window.removeEventListener('keydown', aoTeclar)
      })
    }, rootRef)

    return () => contexto.revert()
  }, [desfecho, decorridoMs])

  return (
    <div
      ref={rootRef}
      className="tela-partida grid h-full grid-rows-[auto_minmax(240px,1fr)] gap-[clamp(8px,2dvh,20px)] px-3 py-[clamp(8px,2dvh,20px)] sm:px-6"
    >
      {/* One slot, two tenants: whose turn it is, or the time once it is over. */}
      <div className="relative flex min-h-8 items-center justify-center">
        {/* Rests at zero, so with motion off it is simply absent; the timeline
            reveals it only to fade it out. */}
        {desfecho && (
          <p
            data-fim="vez-saindo"
            aria-hidden="true"
            className="absolute text-sm tracking-wide text-acento opacity-0 sm:text-base"
          >
            {suaVez ? 'sua vez' : 'pensando'}
          </p>
        )}
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
        whatever the sides hold: an empty tray and a full one put the board in
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
          percentage max-width is circular and gets ignored, which is how the
          board came out 888px wide inside a 768px viewport. Container query
          units break the loop: 100cqh and 100cqw read the row, not the track,
          and 11rem is the room the two side columns need.
        */}
        <div
          ref={tabuleiroRef}
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
