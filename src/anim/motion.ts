import gsap from 'gsap'

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

export const DURATION = {
  clockIn: 0.5,
  stagger: 0.06,
  squareStagger: 0.012,
  move: 0.18,
  capture: 0.28,
  checkPulse: 0.45,
  fade: 0.4,
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

export { gsap }
