import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { DURACAO, EASE, canAnimateEntrance, gsap, prefersReducedMotion, tween } from '@/anim/motion'
import type { PropsTabuleiro } from '@/types'
import { Disco } from './Disco'
import {
  casaEm,
  casaEscura,
  colunaDe,
  linhaDe,
  notacao,
  type EstadoDamas,
  type LanceDamas,
  type PecaDamas,
} from './rules'

const COLUNAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const LINHAS = ['8', '7', '6', '5', '4', '3', '2', '1']

function descrever(casa: number, peca: PecaDamas | undefined): string {
  if (!peca) return `${notacao(casa)}, casa vazia`
  const cor = peca.cor === 'clara' ? 'clara' : 'escura'
  return `${notacao(casa)}, ${peca.dama ? 'dama' : 'pedra'} ${cor}`
}

/**
 * The draughts board.
 *
 * Compulsory capture is enforced by what the rules hand over: when a capture
 * exists, those are the only legal moves, so only the pieces that can take
 * are selectable. A multiple capture is walked one landing square at a time:
 * the piece stays selected and the next hop lights up, so it is never
 * unclear why a click was refused.
 */
export function Tabuleiro({
  estado,
  lancesLegais,
  interativo,
  destaques,
  onLance,
  entranceKey,
}: PropsTabuleiro<EstadoDamas, LanceDamas>) {
  const frameRef = useRef<HTMLDivElement>(null)
  const gradeRef = useRef<HTMLDivElement>(null)
  const camadaRef = useRef<HTMLDivElement>(null)
  const elementos = useRef(new Map<string, HTMLDivElement>())
  const posicionadas = useRef(new Map<string, number>())
  const anteriores = useRef<PecaDamas[]>([])
  const [cursor, setCursor] = useState(casaEm(5, 2))
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const [prefixo, setPrefixo] = useState<number[]>([])

  const pecas = estado.pecas

  /** Moves still compatible with the hops chosen so far. */
  const candidatos = useMemo(() => {
    if (selecionada === null) return []
    return lancesLegais.filter(
      (l) => l.de === selecionada && prefixo.every((casa, i) => l.passos[i] === casa),
    )
  }, [lancesLegais, prefixo, selecionada])

  const proximos = useMemo(() => {
    const mapa = new Map<number, boolean>()
    for (const lance of candidatos) {
      if (lance.passos.length <= prefixo.length) continue
      const casa = lance.passos[prefixo.length]
      mapa.set(casa, mapa.get(casa) === true || lance.capturadas.length > 0)
    }
    return mapa
  }, [candidatos, prefixo])

  /** Pieces that may be picked up at all. */
  const jogaveis = useMemo(() => new Set(lancesLegais.map((l) => l.de)), [lancesLegais])

  const limpar = useCallback(() => {
    setSelecionada(null)
    setPrefixo([])
  }, [])

  const tocarCasa = useCallback(
    (casa: number) => {
      if (!interativo) return

      if (proximos.has(casa)) {
        const novo = [...prefixo, casa]
        const completo = candidatos.find(
          (l) => l.passos.length === novo.length && l.passos.every((p, i) => p === novo[i]),
        )
        if (completo) {
          limpar()
          onLance(completo)
          return
        }
        setPrefixo(novo)
        return
      }

      // Starting over is always allowed, mid-sequence included.
      if (jogaveis.has(casa)) {
        setSelecionada(casa)
        setPrefixo([])
        return
      }
      limpar()
    },
    [candidatos, interativo, jogaveis, limpar, onLance, prefixo, proximos],
  )

  /** A captured piece shrinks and slides to the tray, then is gone. */
  const voarParaBandeja = useCallback((peca: PecaDamas) => {
    const camada = camadaRef.current
    if (!camada || prefersReducedMotion()) return

    const coluna = colunaDe(peca.casa)
    const linha = linhaDe(peca.casa)
    const fantasma = document.createElement('div')
    fantasma.className = 'pointer-events-none absolute top-0 left-0 h-[12.5%] w-[12.5%]'
    fantasma.innerHTML =
      `<div style="width:70%;height:70%;margin:15%;border-radius:9999px;background:${
        peca.cor === 'clara' ? 'var(--superficie)' : 'var(--tinta)'
      };border:2px solid var(--tinta)"></div>`
    camada.appendChild(fantasma)
    gsap.set(fantasma, { xPercent: coluna * 100, yPercent: linha * 100 })

    const tabuleiro = frameRef.current?.getBoundingClientRect()
    const bandeja = document.querySelector('[data-bandeja]')?.getBoundingClientRect()
    let dx = 0
    let dy = 0
    if (tabuleiro && bandeja && bandeja.width > 0) {
      const tamanho = tabuleiro.width / 8
      dx = bandeja.left + bandeja.width / 2 - (tabuleiro.left + (coluna + 0.5) * tamanho)
      dy = bandeja.top + bandeja.height / 2 - (tabuleiro.top + (linha + 0.5) * tamanho)
    }

    gsap.to(fantasma, {
      x: dx,
      y: dy,
      scale: 0.6,
      opacity: 0,
      duration: DURACAO.captura,
      ease: 'power2.in',
      onComplete: () => fantasma.remove(),
    })
  }, [])

  /* Placement lives in GSAP, never in React's render output. */
  useLayoutEffect(() => {
    for (const peca of pecas) {
      const el = elementos.current.get(peca.id)
      if (!el) continue
      const x = colunaDe(peca.casa) * 100
      const y = linhaDe(peca.casa) * 100
      const conhecida = posicionadas.current.get(peca.id)
      if (conhecida === undefined) {
        gsap.set(el, { xPercent: x, yPercent: y, x: 0, y: 0, scale: 1, opacity: 1 })
      } else if (conhecida !== peca.casa) {
        tween(el, { xPercent: x, yPercent: y, duration: DURACAO.lance, ease: 'power2.out' })
      }
      posicionadas.current.set(peca.id, peca.casa)
    }

    const vivas = new Set(pecas.map((p) => p.id))
    const idas = anteriores.current.filter((p) => !vivas.has(p.id))
    anteriores.current = pecas
    for (const peca of idas) {
      posicionadas.current.delete(peca.id)
      voarParaBandeja(peca)
    }
  }, [pecas, voarParaBandeja])

  /* Entrance: the board assembles square by square, on a diagonal. */
  useEffect(() => {
    const grade = gradeRef.current
    if (!grade || !canAnimateEntrance()) return
    const contexto = gsap.context(() => {
      gsap.from('[data-square]', {
        opacity: 0,
        duration: DURACAO.entrada,
        ease: EASE.entrada,
        stagger: { each: DURACAO.casaStagger, from: 'start' },
      })
    }, grade)
    return () => contexto.revert()
  }, [entranceKey])

  const aoTeclar = useCallback(
    (evento: React.KeyboardEvent<HTMLDivElement>) => {
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const delta = deltas[evento.key]
      if (delta) {
        evento.preventDefault()
        const linha = Math.min(7, Math.max(0, linhaDe(cursor) + delta[0]))
        const coluna = Math.min(7, Math.max(0, colunaDe(cursor) + delta[1]))
        const proxima = casaEm(linha, coluna)
        setCursor(proxima)
        gradeRef.current
          ?.querySelector<HTMLButtonElement>(`[data-square="${proxima}"]`)
          ?.focus()
        return
      }
      if (evento.key === 'Escape' && selecionada !== null) {
        evento.preventDefault()
        limpar()
      }
    },
    [cursor, limpar, selecionada],
  )

  const ocupante = useMemo(() => new Map(pecas.map((p) => [p.casa, p])), [pecas])
  const realce = useMemo(
    () => new Map(destaques.map((d) => [Number(d.chave), d.tipo])),
    [destaques],
  )
  const rota = useMemo(() => new Set(prefixo), [prefixo])

  return (
    <div ref={frameRef} className="relative aspect-square w-full [container-type:inline-size]">
      <div
        ref={gradeRef}
        role="grid"
        aria-label="Tabuleiro de damas"
        onKeyDown={aoTeclar}
        className="absolute inset-0 grid grid-rows-8"
      >
        {LINHAS.map((rotuloLinha, linha) => (
          <div key={rotuloLinha} role="row" className="grid grid-cols-8">
            {COLUNAS.map((_c, coluna) => {
              const casa = casaEm(linha, coluna)
              const escura = casaEscura(linha, coluna)
              const peca = ocupante.get(casa)
              const alvo = proximos.has(casa)
              const captura = proximos.get(casa) === true
              const escolhida = selecionada === casa
              const ultima =
                estado.ultimoLance?.de === casa || estado.ultimoLance?.para === casa
              const tipoRealce = realce.get(casa)
              return (
                <button
                  key={casa}
                  type="button"
                  role="gridcell"
                  data-square={casa}
                  tabIndex={cursor === casa ? 0 : -1}
                  aria-label={descrever(casa, peca)}
                  aria-selected={escolhida}
                  onFocus={() => setCursor(casa)}
                  onClick={() => tocarCasa(casa)}
                  className={[
                    'relative flex items-center justify-center focus-visible:z-20',
                    escura ? 'bg-casa-escura' : 'bg-casa-clara',
                  ].join(' ')}
                >
                  {ultima && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-casa-escura/45 mix-blend-multiply"
                    />
                  )}
                  {(escolhida || rota.has(casa)) && (
                    <span aria-hidden="true" className="absolute inset-0 bg-acento/25" />
                  )}
                  {alvo && !captura && (
                    <span
                      aria-hidden="true"
                      className="relative h-[22%] w-[22%] rounded-full bg-acento/55"
                    />
                  )}
                  {alvo && captura && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-[7%] rounded-full border-4 border-acento/55"
                    />
                  )}

                  {tipoRealce && (
                    <span
                      data-destaque={tipoRealce}
                      aria-hidden="true"
                      className={[
                        'pointer-events-none absolute inset-0',
                        tipoRealce === 'decisivo'
                          ? 'border-2 border-alerta bg-alerta/35'
                          : tipoRealce === 'atacante'
                            ? 'border-2 border-acento'
                            : 'bg-tinta-fraca/20',
                      ].join(' ')}
                      style={
                        tipoRealce === 'bloqueado'
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(45deg, var(--tinta-fraca) 0 1px, transparent 1px 6px)',
                            }
                          : undefined
                      }
                    />
                  )}

                  {/* Coordinates sit inside the squares, same as chess. */}
                  {coluna === 0 && (
                    <span
                      aria-hidden="true"
                      className={[
                        'pointer-events-none absolute top-[3%] left-[5%] font-mono font-medium opacity-55',
                        'text-[clamp(8px,1.1cqw,11px)] leading-none',
                        escura ? 'text-casa-clara' : 'text-casa-escura',
                      ].join(' ')}
                    >
                      {rotuloLinha}
                    </span>
                  )}
                  {linha === 7 && (
                    <span
                      aria-hidden="true"
                      className={[
                        'pointer-events-none absolute right-[5%] bottom-[3%] font-mono font-medium opacity-55',
                        'text-[clamp(8px,1.1cqw,11px)] leading-none',
                        escura ? 'text-casa-clara' : 'text-casa-escura',
                      ].join(' ')}
                    >
                      {COLUNAS[coluna]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div ref={camadaRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        {pecas.map((peca) => (
          <Disco
            key={peca.id}
            cor={peca.cor}
            dama={peca.dama}
            innerRef={(el: HTMLDivElement | null) => {
              if (el) elementos.current.set(peca.id, el)
              else elementos.current.delete(peca.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}
