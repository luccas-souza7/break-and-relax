import type { Nivel } from '@/types'

export const NIVEIS: Nivel[] = ['tranquilo', 'normal', 'desafio']

export const ROTULOS_NIVEL: Record<Nivel, string> = {
  tranquilo: 'Tranquilo',
  normal: 'Normal',
  desafio: 'Desafio',
}
