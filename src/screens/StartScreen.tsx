import { useLayoutEffect, useRef } from 'react'

import { Clock } from '@/components/Clock'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { canAnimateEntrance, gsap } from '@/anim/motion'
import { LEVEL_LABELS } from '@/engine/protocol'
import type { Level } from '@/game/types'

const LEVELS: Level[] = ['tranquilo', 'normal', 'desafio']

type StartScreenProps = {
  level: Level
  onLevelChange: (level: Level) => void
  onStart: () => void
}

export function StartScreen({ level, onLevelChange, onStart }: StartScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  /* One timeline, in the order the eye should travel. */
  useLayoutEffect(() => {
    if (!canAnimateEntrance()) return
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .from('[data-anim="clock"]', { opacity: 0, y: 12, duration: 0.5 })
        .from('[data-anim="subtitle"]', { opacity: 0, y: 8, duration: 0.35 }, '-=0.2')
        .from(
          '[data-anim="level"]',
          { opacity: 0, y: 8, duration: 0.3, stagger: 0.06 },
          '-=0.15',
        )
        .from('[data-anim="start"]', { opacity: 0, y: 8, duration: 0.3 }, '-=0.05')
        .from('[data-anim="footer"]', { opacity: 0, duration: 0.35 }, '-=0.1')
    }, rootRef)
    return () => context.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="flex min-h-svh flex-col items-center justify-between px-5 py-10"
    >
      <p className="marca pt-4">Break and Relax</p>

      <div className="flex flex-col items-center">
        <div data-anim="clock" className="mt-12">
          <Clock />
        </div>

        <p data-anim="subtitle" className="mt-6 text-sm text-tinta-fraca sm:text-base">
          uma partida. o tempo é seu.
        </p>

        <div
          role="radiogroup"
          aria-label="Nível"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {LEVELS.map((option) => {
            const active = option === level
            return (
              <button
                key={option}
                data-anim="level"
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onLevelChange(option)}
                className={[
                  'rounded-md border px-4 py-2 text-sm transition-colors',
                  active
                    ? 'border-acento text-acento'
                    : 'border-transparent text-tinta-fraca hover:text-tinta',
                ].join(' ')}
              >
                {LEVEL_LABELS[option]}
              </button>
            )
          })}
        </div>

        <div data-anim="start" className="mt-10">
          <Button
            onClick={onStart}
            className="h-11 rounded-md bg-tinta px-10 text-base font-medium text-superficie hover:bg-tinta/90"
          >
            Começar
          </Button>
        </div>
      </div>

      <div data-anim="footer" className="w-full max-w-xl">
        <div aria-hidden="true" className="mb-6 h-px w-full bg-border" />
        <Footer />
      </div>
    </div>
  )
}
