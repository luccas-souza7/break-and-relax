import { memo } from 'react'

import type { Cor } from './rules'

type PropsDisco = {
  cor: Cor
  dama: boolean
  innerRef?: (elemento: HTMLDivElement | null) => void
}

/**
 * A draughts piece: a disc in the project's own palette. A king carries an
 * inner ring rather than a crown, because at this size a glyph turns to mush.
 */
function DiscoBase({ cor, dama, innerRef }: PropsDisco) {
  const clara = cor === 'clara'
  return (
    <div
      ref={innerRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 flex h-[12.5%] w-[12.5%] items-center justify-center will-change-transform"
    >
      <div
        className={[
          'flex h-[72%] w-[72%] items-center justify-center rounded-full border-2 border-tinta',
          clara ? 'bg-superficie' : 'bg-tinta',
        ].join(' ')}
      >
        {dama && (
          <div
            className={[
              'h-[44%] w-[44%] rounded-full border-2',
              clara ? 'border-tinta' : 'border-superficie',
            ].join(' ')}
          />
        )}
      </div>
    </div>
  )
}

export const Disco = memo(DiscoBase)
