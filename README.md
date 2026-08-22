# Break And Relax

Um site de uma página onde alguém que está há horas trabalhando joga uma partida de xadrez contra a máquina, do começo ao fim, e volta ao trabalho. A ideia que governa o produto é simples: não queremos que você fique aqui, queremos que você faça uma pausa e volte melhor. O limite não é um cronômetro, é a partida acabar — não existe contagem regressiva, tempo por lance ou aviso de que a pausa está terminando. Sem cadastro, sem ranking, sem streak, sem notificação, sem anúncio. Quando a partida acaba, o site diz uma frase curta e para de falar.

O relógio é o elemento central da página justamente por não mandar em nada: abre mostrando `--:--`, some por completo durante o jogo, e volta no fim para dizer quanto tempo a pausa levou, quando isso já não importa mais.

## Site

https://luccas-souza7.github.io/break-and-relax/

## Tela de início

![Tela de início do Break And Relax](docs/tela-inicio.png)

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v4 (plugin oficial do Vite)
- chess.js — todas as regras do jogo
- Motor próprio: minimax com poda alfa-beta, em Web Worker
- GSAP (core) para a sequência de animação
- shadcn/ui (`button`, `dialog`, `tooltip`) e lucide-react
- Fontes auto-hospedadas via Fontsource: Bricolage Grotesque, Public Sans, Martian Mono
- Deploy estático via GitHub Actions para GitHub Pages

Não há backend, banco, API em runtime nem CDN. Depois do primeiro carregamento o site funciona offline.

## Como o motor funciona

O código do motor está em `src/engine/`.

**Avaliação** (`evaluation.ts`) — material (peão 100, cavalo 320, bispo 330, torre 500, dama 900), *piece-square tables* no estilo da avaliação simplificada de Michniewski, com tabela separada de rei para meio-jogo e final, mais um pequeno bônus de mobilidade. Xeque-mate vale ±100000 ajustado pela profundidade, para que um mate mais curto seja preferido.

**Busca** (`search.ts`) — minimax em forma negamax com poda alfa-beta, ordenação de lances por MVV-LVA (capturas de peça valiosa por peça barata primeiro, promoções em seguida) e aprofundamento iterativo. Cada nível tem um teto rígido de tempo: quando o tempo acaba no meio de uma iteração, a iteração inteira é descartada e a resposta vem da última profundidade que terminou de verdade — uma profundidade pela metade joga pior que uma profundidade menor completa.

| Nível | Profundidade | Teto | Comportamento |
|---|---|---|---|
| Tranquilo | 1 | 600 ms | sorteia entre os 3 melhores lances com peso decrescente; não pune erro bobo |
| Normal | até 3 | 600 ms | joga o melhor lance da busca |
| Desafio | até 4 + quiescência em capturas | 1000 ms | joga o melhor lance da busca |

A resposta da máquina é sempre segurada por no mínimo 350 ms, mesmo quando o cálculo termina antes: resposta instantânea parece bug e quebra o ritmo da pausa.

**Por que Web Worker** — a busca do nível Desafio consome perto de um segundo de CPU por lance. Na thread principal isso congelaria a interface: a animação travaria e o clique não responderia. No worker a UI continua fluida enquanto a máquina pensa. O worker é *stateless* — cada requisição carrega o FEN da posição —, o que torna impossível o motor e o tabuleiro saírem de sincronia. Como o GitHub Pages não permite configurar os headers `Cross-Origin-Opener-Policy` e `Cross-Origin-Embedder-Policy`, nada aqui depende de `SharedArrayBuffer`; a comunicação é por mensagem.

**Uma nota sobre o chess.js** (`internal.ts`) — as regras vêm inteiramente do chess.js, mas a busca não usa a API pública `moves({ verbose: true })`. Cada objeto `Move` que ela devolve regenera a lista completa de lances legais para desambiguar o SAN e serializa dois FENs (`before` e `after`). Medido numa posição de meio-jogo, isso dá cerca de 3000 µs por chamada contra cerca de 70 µs do gerador que está por baixo — 40 vezes mais caro, o que inviabiliza qualquer busca real. Por isso a busca chama o gerador diretamente. Nenhuma regra de xadrez é reimplementada: o que se evita é apenas a formatação que uma busca nunca lê. Tudo que o usuário toca continua passando pela API pública.

## Como rodar local

```bash
npm i
```

```bash
npm run dev
```

Para gerar a build de produção:

```bash
npm run build
```

## Peças

O conjunto de peças é o **Cburnett**, de Colin M. L. Burnett, distribuído sob [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Os arquivos estão em `src/assets/pieces/`, sem modificações. É o mesmo conjunto usado pelo Lichess.

## Licença

MIT — veja [LICENSE](LICENSE). A licença cobre o código deste repositório; as peças Cburnett seguem sob CC BY-SA 3.0, como indicado acima.

## Contato

- LinkedIn — https://www.linkedin.com/in/luccas-souza7/
- GitHub — https://github.com/luccas-souza7
- WhatsApp — https://wa.me/5511932018859
- E-mail — luccasnsouza1@gmail.com
