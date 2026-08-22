import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { PieceSymbol, Square } from 'chess.js'

import { DURATION, canAnimateEntrance, gsap, prefersReducedMotion, tween } from '@/anim/motion'
import type { PropsTabuleiro } from '@/types'
import { DialogoPromocao } from './DialogoPromocao'
import { Peca } from './Peca'
import { FILES, RANKS, colOf, isLightSquare, rowOf, squareAt } from './board'
import { descreverCasa } from './nomes'
import { PIECE_SVG } from './pieces'
import { HUMANO, type EstadoXadrez, type LanceXadrez } from './rules'
import type { PecaVista } from './tipos'

/**
 * The chessboard, and everything about touching it.
 *
 * Selecting a piece, offering the legal destinations and asking which piece a
 * pawn becomes are all handled here: the shell receives a finished move and
 * never learns what a promotion is.
 */
export function Tabuleiro({
  estado,
  lancesLegais,
  interativo,
  destaques,
  onLance,
  entranceKey,
}: PropsTabuleiro<EstadoXadrez, LanceXadrez>) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const squaresRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pieceEls = useRef(new Map<string, HTMLDivElement>())
  const placed = useRef(new Map<string, Square>())
  const previous = useRef<PecaVista[]>([])
  const [cursor, setCursor] = useState<Square>('e2')
  const [selecionada, setSelecionada] = useState<Square | null>(null)
  const [promocao, setPromocao] = useState<{ de: Square; para: Square } | null>(null)

  const pecas = estado.pecas
  const ultimoLance = estado.ultimoLance

  /** Legal destinations for the selected piece; true marks a capture. */
  const alvos = useMemo(() => {
    const mapa = new Map<Square, boolean>()
    if (!selecionada) return mapa
    for (const lance of lancesLegais) {
      if (lance.de !== selecionada) continue
      mapa.set(lance.para, mapa.get(lance.para) === true || lance.captura)
    }
    return mapa
  }, [lancesLegais, selecionada])

  const limpar = useCallback(() => setSelecionada(null), [])

  /** One tap selects, the next tap moves. No drag and drop anywhere. */
  const tocarCasa = useCallback(
    (casa: Square) => {
      if (!interativo) return

      if (selecionada === casa) {
        limpar()
        return
      }

      if (selecionada) {
        const possiveis = lancesLegais.filter((l) => l.de === selecionada && l.para === casa)
        if (possiveis.length > 0) {
          if (possiveis.some((l) => l.promocao)) {
            setPromocao({ de: selecionada, para: casa })
            return
          }
          limpar()
          onLance(possiveis[0])
          return
        }
      }

      const peca = pecas.find((p) => p.casa === casa)
      setSelecionada(peca && peca.cor === HUMANO ? casa : null)
    },
    [interativo, lancesLegais, limpar, onLance, pecas, selecionada],
  )

  const escolherPromocao = useCallback(
    (peca: PieceSymbol) => {
      if (!promocao) return
      const lance = lancesLegais.find(
        (l) => l.de === promocao.de && l.para === promocao.para && l.promocao === peca,
      )
      setPromocao(null)
      limpar()
      if (lance) onLance(lance)
    },
    [lancesLegais, limpar, onLance, promocao],
  )

  /** A captured piece shrinks and slides to the tray, then is gone. */
  const voarParaBandeja = useCallback((peca: PecaVista) => {
    const layer = layerRef.current
    if (!layer || prefersReducedMotion()) return

    const col = colOf(peca.casa)
    const row = rowOf(peca.casa)

    const fantasma = document.createElement('div')
    fantasma.className = 'pointer-events-none absolute top-0 left-0 h-[12.5%] w-[12.5%]'
    const imagem = document.createElement('img')
    imagem.src = PIECE_SVG[peca.cor][peca.tipo]
    imagem.alt = ''
    imagem.className = 'h-full w-full'
    fantasma.appendChild(imagem)
    layer.appendChild(fantasma)
    gsap.set(fantasma, { xPercent: col * 100, yPercent: row * 100 })

    const board = frameRef.current?.getBoundingClientRect()
    // The tray lives in the shell's side column, so it is found by attribute
    // rather than by a ref threaded across the contract.
    const bandeja = document.querySelector('[data-bandeja]')?.getBoundingClientRect()
    let dx = 0
    let dy = 0
    if (board && bandeja && bandeja.width > 0) {
      const tamanho = board.width / 8
      dx = bandeja.left + bandeja.width / 2 - (board.left + (col + 0.5) * tamanho)
      dy = bandeja.top + bandeja.height / 2 - (board.top + (row + 0.5) * tamanho)
    }

    gsap.to(fantasma, {
      x: dx,
      y: dy,
      scale: 0.6,
      opacity: 0,
      duration: DURATION.capture,
      ease: 'power2.in',
      onComplete: () => fantasma.remove(),
    })
  }, [])

  /* Placement lives in GSAP, never in React's render output, so a move tweens
     one element instead of repainting the grid. */
  useLayoutEffect(() => {
    for (const peca of pecas) {
      const el = pieceEls.current.get(peca.id)
      if (!el) continue
      const x = colOf(peca.casa) * 100
      const y = rowOf(peca.casa) * 100
      const conhecida = placed.current.get(peca.id)

      if (conhecida === undefined) {
        gsap.set(el, { xPercent: x, yPercent: y, x: 0, y: 0, scale: 1, opacity: 1 })
      } else if (conhecida !== peca.casa) {
        tween(el, { xPercent: x, yPercent: y, duration: DURATION.move, ease: 'power2.out' })
      }
      placed.current.set(peca.id, peca.casa)
    }

    /* Anything that left the position was captured. The farewell is played on
       a throwaway clone owned by GSAP, not by React: a purely visual effect
       has no business triggering another render of the board. */
    const vivas = new Set(pecas.map((p) => p.id))
    const idas = previous.current.filter((p) => !vivas.has(p.id))
    previous.current = pecas
    for (const peca of idas) {
      placed.current.delete(peca.id)
      voarParaBandeja(peca)
    }
  }, [pecas, voarParaBandeja])

  /* Check: the border pulses once. Once. */
  useEffect(() => {
    if (estado.xeques <= 0 || !pulseRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      pulseRef.current,
      { borderColor: 'rgba(158, 59, 78, 0)' },
      {
        borderColor: 'rgba(158, 59, 78, 1)',
        duration: DURATION.checkPulse / 2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      },
    )
  }, [estado.xeques])

  /* Entrance: the board assembles square by square, on a diagonal. */
  useEffect(() => {
    const grid = squaresRef.current
    if (!grid || !canAnimateEntrance()) return
    const contexto = gsap.context(() => {
      gsap.from('[data-square]', {
        opacity: 0,
        duration: 0.22,
        ease: 'power1.out',
        stagger: { each: DURATION.squareStagger, from: 'start' },
      })
    }, grid)
    return () => contexto.revert()
  }, [entranceKey])

  const focarCasa = useCallback((casa: Square) => {
    squaresRef.current
      ?.querySelector<HTMLButtonElement>('[data-square="' + casa + '"]')
      ?.focus()
  }, [])

  const aoTeclar = useCallback(
    (evento: KeyboardEvent<HTMLDivElement>) => {
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const delta = deltas[evento.key]
      if (delta) {
        evento.preventDefault()
        const row = Math.min(7, Math.max(0, rowOf(cursor) + delta[0]))
        const col = Math.min(7, Math.max(0, colOf(cursor) + delta[1]))
        const proxima = squareAt(row, col)
        setCursor(proxima)
        focarCasa(proxima)
        return
      }
      if (evento.key === 'Escape' && selecionada) {
        evento.preventDefault()
        limpar()
      }
    },
    [cursor, focarCasa, limpar, selecionada],
  )

  const ocupante = useMemo(() => new Map(pecas.map((p) => [p.casa, p])), [pecas])
  const realce = useMemo(
    () => new Map(destaques.map((d) => [d.chave, d.tipo])),
    [destaques],
  )

  return (
    // container-type is what makes `cqw` resolve: the coordinates size
    // against the board's own width, not the viewport's.
    <div ref={frameRef} className="relative aspect-square w-full [container-type:inline-size]">
      <div
        ref={squaresRef}
        role="grid"
        aria-label="Tabuleiro de xadrez"
        onKeyDown={aoTeclar}
        className="absolute inset-0 grid grid-rows-8"
      >
        {RANKS.map((rank, row) => (
          <div key={rank} role="row" className="grid grid-cols-8">
            {FILES.map((_file, col) => {
              const casa = squareAt(row, col)
              const peca = ocupante.get(casa)
              const alvo = alvos.has(casa)
              const captura = alvos.get(casa) === true
              const escolhida = selecionada === casa
              const ultima = ultimoLance?.de === casa || ultimoLance?.para === casa
              const tipoRealce = realce.get(casa)
              return (
                <button
                  key={casa}
                  type="button"
                  role="gridcell"
                  data-square={casa}
                  tabIndex={cursor === casa ? 0 : -1}
                  aria-label={descreverCasa(casa, peca)}
                  aria-selected={escolhida}
                  onFocus={() => setCursor(casa)}
                  onClick={() => tocarCasa(casa)}
                  className={[
                    'relative flex items-center justify-center focus-visible:z-20',
                    isLightSquare(row, col) ? 'bg-casa-clara' : 'bg-casa-escura',
                  ].join(' ')}
                >
                  {ultima && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-casa-escura/45 mix-blend-multiply"
                    />
                  )}
                  {escolhida && (
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

                  {/*
                    Coordinates live inside the squares, never in an outer
                    gutter: a gutter would centre the board-plus-gutter, and
                    what has to be centred is the board. Hidden from the
                    reading order — every square's aria-label already opens
                    with its notation, and repeating it is just noise.
                  */}
                  {col === 0 && (
                    <span
                      aria-hidden="true"
                      className={[
                        'pointer-events-none absolute top-[3%] left-[5%] font-mono font-medium opacity-55',
                        'text-[clamp(8px,1.1cqw,11px)] leading-none',
                        isLightSquare(row, col) ? 'text-casa-escura' : 'text-casa-clara',
                      ].join(' ')}
                    >
                      {RANKS[row]}
                    </span>
                  )}
                  {row === 7 && (
                    <span
                      aria-hidden="true"
                      className={[
                        'pointer-events-none absolute right-[5%] bottom-[3%] font-mono font-medium opacity-55',
                        'text-[clamp(8px,1.1cqw,11px)] leading-none',
                        isLightSquare(row, col) ? 'text-casa-escura' : 'text-casa-clara',
                      ].join(' ')}
                    >
                      {FILES[col]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Pieces sit above the grid and are positioned only by transform. */}
      <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        {pecas.map((peca) => (
          <Peca
            key={peca.id}
            cor={peca.cor}
            tipo={peca.tipo}
            innerRef={(el: HTMLDivElement | null) => {
              if (el) pieceEls.current.set(peca.id, el)
              else pieceEls.current.delete(peca.id)
            }}
          />
        ))}
      </div>

      {/* Border used only for the single check pulse. */}
      <div
        ref={pulseRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 border-2 border-transparent"
      />

      <DialogoPromocao
        open={promocao !== null}
        onChoose={escolherPromocao}
        onCancel={() => {
          setPromocao(null)
          limpar()
        }}
      />
    </div>
  )
}
