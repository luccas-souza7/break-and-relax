import { Footer } from '@/components/Footer'
import type { Desfecho } from '@/game/types'

type EndPanelProps = {
  desfecho: Desfecho
  /** Readable notation for the whole game; only the tail is shown. */
  historico: string[]
  onRestart: () => void
}

/**
 * What the end of a game says, once the clock has moved out of the way.
 *
 * It sits below the board and never covers it: the point of this screen is
 * that the player can read the sentence and then look at the position that
 * produced it.
 */
export function EndPanel({ desfecho, historico, onRestart }: EndPanelProps) {
  const ultimos = historico.slice(-4)

  return (
    <div className="flex w-full flex-col items-center">
      <div data-fim="cartao" className="w-full max-w-md text-center">
        <h2 className="font-display text-lg font-semibold text-tinta sm:text-xl">
          {desfecho.titulo}
        </h2>
        <p className="mt-2 text-sm text-tinta-fraca text-balance">{desfecho.explicacao}</p>

        {ultimos.length > 0 && (
          <p
            className="mt-4 font-mono text-[11px] text-tinta-fraca"
            aria-label="Últimos lances"
          >
            {ultimos.map((lance, index) => (
              <span
                key={`${lance}-${index}`}
                className={
                  index === ultimos.length - 1 ? 'font-medium text-tinta' : undefined
                }
              >
                {lance}
                {index < ultimos.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      <div data-fim="acoes" className="flex w-full max-w-xl flex-col items-center">
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 rounded-sm px-2 py-1 text-sm font-normal text-tinta-fraca transition-colors hover:text-tinta"
        >
          Outra partida
        </button>
        <div aria-hidden="true" className="mt-8 mb-6 h-px w-full bg-border" />
        <Footer />
      </div>
    </div>
  )
}
