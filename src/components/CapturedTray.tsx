import { forwardRef } from 'react'

import { PIECE_ORDER, PIECE_SVG, pieceName } from '@/game/pieces'
import type { CapturedPiece } from '@/game/types'

type CapturedTrayProps = {
  /** Black pieces the user has taken. */
  byHuman: CapturedPiece[]
  /** White pieces the machine has taken. */
  byEngine: CapturedPiece[]
}

function sortForTray(pieces: CapturedPiece[]): CapturedPiece[] {
  return [...pieces].sort((a, b) => PIECE_ORDER[a.type] - PIECE_ORDER[b.type])
}

function Row({ pieces, label }: { pieces: CapturedPiece[]; label: string }) {
  return (
    <ul
      aria-label={label}
      className="flex min-h-6 flex-row flex-wrap content-start gap-0.5 sm:flex-col sm:gap-0"
    >
      {sortForTray(pieces).map((piece) => (
        <li key={piece.id} className="sm:-mt-3 sm:first:mt-0">
          <img
            src={PIECE_SVG[piece.color][piece.type]}
            alt={pieceName(piece.color, piece.type)}
            className="size-6 opacity-70 sm:size-7"
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * Captured pieces. Deliberately no count and no material score — that would
 * be a scoreboard, and this game does not keep score.
 */
export const CapturedTray = forwardRef<HTMLDivElement, CapturedTrayProps>(
  function CapturedTray({ byHuman, byEngine }, ref) {
    return (
      <div
        ref={ref}
        className="flex w-full flex-row items-start justify-between gap-4 sm:w-16 sm:flex-col sm:justify-start sm:gap-6"
      >
        <Row pieces={byHuman} label="Peças que você capturou" />
        <div aria-hidden="true" className="hidden h-px w-full bg-border sm:block" />
        <Row pieces={byEngine} label="Peças que a máquina capturou" />
      </div>
    )
  },
)
