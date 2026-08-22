import { forwardRef } from 'react'

import { formatDuration } from './time'

/**
 * The clock that has no authority.
 *
 * It opens the page showing "--:--", a clock refusing to count. It is absent
 * for the whole game. It comes back at the end to say how long the break
 * took, once that no longer matters.
 */

type PropsRelogio = {
  /** Left undefined, the clock shows its idle face. */
  milliseconds?: number
}

export const Relogio = forwardRef<HTMLDivElement, PropsRelogio>(function Relogio(
  { milliseconds },
  ref,
) {
  const label = milliseconds === undefined ? '--:--' : formatDuration(milliseconds)
  return (
    <div
      ref={ref}
      className="relogio text-[clamp(40px,11dvh,120px)]"
      aria-live="off"
    >
      {label}
    </div>
  )
})
