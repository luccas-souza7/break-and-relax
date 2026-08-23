import type { EstadoDamas, PecaDamas } from '@/games/damas/rules'
import type { EstadoXadrez } from '@/games/xadrez/rules'
import type { IdJogo } from '@/types'

/**
 * Hooks that exist only while developing, so the screenshots are deterministic.
 *
 * Without them a print depends on the machine answering the same way on every
 * run, which it never does: the search is bounded by wall clock, so the depth
 * it reaches changes with whatever else the CPU is doing.
 *
 * Nothing here is imported by the product. `App.tsx` calls `registrarHooks`
 * inside a branch guarded by `import.meta.env.DEV`, which Vite replaces with
 * `false` for a production build, and the whole module then drops out as dead
 * code. `npm run build` is checked for the string `__br` to prove it.
 *
 * The module has no top level side effect on purpose, because that is what
 * lets the bundler discard it.
 */

export type ApiTeste = {
  jogoAtual: () => IdJogo | null
  definirEstado: (estado: unknown) => void
  definirTempo: (ms: number) => void
  abrirPartida: () => Promise<void>
  voltarAoInicio: () => void
  encerrarPartida: () => void
}

declare global {
  interface Window {
    __brSetPosition?: (posicao: string) => Promise<void>
    __brSetTela?: (tela: 'inicio' | 'partida' | 'fim') => Promise<void>
    __brSetTempo?: (segundos: number) => void
    __brSelecionar?: (casa: string) => void
  }
}

/* ---- draughts positions ---- */

/**
 * Draughts has no FEN, so a position arrives by name. Playing into one is not
 * an option: reaching a capture takes real moves, and every machine reply in
 * between is time bounded and therefore not reproducible.
 *
 * Geometry, matching `rules.ts`: `casa = linha * 8 + coluna`, row 0 is rank 8,
 * play happens where `(linha + coluna) % 2 === 1`, and the light pieces (the
 * user) climb the board.
 */
const casaDe = (notacao: string): number => {
  const coluna = 'abcdefgh'.indexOf(notacao[0])
  const linha = 8 - Number(notacao[1])
  return linha * 8 + coluna
}

const pedra = (cor: 'clara' | 'escura', notacao: string): PecaDamas => {
  const casa = casaDe(notacao)
  return { id: `${cor === 'clara' ? 'c' : 'e'}${casa}`, cor, dama: false, casa }
}

/**
 * A midgame where exactly one light piece can capture, and it can do it twice.
 *
 * The light man on d4 takes e5 and lands on f6, and from there it can carry on
 * either over g7 to h8 or over g5 to h4. Both sequences take two, so the
 * majority law leaves the choice open and the board asks for the next hop
 * rather than playing the whole thing. No other light piece has a capture at
 * all, which is compulsory capture doing its work: they cannot even be picked
 * up.
 *
 * The machine's last move was f6 to e5, which is what walked into it.
 */
function capturaObrigatoria(): EstadoDamas {
  const claras = ['d4', 'a3', 'c3', 'e3', 'g3', 'b2', 'd2', 'f2', 'c1', 'e1', 'g1']
  const escuras = ['e5', 'g5', 'b6', 'd6', 'h6', 'a7', 'c7', 'e7', 'g7', 'd8', 'f8']
  return {
    pecas: [
      ...claras.map((casa) => pedra('clara', casa)),
      ...escuras.map((casa) => pedra('escura', casa)),
    ],
    vez: 'clara',
    capturadasPeloHumano: [pedra('escura', 'b8')],
    capturadasPelaMaquina: [pedra('clara', 'a1')],
    ultimoLance: { de: casaDe('f6'), para: casaDe('e5') },
    lancesEstereis: 0,
    encerradaPeloUsuario: false,
  }
}

const POSICOES_DAMAS: Record<string, () => EstadoDamas> = {
  'captura-obrigatoria': capturaObrigatoria,
}

/* ---- chess positions ---- */

/**
 * Built here rather than through the game contract, which has no "state from a
 * position" entry and should not grow one for a development tool. The import
 * is dynamic so the static graph stays clean: the shell still reaches a game
 * only through the loader in `App.tsx`.
 */
async function estadoDeFen(fen: string): Promise<EstadoXadrez> {
  const [{ Chess }, { lerPecas }] = await Promise.all([
    import('chess.js'),
    import('@/games/xadrez/pieceTracker'),
  ])
  const chess = new Chess(fen)
  return {
    chess,
    versao: 0,
    pecas: lerPecas(chess),
    capturadasPeloHumano: [],
    capturadasPelaMaquina: [],
    ultimoLance: null,
    xeques: 0,
    encerradaPeloUsuario: false,
  }
}

/* ---- installation ---- */

export function registrarHooks(api: ApiTeste): () => void {
  /**
   * A FEN when chess is loaded, a name from `POSICOES_DAMAS` when draughts is.
   * Every chess position used for a print has White to move, otherwise the
   * worker answers and the print stops being reproducible. A finished position
   * is safe either way, because the machine is never asked once there is an
   * outcome.
   */
  window.__brSetPosition = async (posicao: string) => {
    const jogo = api.jogoAtual()
    if (jogo === 'xadrez') {
      api.definirEstado(await estadoDeFen(posicao))
      return
    }
    if (jogo === 'damas') {
      const construir = POSICOES_DAMAS[posicao]
      if (!construir) {
        throw new Error(
          `posicao de damas desconhecida: ${posicao}. Conhecidas: ${Object.keys(POSICOES_DAMAS).join(', ')}`,
        )
      }
      api.definirEstado(construir())
      return
    }
    throw new Error('__brSetPosition precisa de uma partida em andamento')
  }

  window.__brSetTela = async (tela) => {
    if (tela === 'inicio') return api.voltarAoInicio()
    if (tela === 'partida') return api.abrirPartida()
    return api.encerrarPartida()
  }

  /**
   * Set this before the position that ends the game. The shell only fills the
   * elapsed time in if it is still zero, so a value put here survives.
   */
  window.__brSetTempo = (segundos: number) => api.definirTempo(segundos * 1000)

  /**
   * Clicks the square for real instead of reaching into the board's state.
   * Selection belongs to each game, and driving the actual interface means the
   * highlight in the print is the genuine one, with no product code changed to
   * make a screenshot possible.
   */
  window.__brSelecionar = (casa: string) => {
    const chave = api.jogoAtual() === 'damas' ? String(casaDe(casa)) : casa
    const alvo = document.querySelector<HTMLElement>(`[data-square="${chave}"]`)
    if (!alvo) throw new Error(`casa nao encontrada: ${casa}`)
    alvo.click()
  }

  return () => {
    delete window.__brSetPosition
    delete window.__brSetTela
    delete window.__brSetTempo
    delete window.__brSelecionar
  }
}
