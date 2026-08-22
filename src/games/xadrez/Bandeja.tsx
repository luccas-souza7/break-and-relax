import type { PropsLateral } from '@/types'
import { ORDEM_PECA, nomeDaPeca } from './nomes'
import { PIECE_SVG } from './pieces'
import type { EstadoXadrez } from './rules'
import type { PecaCapturada } from './tipos'

function ordenar(pecas: PecaCapturada[]): PecaCapturada[] {
  return [...pecas].sort((a, b) => ORDEM_PECA[a.tipo] - ORDEM_PECA[b.tipo])
}

function Fila({ pecas, rotulo }: { pecas: PecaCapturada[]; rotulo: string }) {
  return (
    <ul
      aria-label={rotulo}
      className="flex min-h-6 flex-row flex-wrap content-start gap-0.5 md:flex-col md:gap-0"
    >
      {ordenar(pecas).map((peca) => (
        <li key={peca.id} className="md:-mt-3 md:first:mt-0">
          <img
            src={PIECE_SVG[peca.cor][peca.tipo]}
            alt={nomeDaPeca(peca.cor, peca.tipo)}
            className="size-6 opacity-70 md:size-7"
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * Captured pieces. Deliberately no count and no material score — that would
 * be a scoreboard, and this game does not keep score.
 */
export function Bandeja({ estado }: PropsLateral<EstadoXadrez>) {
  const meus = estado.capturadasPeloHumano
  const dela = estado.capturadasPelaMaquina

  return (
    <div
      data-bandeja
      className="flex w-full flex-row items-start justify-between gap-4 md:w-16 md:flex-col md:justify-start md:gap-6"
    >
      <Fila pecas={meus} rotulo="Peças que você capturou" />
      {/* The rule only earns its place once there is something to separate. */}
      {meus.length > 0 && dela.length > 0 && (
        <div aria-hidden="true" className="hidden h-px w-full bg-border md:block" />
      )}
      <Fila pecas={dela} rotulo="Peças que a máquina capturou" />
    </div>
  )
}
