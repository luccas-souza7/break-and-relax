import { useCallback, useEffect, useRef, useState } from 'react'

import { PromotionDialog } from '@/components/PromotionDialog'
import { EndScreen } from '@/screens/EndScreen'
import { GameScreen } from '@/screens/GameScreen'
import { StartScreen } from '@/screens/StartScreen'
import { gsap, prefersReducedMotion } from '@/anim/motion'
import { useEngine } from '@/engine/useEngine'
import { ENGINE, useChessGame } from '@/game/useChessGame'
import type { Level, Screen } from '@/game/types'

/**
 * Three screens, one page, no router.
 *
 * The product ends when the game ends. Nothing here counts down, warns, or
 * asks for another game.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('inicio')
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
   * The tween is decoration; the state moves on its own.
   */
  const leave = useCallback((run: () => void, viaDim = false) => {
    const stage = stageRef.current
    if (prefersReducedMotion() || !stage) {
      run()
      return
    }

    if (viaDim) {
      // The board settles to 40% first, then hands the screen back to the clock.
      gsap
        .timeline()
        .to(stage, { opacity: 0.4, duration: 0.35, ease: 'power2.out' })
        .to(stage, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=0.15')
    } else {
      gsap.to(stage, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    }

    window.setTimeout(() => {
      run()
      gsap.killTweensOf(stage)
      gsap.set(stage, { opacity: 1 })
    }, viaDim ? 750 : 280)
  }, [])

  /* The machine's turn. The search runs in a worker, so this never blocks. */
  const askedFor = useRef<string | null>(null)
  useEffect(() => {
    if (screen !== 'partida' || game.outcome || game.turn !== ENGINE) return

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
  }, [screen, game.turn, game.outcome, game.chess, think, level, play])

  /* The game is over the moment the position says so. */
  useEffect(() => {
    if (!game.outcome || screen !== 'partida') return
    sealElapsed()
    forget()
    leave(() => setScreen('fim'), true)
  }, [game.outcome, screen, sealElapsed, forget, leave])

  const handleStart = useCallback(() => {
    leave(() => {
      setEntranceKey((key) => key + 1)
      setScreen('partida')
    })
  }, [leave])

  const handleRestart = useCallback(() => {
    leave(() => {
      askedFor.current = null
      game.reset()
      setEntranceKey((key) => key + 1)
      setScreen('inicio')
    })
  }, [game, leave])

  return (
    <div ref={stageRef}>
      {screen === 'inicio' && (
        <StartScreen level={level} onLevelChange={setLevel} onStart={handleStart} />
      )}

      {screen === 'partida' && (
        <GameScreen
          pieces={game.pieces}
          selected={game.selected}
          targets={game.targets}
          lastMove={game.lastMove}
          capturedByHuman={game.capturedByHuman}
          capturedByEngine={game.capturedByEngine}
          checkPulse={game.checkPulse}
          thinking={thinking}
          onSquare={game.selectSquare}
          onResign={game.resign}
          entranceKey={entranceKey}
        />
      )}

      {screen === 'fim' && game.outcome && (
        <EndScreen
          outcome={game.outcome}
          elapsedMs={game.elapsedMs}
          onRestart={handleRestart}
        />
      )}

      <PromotionDialog
        open={game.promotion !== null}
        onChoose={game.choosePromotion}
        onCancel={game.cancelPromotion}
      />
    </div>
  )
}
