import type { Desfecho, Destaque } from '@/types'

/**
 * Dominoes, one against one, double-six. Pure TypeScript — no React, no DOM.
 *
 * One hand, not a race to a score: the game ends when somebody goes out or
 * the table locks, and that is the whole match.
 *
 * A double is laid across the line, which is how dominoes look, but it opens
 * no third end: the table always has exactly two.
 */

export type Lado = 'humano' | 'maquina'

export type Pedra = {
  /** Stable across the game: "6|4". Also the key used for highlights. */
  id: string
  a: number
  b: number
}

/** A stone on the table, with the orientation it was laid in. */
export type PedraNaMesa = {
  id: string
  /** Reading left to right along the line. */
  esquerda: number
  direita: number
  carroca: boolean
}

export type Ponta = 'esquerda' | 'direita'

export type LanceDomino =
  | { tipo: 'jogar'; pedra: string; ponta: Ponta }
  | { tipo: 'comprar' }
  | { tipo: 'passar' }

export type EstadoDomino = {
  readonly mesa: PedraNaMesa[]
  readonly maoHumano: Pedra[]
  readonly maoMaquina: Pedra[]
  readonly dorme: Pedra[]
  readonly vez: Lado
  /** Two passes in a row with an empty boneyard locks the game. */
  readonly passesSeguidos: number
  readonly historico: string[]
  readonly encerradaPeloUsuario: boolean
  /** Numbers the user passed on: what the hardest level infers from. */
  readonly passouEm: number[]
}

export const pontos = (pedra: Pedra) => pedra.a + pedra.b
export const ehCarroca = (pedra: Pedra) => pedra.a === pedra.b
export const somaDaMao = (mao: Pedra[]) => mao.reduce((total, p) => total + pontos(p), 0)

export function nomeDaPedra(pedra: Pedra): string {
  return `${pedra.a}|${pedra.b}`
}

/* ---- setup ---- */

function baralho(): Pedra[] {
  const pedras: Pedra[] = []
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) pedras.push({ id: `${a}|${b}`, a, b })
  }
  return pedras
}

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Highest double opens; with no double at all, the heaviest stone does. */
function quemComeca(maoHumano: Pedra[], maoMaquina: Pedra[]): Lado {
  const melhor = (mao: Pedra[]) => {
    const carrocas = mao.filter(ehCarroca)
    if (carrocas.length) return { carroca: true, valor: Math.max(...carrocas.map((p) => p.a)) }
    return { carroca: false, valor: Math.max(...mao.map(pontos)) }
  }
  const h = melhor(maoHumano)
  const m = melhor(maoMaquina)
  if (h.carroca !== m.carroca) return h.carroca ? 'humano' : 'maquina'
  return h.valor >= m.valor ? 'humano' : 'maquina'
}

export function criarEstado(): EstadoDomino {
  const pedras = embaralhar(baralho())
  const maoHumano = pedras.slice(0, 7)
  const maoMaquina = pedras.slice(7, 14)
  const dorme = pedras.slice(14)
  return {
    mesa: [],
    maoHumano,
    maoMaquina,
    dorme,
    vez: quemComeca(maoHumano, maoMaquina),
    passesSeguidos: 0,
    historico: [],
    encerradaPeloUsuario: false,
    passouEm: [],
  }
}

/* ---- the two ends ---- */

export function pontas(mesa: PedraNaMesa[]): { esquerda: number; direita: number } | null {
  if (mesa.length === 0) return null
  return { esquerda: mesa[0].esquerda, direita: mesa[mesa.length - 1].direita }
}

const maoDe = (e: EstadoDomino, lado: Lado) => (lado === 'humano' ? e.maoHumano : e.maoMaquina)

export function encaixa(pedra: Pedra, e: EstadoDomino, ponta: Ponta): boolean {
  const extremos = pontas(e.mesa)
  if (!extremos) return true
  const numero = ponta === 'esquerda' ? extremos.esquerda : extremos.direita
  return pedra.a === numero || pedra.b === numero
}

