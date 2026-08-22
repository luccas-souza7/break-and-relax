import { useLayoutEffect, useRef } from 'react'

import { Clock } from '@/components/Clock'
import { Footer } from '@/components/Footer'
import { canAnimateEntrance, gsap } from '@/anim/motion'
import type { Outcome } from '@/game/types'

/** One line, stated as a fact. Nothing here evaluates the player. */
const CLOSING_LINE: Record<Outcome, string> = {
  vitoria: 'Boa. Volte quando estiver pronto.',
  derrota: 'Acabou. Já é o suficiente por agora.',
  empate: 'Empate. Sem vencedor, sem perdedor.',
  encerrada: 'Encerrada. A pausa era esse tempo mesmo.',
}

type EndScreenProps = {
  outcome: Outcome
  elapsedMs: number
  onRestart: () => void
}

export function EndScreen({ outcome, elapsedMs, onRestart }: EndScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  /* The clock arrives already showing the final time — no digit counting,
     no tallying up. The number is a fact, not a verdict. */
  useLayoutEffect(() => {
    if (!canAnimateEntrance()) return
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .from('[data-anim="clock"]', { opacity: 0, y: 12, duration: 0.5 })
        .from('[data-anim="line"]', { opacity: 0, y: 8, duration: 0.4 }, '-=0.1')
        .from('[data-anim="again"]', { opacity: 0, duration: 0.35 }, '-=0.15')
        .from('[data-anim="footer"]', { opacity: 0, duration: 0.35 }, '-=0.2')
    }, rootRef)
    return () => context.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="flex min-h-svh flex-col items-center justify-between px-5 py-10"
    >
      <div aria-hidden="true" />

      <div className="flex flex-col items-center text-center">
        <div data-anim="clock">
          <Clock milliseconds={elapsedMs} />
        </div>

        <p
          data-anim="line"
          className="mt-8 max-w-md font-display text-xl font-semibold text-balance sm:text-2xl"
        >
          {CLOSING_LINE[outcome]}
        </p>

        <button
          data-anim="again"
          type="button"
          onClick={onRestart}
          className="mt-10 rounded-sm px-2 py-1 text-sm font-normal text-tinta-fraca transition-colors hover:text-tinta"
        >
          Outra partida
        </button>
      </div>

      <div data-anim="footer" className="w-full max-w-xl">
        <div aria-hidden="true" className="mb-6 h-px w-full bg-border" />
        <Footer />
      </div>
    </div>
  )
}
