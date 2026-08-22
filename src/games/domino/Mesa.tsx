import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { canAnimateEntrance, gsap } from '@/anim/motion'
import type { PropsTabuleiro } from '@/types'
import { Pedra } from './Pedra'
import {
  nomeDaPedra,
  pontas,
  type EstadoDomino,
  type LanceDomino,
  type Ponta,
} from './rules'

/** Base unit: a normal stone is two units wide, a double one. */
const UNIDADE = 28
const LARGURA_MINIMA = 22

/**
 * The dominoes table.
 *
 * The chain runs horizontally and is scaled to fit; below a readable size it
 * scrolls instead, and follows the last stone played. There is no snake and
 * no L-bend — the two end chips above are what tell you what can be played,
 * so nobody has to squint down the line to find out.
 */
export function Mesa({
  estado,
  lancesLegais,
  interativo,
  destaques,
  onLance,
  entranceKey,
}: PropsTabuleiro<EstadoDomino, LanceDomino>) {
  const raizRef = useRef<HTMLDivElement>(null)
  const trilhoRef = useRef<HTMLDivElement>(null)
  const correnteRef = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)
  const [escolhida, setEscolhida] = useState<string | null>(null)

  const extremos = pontas(estado.mesa)
  const realce = useMemo(
    () => new Map(destaques.map((d) => [d.chave, d.tipo])),
    [destaques],
  )

  /** Which ends each stone in hand can go on. */
  const opcoes = useMemo(() => {
    const mapa = new Map<string, Ponta[]>()
    for (const lance of lancesLegais) {
      if (lance.tipo !== 'jogar') continue
      mapa.set(lance.pedra, [...(mapa.get(lance.pedra) ?? []), lance.ponta])
    }
    return mapa
  }, [lancesLegais])

  const larguraDaCorrente = useMemo(
    () => estado.mesa.reduce((total, p) => total + (p.carroca ? UNIDADE : UNIDADE * 2), 0),
    [estado.mesa],
  )

  /* Scale to fit, and only fall back to scrolling once it would be too small
     to read. */
  useLayoutEffect(() => {
    const trilho = trilhoRef.current
    if (!trilho) return
    const medir = () => {
      const disponivel = trilho.clientWidth
      if (larguraDaCorrente === 0 || disponivel === 0) return setEscala(1)
      const cabe = disponivel / larguraDaCorrente
      const minima = LARGURA_MINIMA / (UNIDADE * 2)
      setEscala(Math.max(minima, Math.min(1, cabe)))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(trilho)
    return () => observador.disconnect()
  }, [larguraDaCorrente])

  /* When it no longer fits, keep the last stone played in view. */
  useEffect(() => {
    const trilho = trilhoRef.current
    if (!trilho) return
    trilho.scrollTo({
      left: trilho.scrollWidth,
      behavior: canAnimateEntrance() ? 'smooth' : 'auto',
    })
  }, [estado.mesa.length])

  useEffect(() => {
    const raiz = raizRef.current
    if (!raiz || !canAnimateEntrance()) return
    const contexto = gsap.context(() => {
      gsap.from('[data-anim="pedra-mao"]', {
        opacity: 0,
        y: 8,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.05,
      })
    }, raiz)
    return () => contexto.revert()
  }, [entranceKey])

  const jogar = useCallback(
    (pedra: string, ponta: Ponta) => {
      setEscolhida(null)
      onLance({ tipo: 'jogar', pedra, ponta })
    },
    [onLance],
  )

  const tocarPedra = useCallback(
    (id: string) => {
      if (!interativo) return
      const pontasPossiveis = opcoes.get(id)
      if (!pontasPossiveis || pontasPossiveis.length === 0) return
      if (pontasPossiveis.length === 1) {
        jogar(id, pontasPossiveis[0])
        return
      }
      // Fits both ends: let the player say which.
      setEscolhida((atual) => (atual === id ? null : id))
    },
    [interativo, jogar, opcoes],
  )

  const precisaComprar = lancesLegais.some((l) => l.tipo === 'comprar')
  const precisaPassar = lancesLegais.some((l) => l.tipo === 'passar')

  return (
    <div ref={raizRef} className="flex w-full flex-col items-center gap-4">
      {/* The two ends, large and always visible. */}
      <div className="flex items-center gap-3">
        <Chip rotulo="ponta esquerda" valor={extremos?.esquerda} />
        <span className="text-xs text-tinta-fraca">dorme: {estado.dorme.length}</span>
        <Chip rotulo="ponta direita" valor={extremos?.direita} />
      </div>

      <div
        ref={trilhoRef}
        className="w-full overflow-x-auto"
        style={{ height: UNIDADE * 2 * escala + 8 }}
      >
        <div
          ref={correnteRef}
          aria-label="Mesa"
          className="flex items-center"
          style={{
            width: larguraDaCorrente,
            height: UNIDADE * 2,
            transform: `scale(${escala})`,
            transformOrigin: 'left center',
          }}
        >
          {estado.mesa.map((pedra) => (
            <div
              key={pedra.id}
              data-destaque={realce.get(pedra.id)}
              className={[
                'flex shrink-0 items-center justify-center',
                realce.get(pedra.id) === 'decisivo' ? 'rounded-[4px] ring-2 ring-alerta' : '',
              ].join(' ')}
              style={{ width: pedra.carroca ? UNIDADE : UNIDADE * 2, height: UNIDADE * 2 }}
            >
              <div style={{ width: pedra.carroca ? UNIDADE : UNIDADE * 2 }}>
                <Pedra a={pedra.esquerda} b={pedra.direita} atravessada={pedra.carroca} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The hand. Anything unplayable is dimmed and inert — a click that is
          accepted and then refused is worse than no click at all. */}
      <ul className="flex flex-wrap items-end justify-center gap-2" aria-label="Sua mão">
        {estado.maoHumano.map((pedra) => {
          const pontasPossiveis = opcoes.get(pedra.id) ?? []
          const jogavel = interativo && pontasPossiveis.length > 0
          const aberta = escolhida === pedra.id
          return (
            <li key={pedra.id} data-anim="pedra-mao" className="relative">
              <button
                type="button"
                disabled={!jogavel}
                onClick={() => tocarPedra(pedra.id)}
                aria-label={`${nomeDaPedra(pedra)}${jogavel ? '' : ', não jogável'}`}
                className={[
                  'block w-8 rounded-[3px] transition-transform',
                  jogavel ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default',
                  aberta ? '-translate-y-1 ring-2 ring-acento' : '',
                ].join(' ')}
              >
                <Pedra a={pedra.a} b={pedra.b} deitada={false} apagada={!jogavel} />
              </button>

              {aberta && (
                <div className="absolute -top-9 left-1/2 flex -translate-x-1/2 gap-1">
                  <button
                    type="button"
                    onClick={() => jogar(pedra.id, 'esquerda')}
                    aria-label={`Jogar ${nomeDaPedra(pedra)} na ponta esquerda`}
                    className="rounded-md border border-acento px-2 py-1 text-xs text-acento"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => jogar(pedra.id, 'direita')}
                    aria-label={`Jogar ${nomeDaPedra(pedra)} na ponta direita`}
                    className="rounded-md border border-acento px-2 py-1 text-xs text-acento"
                  >
                    ▶
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {(precisaComprar || precisaPassar) && interativo && (
        <button
          type="button"
          onClick={() => onLance(precisaComprar ? { tipo: 'comprar' } : { tipo: 'passar' })}
          className="rounded-md border border-acento px-4 py-2 text-sm text-acento"
        >
          {precisaComprar ? 'Comprar do dorme' : 'Passar'}
        </button>
      )}
    </div>
  )
}

function Chip({ rotulo, valor }: { rotulo: string; valor: number | undefined }) {
  return (
    <div
      aria-label={`${rotulo}: ${valor ?? 'livre'}`}
      className="flex size-11 items-center justify-center rounded-md border border-border bg-superficie font-mono text-lg font-medium text-tinta"
    >
      {valor ?? '–'}
    </div>
  )
}