export function lancesLegais(e: EstadoDomino): LanceDomino[] {
  if (e.encerradaPeloUsuario || avaliarFim(e)) return []
  const mao = maoDe(e, e.vez)
  const saidas: LanceDomino[] = []

  for (const pedra of mao) {
    // On an empty table the two ends are the same move, and it has to be
    // named the same way everywhere or a valid answer gets rejected as
    // unrecognised.
    if (e.mesa.length === 0) {
      saidas.push({ tipo: 'jogar', pedra: pedra.id, ponta: 'direita' })
      continue
    }
    for (const ponta of ['esquerda', 'direita'] as Ponta[]) {
      if (encaixa(pedra, e, ponta)) saidas.push({ tipo: 'jogar', pedra: pedra.id, ponta })
    }
  }

  if (saidas.length > 0) return saidas
  // Nothing playable: draw while the boneyard lasts, otherwise pass.
  return e.dorme.length > 0 ? [{ tipo: 'comprar' }] : [{ tipo: 'passar' }]
}

/* ---- applying ---- */

function assentar(mesa: PedraNaMesa[], pedra: Pedra, ponta: Ponta): PedraNaMesa[] {
  const carroca = ehCarroca(pedra)
  const extremos = pontas(mesa)
  if (!extremos) {
    return [{ id: pedra.id, esquerda: pedra.a, direita: pedra.b, carroca }]
  }
  if (ponta === 'esquerda') {
    // The stone's right half has to meet the number on the left end.
    const encaixado: PedraNaMesa =
      pedra.b === extremos.esquerda
        ? { id: pedra.id, esquerda: pedra.a, direita: pedra.b, carroca }
        : { id: pedra.id, esquerda: pedra.b, direita: pedra.a, carroca }
    return [encaixado, ...mesa]
  }
  const encaixado: PedraNaMesa =
    pedra.a === extremos.direita
      ? { id: pedra.id, esquerda: pedra.a, direita: pedra.b, carroca }
      : { id: pedra.id, esquerda: pedra.b, direita: pedra.a, carroca }
  return [...mesa, encaixado]
}

const outro = (lado: Lado): Lado => (lado === 'humano' ? 'maquina' : 'humano')
const nomeDoLado = (lado: Lado) => (lado === 'humano' ? 'você' : 'máquina')

export function aplicar(e: EstadoDomino, lance: LanceDomino): EstadoDomino {
  if (lance.tipo === 'comprar') {
    if (e.dorme.length === 0) return e
    const comprada = e.dorme[0]
    const dorme = e.dorme.slice(1)
    return {
      ...e,
      dorme,
      maoHumano: e.vez === 'humano' ? [...e.maoHumano, comprada] : e.maoHumano,
      maoMaquina: e.vez === 'maquina' ? [...e.maoMaquina, comprada] : e.maoMaquina,
      historico: [...e.historico, `${nomeDoLado(e.vez)} comprou`],
      // Drawing does not pass the turn: you draw until you can play.
      passesSeguidos: 0,
    }
  }

  if (lance.tipo === 'passar') {
    return {
      ...e,
      vez: outro(e.vez),
      passesSeguidos: e.passesSeguidos + 1,
      historico: [...e.historico, `${nomeDoLado(e.vez)} passou`],
      passouEm:
        e.vez === 'humano'
          ? [...new Set([...e.passouEm, ...abertos(e)])]
          : e.passouEm,
    }
  }

  const mao = maoDe(e, e.vez)
  const pedra = mao.find((p) => p.id === lance.pedra)
  if (!pedra) return e
  if (!encaixa(pedra, e, lance.ponta)) return e

  const restante = mao.filter((p) => p.id !== pedra.id)
  return {
    ...e,
    mesa: assentar(e.mesa, pedra, lance.ponta),
    maoHumano: e.vez === 'humano' ? restante : e.maoHumano,
    maoMaquina: e.vez === 'maquina' ? restante : e.maoMaquina,
    vez: outro(e.vez),
    passesSeguidos: 0,
    historico: [...e.historico, `${nomeDoLado(e.vez)} ${nomeDaPedra(pedra)}`],
  }
}

