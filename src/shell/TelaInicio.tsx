import { useLayoutEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { canAnimateEntrance, gsap } from '@/anim/motion'
import type { IdJogo, Nivel } from '@/types'
import { Relogio } from './Relogio'
import { Rodape } from './Rodape'
import { JOGOS, NIVEIS, ROTULOS_JOGO, ROTULOS_NIVEL } from './niveis'

type PropsTelaInicio = {
  jogo: IdJogo
  onJogoChange: (jogo: IdJogo) => void
  nivel: Nivel
  onNivelChange: (nivel: Nivel) => void
  onComecar: () => void
  onTantoFaz: () => void
}

/** Same button, twice: the game row must not out-shout the level row. */
function Escolha({
  ativo,
  rotulo,
  onClick,
  anim,
}: {
  ativo: boolean
  rotulo: string
  onClick: () => void
  anim: string
}) {
  return (
    <button
      data-anim={anim}
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={[
        'rounded-md border px-4 py-2 text-sm transition-colors',
        ativo
          ? 'border-acento text-acento'
          : 'border-transparent text-tinta-fraca hover:text-tinta',
      ].join(' ')}
    >
      {rotulo}
    </button>
  )
}

export function TelaInicio({
  jogo,
  onJogoChange,
  nivel,
  onNivelChange,
  onComecar,
  onTantoFaz,
}: PropsTelaInicio) {
  const rootRef = useRef<HTMLDivElement>(null)

  /* One timeline, in the order the eye should travel. */
  useLayoutEffect(() => {
    if (!canAnimateEntrance()) return
    const contexto = gsap.context(() => {
      const linha = gsap.timeline({ defaults: { ease: 'power2.out' } })
      linha
        .from('[data-anim="clock"]', { opacity: 0, y: 12, duration: 0.5 })
        .from('[data-anim="subtitle"]', { opacity: 0, y: 8, duration: 0.35 }, '-=0.2')
        .from('[data-anim="game"]', { opacity: 0, y: 8, duration: 0.3, stagger: 0.06 }, '-=0.15')
        .from('[data-anim="level"]', { opacity: 0, y: 8, duration: 0.3, stagger: 0.06 }, '-=0.1')
        .from('[data-anim="start"]', { opacity: 0, y: 8, duration: 0.3 }, '-=0.05')
        .from('[data-anim="qualquer"]', { opacity: 0, duration: 0.3 }, '-=0.05')
        .from('[data-anim="footer"]', { opacity: 0, duration: 0.35 }, '-=0.1')
    }, rootRef)
    return () => contexto.revert()
  }, [])

  return (
    /*
      Rows, so everything fits without scrolling: the brand, the clock, the two
      choice rows, the button and the footer each own a row, and the gaps are
      tied to viewport height rather than fixed in pixels.
    */
    <div
      ref={rootRef}
      className="grid h-full grid-rows-[auto_1fr_auto] gap-[clamp(8px,2dvh,24px)] px-5 py-[clamp(10px,3dvh,32px)]"
    >
      <p className="marca text-center">Break and Relax</p>

      <div className="flex min-h-0 flex-col items-center justify-center gap-[clamp(8px,2dvh,24px)]">
        <div data-anim="clock">
          <Relogio />
        </div>

        <p data-anim="subtitle" className="text-sm text-tinta-fraca sm:text-base">
          uma partida. o tempo é seu.
        </p>

        <div
          role="radiogroup"
          aria-label="Jogo"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {JOGOS.map((opcao) => (
            <Escolha
              key={opcao}
              anim="game"
              ativo={opcao === jogo}
              rotulo={ROTULOS_JOGO[opcao]}
              onClick={() => onJogoChange(opcao)}
            />
          ))}
        </div>

        <div
          role="radiogroup"
          aria-label="Nível"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {NIVEIS.map((opcao) => (
            <Escolha
              key={opcao}
              anim="level"
              ativo={opcao === nivel}
              rotulo={ROTULOS_NIVEL[opcao]}
              onClick={() => onNivelChange(opcao)}
            />
          ))}
        </div>

        <div data-anim="start">
          <Button
            onClick={onComecar}
            className="h-11 rounded-md bg-tinta px-10 text-base font-medium text-superficie hover:bg-tinta/90"
          >
            Começar
          </Button>
        </div>

        {/* For whoever just wants to stop deciding for ten minutes. */}
        <button
          data-anim="qualquer"
          type="button"
          onClick={onTantoFaz}
          className="rounded-sm px-2 py-1 text-xs font-normal text-tinta-fraca transition-colors hover:text-tinta"
        >
          tanto faz — escolha por mim
        </button>
      </div>

      <div data-anim="footer" className="mx-auto w-full max-w-xl">
        <div aria-hidden="true" className="mb-[clamp(6px,1.5dvh,16px)] h-px w-full bg-border" />
        <Rodape />
      </div>
    </div>
  )
}
