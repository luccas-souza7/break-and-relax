import type { PieceSymbol } from 'chess.js'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PIECE_SVG, pieceName } from '@/game/pieces'

/** No default is pre-selected: the choice is always made deliberately. */
const OPTIONS: PieceSymbol[] = ['q', 'r', 'b', 'n']

type PromotionDialogProps = {
  open: boolean
  onChoose: (piece: PieceSymbol) => void
  onCancel: () => void
}

export function PromotionDialog({ open, onChoose, onCancel }: PromotionDialogProps) {
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
                alt={pieceName('w', piece)}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
