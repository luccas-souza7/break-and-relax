import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import type { Square } from 'chess.js'

import { Piece } from '@/components/Piece'
import { DURATION, canAnimateEntrance, gsap, prefersReducedMotion, tween } from '@/anim/motion'
import { FILES, RANKS, colOf, isLightSquare, rowOf, squareAt } from '@/game/board'
import { PIECE_SVG, describeSquare } from '@/game/pieces'
import type { PieceView } from '@/game/types'

type BoardProps = {
  pieces: PieceView[]
  selected: Square | null
  /** Legal destinations for the selected piece; the value marks a capture. */
  targets: ReadonlyMap<Square, boolean>
  lastMove: { from: Square; to: Square } | null
  interactive: boolean
  onSquare: (square: Square) => void
  /** Bumped once per check, so the border pulses exactly once. */
  checkPulse: number
  /** Captured pieces fly toward this element. */
  trayRef?: RefObject<HTMLElement | null>
  /** Changes when a new game starts, to stagger the squares back in. */
  entranceKey: number
}

export function Board({
  pieces,
  selected,
  targets,
  lastMove,
  interactive,
  onSquare,
  checkPulse,
  trayRef,
  entranceKey,
}: BoardProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const squaresRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pieceEls = useRef(new Map<string, HTMLDivElement>())
  const placed = useRef(new Map<string, Square>())
  const previous = useRef<PieceView[]>([])
  const [cursor, setCursor] = useState<Square>('e2')

  /** A captured piece shrinks and slides to the tray, then is gone. */
  const flyToTray = useCallback(
    (piece: PieceView) => {
      const layer = layerRef.current
      if (!layer || prefersReducedMotion()) return

      const col = colOf(piece.square)
      const row = rowOf(piece.square)

      const ghost = document.createElement('div')
      ghost.className = 'pointer-events-none absolute top-0 left-0 h-[12.5%] w-[12.5%]'
      const image = document.createElement('img')
      image.src = PIECE_SVG[piece.color][piece.type]
      image.alt = ''
      image.className = 'h-full w-full'
      ghost.appendChild(image)
      layer.appendChild(ghost)
      gsap.set(ghost, { xPercent: col * 100, yPercent: row * 100 })

      const board = frameRef.current?.getBoundingClientRect()
      const tray = trayRef?.current?.getBoundingClientRect()
      let dx = 0
      let dy = 0
      if (board && tray && tray.width > 0) {
        const size = board.width / 8
        dx = tray.left + tray.width / 2 - (board.left + (col + 0.5) * size)
        dy = tray.top + tray.height / 2 - (board.top + (row + 0.5) * size)
      }

      gsap.to(ghost, {
        x: dx,
        y: dy,
        scale: 0.6,
        opacity: 0,
        duration: DURATION.capture,
        ease: 'power2.in',
        onComplete: () => ghost.remove(),
      })
    },
    [trayRef],
  )

  /* Placement lives in GSAP, never in React's render output, so a move tweens
     one element instead of repainting the grid. */
  useLayoutEffect(() => {
    for (const piece of pieces) {
      const el = pieceEls.current.get(piece.id)
      if (!el) continue
      const x = colOf(piece.square) * 100
      const y = rowOf(piece.square) * 100
      const known = placed.current.get(piece.id)

      if (known === undefined) {
        gsap.set(el, { xPercent: x, yPercent: y, x: 0, y: 0, scale: 1, opacity: 1 })
      } else if (known !== piece.square) {
        tween(el, { xPercent: x, yPercent: y, duration: DURATION.move, ease: 'power2.out' })
      }
      placed.current.set(piece.id, piece.square)
    }

    /* Anything that left the position was captured. The farewell is played on
       a throwaway clone owned by GSAP, not by React: a purely visual effect
       has no business triggering another render of the board. */
    const live = new Set(pieces.map((piece) => piece.id))
    const gone = previous.current.filter((piece) => !live.has(piece.id))
    previous.current = pieces
    for (const piece of gone) {
      placed.current.delete(piece.id)
      flyToTray(piece)
    }
  }, [pieces, flyToTray])

  /* Check: the border pulses once. Once. */
  useEffect(() => {
    if (checkPulse <= 0 || !pulseRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      pulseRef.current,
      { borderColor: 'rgba(158, 59, 78, 0)' },
      {
        borderColor: 'rgba(158, 59, 78, 1)',
        duration: DURATION.checkPulse / 2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      },
    )
  }, [checkPulse])

  /* Entrance: the board assembles square by square, on a diagonal. */
  useEffect(() => {
    const grid = squaresRef.current
    if (!grid || !canAnimateEntrance()) return
    const context = gsap.context(() => {
      gsap.from('[data-square]', {
        opacity: 0,
        duration: 0.22,
        ease: 'power1.out',
        stagger: { each: DURATION.squareStagger, from: 'start' },
      })
    }, grid)
    return () => context.revert()
  }, [entranceKey])

  const focusSquare = useCallback((square: Square) => {
    squaresRef.current
      ?.querySelector<HTMLButtonElement>('[data-square="' + square + '"]')
      ?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const delta = deltas[event.key]
      if (delta) {
        event.preventDefault()
        const row = Math.min(7, Math.max(0, rowOf(cursor) + delta[0]))
        const col = Math.min(7, Math.max(0, colOf(cursor) + delta[1]))
        const next = squareAt(row, col)
        setCursor(next)
        focusSquare(next)
        return
      }
      if (event.key === 'Escape' && selected) {
        event.preventDefault()
        onSquare(selected)
      }
    },
    [cursor, focusSquare, onSquare, selected],
  )

  const occupant = useMemo(
    () => new Map(pieces.map((piece) => [piece.square, piece])),
    [pieces],
  )

  return (
    <div ref={frameRef} className="relative aspect-square w-full">
      <div
        ref={squaresRef}
        role="grid"
        aria-label="Tabuleiro de xadrez"
        onKeyDown={handleKeyDown}
        className="absolute inset-0 grid grid-rows-8"
      >
        {RANKS.map((rank, row) => (
          <div key={rank} role="row" className="grid grid-cols-8">
            {FILES.map((_file, col) => {
              const square = squareAt(row, col)
              const piece = occupant.get(square)
              const isTarget = targets.has(square)
              const isCapture = targets.get(square) === true
              const isSelected = selected === square
              const isLast = lastMove?.from === square || lastMove?.to === square
              return (
                <button
                  key={square}
                  type="button"
                  role="gridcell"
                  data-square={square}
                  tabIndex={cursor === square ? 0 : -1}
                  aria-label={describeSquare(square, piece)}
                  aria-selected={isSelected}
                  onFocus={() => setCursor(square)}
                  onClick={() => {
                    if (interactive) onSquare(square)
                  }}
                  className={[
                    'relative flex items-center justify-center focus-visible:z-20',
                    isLightSquare(row, col) ? 'bg-casa-clara' : 'bg-casa-escura',
                  ].join(' ')}
                >
                  {isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-casa-escura/45 mix-blend-multiply"
                    />
                  )}
                  {isSelected && (
                    <span aria-hidden="true" className="absolute inset-0 bg-acento/25" />
                  )}
                  {isTarget && !isCapture && (
                    <span
                      aria-hidden="true"
                      className="relative h-[22%] w-[22%] rounded-full bg-acento/55"
                    />
                  )}
                  {isTarget && isCapture && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-[7%] rounded-full border-4 border-acento/55"
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Pieces sit above the grid and are positioned only by transform. */}
      <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        {pieces.map((piece) => (
          <Piece
            key={piece.id}
            color={piece.color}
            type={piece.type}
            innerRef={(el) => {
              if (el) pieceEls.current.set(piece.id, el)
              else pieceEls.current.delete(piece.id)
            }}
          />
        ))}
      </div>

      {/* Border used only for the single check pulse. */}
      <div
        ref={pulseRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 border-2 border-transparent"
      />
    </div>
  )
}
