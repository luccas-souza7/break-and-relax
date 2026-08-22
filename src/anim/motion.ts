import gsap from 'gsap'
import { Flip } from 'gsap/Flip'

/*
 * Flip animates a real layout change at its true size. Shrinking the board
 * with `transform: scale` would look the same for a moment and open no space
 * at all for the rows underneath, which is the entire point of the move.
 */
gsap.registerPlugin(Flip)

/**
 * Motion is one orchestrated sequence, and it is entirely optional.
 * When the visitor asks for stillness, every tween below collapses into an
 * instant state change — nothing is left half-animated.
 */
const query = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches
}

export function onMotionPreferenceChange(listener: () => void): () => void {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

/**
 * Whether an entrance animation may run at all.
 *
 * `gsap.from()` hides the element on the spot and reveals it as the tween
 * plays — which is fine, right up until the tween never plays. GSAP runs on
 * requestAnimationFrame, and a document that is not being rendered (opened
 * into a background tab, restored from a session) does not get frames. The
 * content would sit at opacity 0 with nothing to bring it back.
 *
 * So anything that hides content to reveal it later must ask first. When the
 * answer is no, the screen simply starts in its final state.
 */
export function canAnimateEntrance(): boolean {
  if (prefersReducedMotion()) return false
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

/**
 * The movement vocabulary, in one place.
 *
 * The site is a pause. Nothing here is urgent, nothing announces itself, and
 * nothing overshoots — no `back`, no `elastic`, no `bounce`, no scale above 1.
 */
export const DURACAO = {
  /** Something arriving on screen. */
  entrada: 0.7,
  /** Something leaving. */
  saida: 0.6,
  /** A real layout change, animated at its true size. */
  layout: 1.1,
  /** The clock counting up to the time played. */
  contagem: 1.8,
  /** A highlight lighting up. */
  destaque: 0.6,
  destaqueStagger: 0.14,
  /** A piece crossing the board. */
  lance: 0.22,
  /** The single pulse on check. */
  xeque: 0.7,
  /** A captured piece on its way to the tray. In play, never at the end. */
  captura: 0.32,
  /** Board assembly, square by square. */
  casaStagger: 0.012,
} as const

export const EASE = {
  entrada: 'power1.out',
  saida: 'power1.in',
  layout: 'power2.inOut',
  contagem: 'power2.out',
  xeque: 'sine.inOut',
} as const

/**
 * Tween that respects the preference: with reduced motion the target simply
 * arrives, keeping every onComplete callback intact so game state still flows.
 */
export function tween(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween {
  if (prefersReducedMotion()) {
    const { duration: _d, ease: _e, stagger: _s, delay: _delay, ...rest } = vars
    return gsap.set(target, { ...rest, duration: 0 }) as gsap.core.Tween
  }
  return gsap.to(target, vars)
}

export function timeline(vars?: gsap.TimelineVars): gsap.core.Timeline {
  const tl = gsap.timeline(vars)
  if (prefersReducedMotion()) tl.timeScale(1000)
  return tl
}

export { Flip, gsap }
