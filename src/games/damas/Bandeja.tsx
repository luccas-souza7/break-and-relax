import type { PropsLateral } from '@/types'
import type { EstadoDamas, PecaDamas } from './rules'

function Fila({ pecas, rotulo }: { pecas: PecaDamas[]; rotulo: string }) {
  return (
    <ul
      aria-label={rotulo}
      className="flex min-h-6 flex-row flex-wrap content-start gap-1 md:flex-col"
    >
      {pecas.map((peca) => (
        <li key={peca.id}>
          <span
            role="img"
            aria-label={`${peca.dama ? 'dama' : 'pedra'} ${peca.cor}`}
            className={[
              'block size-5 rounded-full border-2 border-tinta opacity-70',
              peca.cor === 'clara' ? 'bg-superficie' : 'bg-tinta',
            ].join(' ')}
          />
        </li>
      ))}
    </ul>
  )
}

/** Captured pieces. No count, no score — this game does not keep one. */
export function Bandeja({ estado }: PropsLateral<EstadoDamas>) {
  const meus = estado.capturadasPeloHumano
  const dela = estado.capturadasPelaMaquina
  return (
    <div
      data-bandeja
      className="flex w-full flex-row items-start justify-between gap-4 md:w-16 md:flex-col md:justify-start md:gap-6"
    >
      <Fila pecas={meus} rotulo="Peças que você capturou" />
      {meus.length > 0 && dela.length > 0 && (
        <div aria-hidden="true" className="hidden h-px w-full bg-border md:block" />
      )}
      <Fila pecas={dela} rotulo="Peças que a máquina capturou" />
    </div>
  )
}
