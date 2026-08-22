import { memo } from 'react'

type PropsPedra = {
  a: number
  b: number
  /** Doubles lie across the line — the signature look of a domino table. */
  atravessada?: boolean
  /** Reading direction along the line, for stones already laid. */
  deitada?: boolean
  apagada?: boolean
}

const PONTOS: Record<number, Array<[number, number]>> = {
  0: [],
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

function Metade({ valor, vertical }: { valor: number; vertical: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={vertical ? 'h-1/2 w-full' : 'h-full w-1/2'}>
      {PONTOS[valor].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="var(--tinta)" />
      ))}
    </svg>
  )
}

/** A domino in the project's palette: no wood, no ivory, no heavy shadow. */
function PedraBase({ a, b, atravessada = false, deitada = true, apagada = false }: PropsPedra) {
  // Laid along the line, a normal stone reads left to right; a double is
  // turned across it. In the hand, stones stand upright.
  const vertical = deitada ? atravessada : true
  return (
    <div
      className={[
        'flex overflow-hidden rounded-[3px] border border-tinta bg-superficie',
        vertical ? 'flex-col' : 'flex-row',
        apagada ? 'opacity-35' : '',
      ].join(' ')}
      style={{ aspectRatio: vertical ? '1 / 2' : '2 / 1' }}
    >
      <Metade valor={a} vertical={vertical} />
      <div
        aria-hidden="true"
        className={vertical ? 'h-px w-full bg-tinta-fraca' : 'h-full w-px bg-tinta-fraca'}
      />
      <Metade valor={b} vertical={vertical} />
    </div>
  )
}

export const Pedra = memo(PedraBase)
