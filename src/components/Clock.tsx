import { forwardRef } from 'react'

import { formatDuration } from '@/game/time'

/**
 * The clock that has no authority.
 *
 * It opens the page showing "--:--", a clock refusing to count. It is absent
 * for the whole game. It comes back at the end to say how long the break
 * took, once that no longer matters.
 */

type ClockProps = {
  /** Left undefined, the clock shows its idle face. */
  milliseconds?: number
}

export const Clock = forwardRef<HTMLDivElement, ClockProps>(function Clock(
  { milliseconds },
  ref,
) {
  const label = milliseconds === undefined ? '--:--' : formatDuration(milliseconds)
  return (
    <div
      ref={ref}
      className="relogio text-[clamp(3.25rem,17vw,8.5rem)]"
      aria-live="off"
    >
      {label}
    </div>
  )
})
