import type { IdJogo, Nivel } from '@/types'

export const NIVEIS: Nivel[] = ['tranquilo', 'normal', 'desafio']

export const ROTULOS_NIVEL: Record<Nivel, string> = {
  tranquilo: 'Tranquilo',
  normal: 'Normal',
  desafio: 'Desafio',
}

/** Chess comes pre-selected; it is the one everybody knows. */
export const JOGOS: IdJogo[] = ['xadrez', 'damas']

export const ROTULOS_JOGO: Record<IdJogo, string> = {
  xadrez: 'Xadrez',
  damas: 'Damas',
  domino: 'Dominó',
}
