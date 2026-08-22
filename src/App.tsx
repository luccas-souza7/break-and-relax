import { useCallback, useEffect, useRef, useState } from 'react'

import { PromotionDialog } from '@/components/PromotionDialog'
import { GameScreen } from '@/screens/GameScreen'
import { StartScreen } from '@/screens/StartScreen'
import { gsap, prefersReducedMotion } from '@/anim/motion'
import { useEngine } from '@/engine/useEngine'
import { ENGINE, HUMAN, useChessGame } from '@/game/useChessGame'
import type { Level } from '@/game/types'

/**
 * Two screens, one page, no router.
 *
 * The end of a game is not a third screen: the board stays mounted exactly
 * where it was and the reason it ended is written underneath. The product
 * ends when the game ends — nothing here counts down, warns, or asks for
 * another game.
 */
export default function App() {
  const [emPartida, setEmPartida] = useState(false)
  const [level, setLevel] = useState<Level>('normal')
  const [entranceKey, setEntranceKey] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  const game = useChessGame()
  const { play, sealElapsed } = game
  /* Destructured on purpose: `think` and `forget` are stable, while the
     object holding them is new on every render. Depending on the object
     would restart the search each time `thinking` flips. */
  const { think, forget, thinking } = useEngine()

  /**
   * Fades the current screen out before swapping, unless motion is off.
   *
   * The swap itself is driven by a timer, never by the animation finishing.
   * GSAP runs on requestAnimationFrame, which stops in a hidden tab — if the
   * state change hung off onComplete, stepping away mid-transition would
   * leave the page stranded on a faded screen until the visitor came back.
   */
  const leave = useCallback((run: () => void) => {
    const stage = stageRef.current
    if (prefersReducedMotion() || !stage) {
      run()
      return
    }
    gsap.to(stage, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    window.setTimeout(() => {
      run()
      gsap.killTweensOf(stage)
      gsap.set(stage, { opacity: 1 })
    }, 280)
  }, [])

  /* The machine's turn. The search runs in a worker, so this never blocks. */
  const askedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!emPartida || game.desfecho || game.turn !== ENGINE) return

    const fen = game.chess.current.fen()
    if (askedFor.current === fen) return
    askedFor.current = fen

    let cancelled = false
    void think(fen, level).then((answer) => {
      if (cancelled) return
      if (!answer || !play(answer.from, answer.to, answer.promotion)) {
        askedFor.current = null
      }
    })

    return () => {
      cancelled = true
      askedFor.current = null
    }
  }, [emPartida, game.turn, game.desfecho, game.chess, think, level, play])

  /* The game is over the moment the position says so. Nothing moves. */
  useEffect(() => {
    if (!game.desfecho) return
    sealElapsed()
    forget()
  }, [game.desfecho, sealElapsed, forget])

  const handleStart = useCallback(() => {
    leave(() => {
      setEntranceKey((key) => key + 1)
      setEmPartida(true)
    })
  }, [leave])

  const handleRestart = useCallback(() => {
    leave(() => {
      askedFor.current = null
      game.reset()
      setEntranceKey((key) => key + 1)
      setEmPartida(false)
    })
  }, [game, leave])

  return (
    <div ref={stageRef}>
      {emPartida ? (
        <GameScreen
          pieces={game.pieces}
          selected={game.selected}
          targets={game.targets}
          lastMove={game.lastMove}
          capturedByHuman={game.capturedByHuman}
          capturedByEngine={game.capturedByEngine}
          checkPulse={game.checkPulse}
          /* The machine's turn starts the moment the user moves, not when the
             worker gets around to answering — otherwise the indicator says
             "sua vez" for a beat while the board is not actually yours. */
          yourTurn={!game.desfecho && game.turn === HUMAN && !thinking}
          onSquare={game.selectSquare}
          onResign={game.resign}
          entranceKey={entranceKey}
          desfecho={game.desfecho}
          elapsedMs={game.elapsedMs}
          historico={game.historico}
          onRestart={handleRestart}
        />
      ) : (
        <StartScreen level={level} onLevelChange={setLevel} onStart={handleStart} />
      )}

      <PromotionDialog
        open={game.promotion !== null}
        onChoose={game.choosePromotion}
        onCancel={game.cancelPromotion}
      />
    </div>
  )
}
