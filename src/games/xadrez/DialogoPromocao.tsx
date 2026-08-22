import type { PieceSymbol } from 'chess.js'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { nomeDaPeca } from './nomes'
import { PIECE_SVG } from './pieces'

/** No default is pre-selected: the choice is always made deliberately. */
const OPTIONS: PieceSymbol[] = ['q', 'r', 'b', 'n']

type PropsDialogoPromocao = {
  open: boolean
  onChoose: (piece: PieceSymbol) => void
  onCancel: () => void
}

export function DialogoPromocao({ open, onChoose, onCancel }: PropsDialogoPromocao) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent className="bg-superficie sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold">
            Escolha a peça
          </DialogTitle>
          <DialogDescription className="text-tinta-fraca">
            Seu peão chegou à última fileira.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map((piece) => (
            <button
              key={piece}
              type="button"
              onClick={() => onChoose(piece)}
              className="flex aspect-square items-center justify-center rounded-md border border-border bg-fundo p-2 transition-colors hover:bg-casa-clara"
            >
              <img
                src={PIECE_SVG.w[piece]}
                alt={nomeDaPeca('w', piece)}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
