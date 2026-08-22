import { memo } from 'react'
import type { Color, PieceSymbol } from 'chess.js'

import { PIECE_SVG } from '@/game/pieces'

type PieceProps = {
  color: Color
  type: PieceSymbol
  /** The element is addressed by piece id so GSAP can tween it directly. */
  innerRef?: (element: HTMLDivElement | null) => void
}

/**
 * A single piece. It owns no position: the board places it by transform so a
 * move never re-renders the grid. Decorative — the square button carries the
 * accessible name.
 */
function PieceComponent({ color, type, innerRef }: PieceProps) {
  return (
    <div
      ref={innerRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 h-[12.5%] w-[12.5%] will-change-transform"
    >
      <img src={PIECE_SVG[color][type]} alt="" draggable={false} className="h-full w-full select-none" />
    </div>
  )
}

export const Piece = memo(PieceComponent)
