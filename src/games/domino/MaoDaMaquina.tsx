import type { PropsLateral } from '@/types'
import { Pedra } from './Pedra'
import { nomeDaPedra, somaDaMao, type EstadoDomino } from './rules'

/**
 * The machine's hand, revealed only once the game is over.
 *
 * Without this the ending cannot be checked: "you had 9 points, it had 4" is
 * just a claim unless the stones are on screen. During the game it shows
 * nothing but how many stones are left.
 */
export function MaoDaMaquina({ estado, fim }: PropsLateral<EstadoDomino>) {
  const mao = estado.maoMaquina

  return (
    <div data-bandeja className="flex w-full flex-col items-start gap-2 md:w-24">
      <p className="text-xs text-tinta-fraca">
        {fim ? `mão da máquina · ${somaDaMao(mao)} pontos` : `máquina: ${mao.length} pedras`}
      </p>
      {fim && (
        <ul className="flex flex-row flex-wrap gap-1 md:flex-col" aria-label="Mão da máquina">
          {mao.map((pedra) => (
            <li key={pedra.id} className="w-7 opacity-70" aria-label={nomeDaPedra(pedra)}>
              <Pedra a={pedra.a} b={pedra.b} deitada={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
