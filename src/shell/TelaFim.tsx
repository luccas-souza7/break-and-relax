import { Rodape } from './Rodape'
import type { Desfecho } from '@/types'

type PropsTelaFim = {
  desfecho: Desfecho
  onOutraPartida: () => void
}

/**
 * What the end of a game says, underneath the board.
 *
 * Returned as a fragment on purpose: these are three separate rows of the
 * screen's grid, not one block. A wrapper would make them share a single row
 * and take the height away from the board in one lump.
 */
export function TelaFim({ desfecho, onOutraPartida }: PropsTelaFim) {
  return (
    <>
      <div data-fim="cartao" className="mx-auto w-full max-w-md text-center">
        <h2 className="font-display text-[clamp(15px,2.2dvh,20px)] leading-tight font-semibold text-tinta">
          {desfecho.titulo}
        </h2>
        <p className="mt-1 text-[clamp(12px,1.7dvh,14px)] leading-snug text-tinta-fraca text-balance">
          {desfecho.explicacao}
        </p>
      </div>

      <div data-fim="acoes" className="flex justify-center">
        <button
          type="button"
          onClick={onOutraPartida}
          className="rounded-sm px-2 py-1 text-sm font-normal text-tinta-fraca transition-colors hover:text-tinta"
        >
          Outra partida
        </button>
      </div>

      <div data-fim="rodape" className="mx-auto w-full max-w-xl">
        <div aria-hidden="true" className="mb-[clamp(6px,1.5dvh,16px)] h-px w-full bg-border" />
        <Rodape />
      </div>
    </>
  )
}
