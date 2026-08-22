import { useLayoutEffect, useRef } from 'react'
import type { Square } from 'chess.js'

import { Board } from '@/components/Board'
import { CapturedTray } from '@/components/CapturedTray'
import { canAnimateEntrance, gsap } from '@/anim/motion'
import type { CapturedPiece, PieceView } from '@/game/types'

type GameScreenProps = {
  pieces: PieceView[]
  selected: Square | null
  targets: ReadonlyMap<Square, boolean>
  lastMove: { from: Square; to: Square } | null
  capturedByHuman: CapturedPiece[]
  capturedByEngine: CapturedPiece[]
  checkPulse: number
  thinking: boolean
  onSquare: (square: Square) => void
  onResign: () => void
  entranceKey: number
}

/**
 * The game screen shows nothing that measures anything: no clock, no move
 * count, no progress of any kind. Only whose turn it is.
 */
export function GameScreen({
  pieces,
  selected,
  targets,
  lastMove,
  capturedByHuman,
  capturedByEngine,
  checkPulse,
  thinking,
  onSquare,
  onResign,
  entranceKey,
}: GameScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)

  /* The turn indicator arrives after the board has finished assembling. */
  useLayoutEffect(() => {
    if (!canAnimateEntrance()) return
    const context = gsap.context(() => {
      gsap.from('[data-anim="turn"]', {
        opacity: 0,
        y: 6,
        duration: 0.35,
        delay: 0.5,
        ease: 'power2.out',
      })
    }, rootRef)
    return () => context.revert()
  }, [entranceKey])

  return (
    <div
      ref={rootRef}
      className="flex min-h-svh flex-col items-center justify-between px-3 py-6 sm:px-6"
    >
      <p
        data-anim="turn"
        aria-live="polite"
        className="pt-2 pb-6 text-sm tracking-wide text-acento sm:text-base"
      >
        {thinking ? 'pensando' : 'sua vez'}
      </p>

      <div className="flex w-full max-w-[min(88vh,44rem)] flex-col items-center gap-4 sm:max-w-none sm:flex-row sm:items-start sm:justify-center sm:gap-6">
        <div className="w-full sm:w-[min(72vh,40rem)]">
          <Board
            pieces={pieces}
            selected={selected}
            targets={targets}
            lastMove={lastMove}
            interactive={!thinking}
            onSquare={onSquare}
            checkPulse={checkPulse}
            trayRef={trayRef}
            entranceKey={entranceKey}
          />
        </div>
        <CapturedTray ref={trayRef} byHuman={capturedByHuman} byEngine={capturedByEngine} />
      </div>

      {/* Leaving is always available, and never made to feel like a failure. */}
      <div className="pt-8 pb-2">
        <button
          type="button"
          onClick={onResign}
          className="rounded-sm px-2 py-1 text-xs font-normal text-tinta-fraca transition-colors hover:text-tinta"
        >
          Encerrar partida
        </button>
      </div>
    </div>
  )
}