/** The numbers on the table right now. */
function abertos(e: EstadoDomino): number[] {
  const extremos = pontas(e.mesa)
  return extremos ? [...new Set([extremos.esquerda, extremos.direita])] : []
}

export function encerrar(e: EstadoDomino): EstadoDomino {
  if (e.encerradaPeloUsuario || avaliarFim(e)) return e
  return { ...e, encerradaPeloUsuario: true }
}

export function vezDe(e: EstadoDomino): 'humano' | 'maquina' {
  return e.vez
}

/* ---- endings ---- */

const ENCERRADA: Desfecho = {
  resultado: 'encerrada',
  titulo: 'Encerrada',
  explicacao: 'A pausa era esse tempo mesmo.',
  destaques: [],
}

/** The last stone laid is what answers "why did it end". */
function ultimaPedra(e: EstadoDomino): Destaque[] {
  const ultima = e.historico.length > 0 ? e.mesa[e.mesa.length - 1] : undefined
  return ultima ? [{ chave: ultima.id, tipo: 'decisivo' }] : []
}

export function avaliarFim(e: EstadoDomino): Desfecho | null {
  if (e.encerradaPeloUsuario) return ENCERRADA

  const meus = somaDaMao(e.maoHumano)
  const dela = somaDaMao(e.maoMaquina)

  if (e.maoHumano.length === 0) {
    return {
      resultado: 'vitoria',
      titulo: 'Você bateu',
      explicacao: 'Jogou sua última pedra.',
      destaques: ultimaPedra(e),
    }
  }

  if (e.maoMaquina.length === 0) {
    return {
      resultado: 'derrota',
      titulo: 'A máquina bateu',
      explicacao: `Ela jogou a última pedra dela. Você ficou com ${e.maoHumano.length} pedra(s), somando ${meus} pontos.`,
      destaques: ultimaPedra(e),
    }
  }

  if (e.passesSeguidos >= 2 && e.dorme.length === 0) {
    const contagem = `Ninguém tinha pedra para jogar nas pontas e o dorme acabou. Conta quem tem menos pontos na mão: você ${meus}, máquina ${dela}.`
    if (meus === dela) {
      return {
        resultado: 'empate',
        titulo: 'Jogo trancado',
        explicacao: `Ninguém podia jogar e vocês dois ficaram com ${meus} pontos na mão. Empate.`,
        destaques: ultimaPedra(e),
      }
    }
    return {
      resultado: meus < dela ? 'vitoria' : 'derrota',
      titulo: 'Jogo trancado',
      explicacao: contagem,
      destaques: ultimaPedra(e),
    }
  }

  return null
}

export function historico(e: EstadoDomino): string[] {
  return e.historico
}

/* ---- worker protocol ---- */

/**
 * The machine is told what it can actually see: the table, its own hand, how
 * many stones the user holds, how big the boneyard is, and which numbers the
 * user has passed on. Handing it the user's hand would be cheating.
 */
export type VistaDaMaquina = {
  mesa: PedraNaMesa[]
  mao: Pedra[]
  pedrasDoHumano: number
  dorme: number
  passouEm: number[]
}

export function serializar(e: EstadoDomino): VistaDaMaquina {
  return {
    mesa: e.mesa,
    mao: e.maoMaquina,
    pedrasDoHumano: e.maoHumano.length,
    dorme: e.dorme.length,
    passouEm: e.passouEm,
  }
}

export function desserializarLance(e: EstadoDomino, bruto: unknown): LanceDomino | null {
  const lance = bruto as LanceDomino | null
  if (!lance || typeof lance.tipo !== 'string') return null
  const legais = lancesLegais(e)
  return (
    legais.find((l) =>
      l.tipo === 'jogar' && lance.tipo === 'jogar'
        ? l.pedra === lance.pedra && l.ponta === lance.ponta
        : l.tipo === lance.tipo,
    ) ?? null
  )
}
