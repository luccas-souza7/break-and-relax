# Break And Relax

Um site de uma página onde quem está há horas trabalhando joga **uma** partida de
xadrez ou damas contra a máquina, entende como ela terminou, e volta ao trabalho.

[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-informational)](LICENSE)
[![deploy](https://github.com/luccas-souza7/break-and-relax/actions/workflows/deploy.yml/badge.svg)](https://github.com/luccas-souza7/break-and-relax/actions/workflows/deploy.yml)

**Demo ao vivo:** https://luccas-souza7.github.io/break-and-relax/

![Uma partida de xadrez no Break And Relax: o usuário move o peão de e2 para e4, a máquina responde com o cavalo em f6, e em seguida a partida encerra: o tabuleiro encolhe para abrir espaço e o relógio, parado durante todo o jogo, conta de zero até o tempo que a pausa levou](docs/img/demo.gif)

## O que é

Uma pausa com hora para acabar, e a hora é a partida acabar. Não há cronômetro
correndo contra você, não há cadastro, ranking, streak, notificação nem anúncio.
A frase que governa cada decisão do produto é esta:

> Não queremos que você fique aqui. Queremos que você faça uma pausa e volte
> melhor.

![Tela de início do Break And Relax: o relógio grande mostrando dois traços no lugar dos dígitos, a frase "uma partida. o tempo é seu.", a escolha entre Xadrez e Damas com Xadrez marcado, os níveis Tranquilo, Normal e Desafio com Normal marcado, o botão Começar, o atalho "tanto faz, escolha por mim" e o rodapé de contatos](docs/img/inicio.png)

O relógio é o elemento central da página justamente por não mandar em nada.
Abre mostrando `--:--`, some por completo durante o jogo, e só volta no fim,
contando de `00:00` até quanto a pausa levou, quando isso já não importa mais.

### Quem perdeu precisa entender por quê

A tela de fim é o oposto de um "você perdeu". O tabuleiro continua ali, em 100%
de opacidade, apenas menor, para abrir espaço às linhas que entram embaixo dele.
As casas que decidiram a partida acendem, e a explicação vem com as casas e as
peças reais, nunca um texto genérico.

![Tela de fim do Break And Relax após um xeque-mate: o relógio parado em 03:47 no topo, o tabuleiro com o rei preto em e8 destacado em vinho, a dama branca em f7 destacada em azul e a casa e7 hachurada como indisponível, abaixo o título Xeque-mate com a explicação nomeando as casas, o botão Outra partida e o rodapé de contatos, tudo visível ao mesmo tempo](docs/img/fim-xadrez.png)

São três tipos de destaque, e cada um responde a uma pergunta diferente:

| Destaque | Cor | Responde |
|---|---|---|
| Decisivo | vinho | por que acabou |
| Atacante | azul | quem executou |
| Bloqueado | hachurado | para onde o rei não podia ir |

O terceiro é o que faz um mate ou um afogamento fazer sentido de olhar. Um
clique em qualquer lugar, ou `Esc`, pula a sequência inteira: ninguém é obrigado
a assistir.

## Por que existe

Trabalho de tela empurra a pausa para depois. Quando ela finalmente acontece, em
geral acontece na mesma tela, rolando um feed desenhado para não terminar.

A aposta aqui é que uma pausa precisa de **fim**, e que o fim precisa ser natural
em vez de imposto. Uma partida acaba sozinha. Ela não pede que você volte amanhã,
não guarda seu progresso, não tem o que perder se você fechar a aba no meio.

Essa aposta tem base na literatura, e tem contra ela um achado que este README
apresenta na sequência, em vez de esconder.

## Base científica

Micropausas têm respaldo: Albulescu et al. (2022), meta-análise com 22 amostras e
2.335 participantes, achou efeito sobre vigor (`d = 0,36`) e fadiga (`d = 0,35`),
e sobre desempenho `d = 0,16`, **não significativo** (`p = 0,116`). O HSE
recomenda o mesmo formato para trabalho de tela: pausas curtas e frequentes.

E há uma objeção séria. Kim, Park e Niu (2017), estudo diário com 86
trabalhadores de escritório em 10 dias, viram relaxamento e atividade social
atenuarem a relação entre demanda e afeto negativo, mas **atividade cognitiva
fortalecê-la**, ou seja, piorá-la. Xadrez e damas são atividade cognitiva: este
site é feito do tipo de pausa que esse estudo aponta como o pior dos três.

Some a fisiologia: Troubat et al. (2009) mediram a frequência cardíaca de 20
enxadristas subindo de 75 para 86 bpm durante o jogo, e Dovom et al. (2024) viram
cortisol salivar em alta e vigor em queda em 14 adolescentes, torneio oficial.

A resposta de projeto não promete resultado. Essa fisiologia foi medida em
contexto competitivo (torneio, ranking, resultado valendo), que é o que este site
remove de propósito. Sobra o fator que Hunter e Wu (2016) acharam mais forte em
95 trabalhadores: a pausa ser preferida e escolhida. Não é resultado testado.

## O que a evidência não sustenta

Não afirmo, em primeira pessoa:

- **Que jogar xadrez reduz o estresse.** A evidência aponta o contrário em
  contexto competitivo, e não há estudo sobre partida casual sem placar.
- **Que este site reduz fadiga ou melhora bem-estar.** Ele nunca foi testado. O
  que tem respaldo é a micropausa em geral, com efeito pequeno.
- **Que atividade cognitiva é a melhor forma de recuperar.** Para trabalhador de
  escritório, a evidência favorece relaxamento e socialização.
- **Qualquer alegação de saúde, terapêutica ou clínica.**

> Micropausas curtas e voluntárias têm respaldo científico para reduzir fadiga e
> melhorar o vigor durante a jornada. O Break And Relax é uma forma lúdica e
> opcional de fazer essa pausa, deliberadamente sem cadastro, cronômetro,
> ranking ou gamificação, para não transformar o descanso em mais uma fonte de
> pressão. Não é uma intervenção clínica testada.

## Referências

Estas são todas. Nenhuma outra é citada em lugar nenhum do repositório.

```
Albulescu, P., Macsinga, I., Rusu, A., Sulea, C., Bodnaru, A., Tulbure, B. T. (2022).
"Give me a break!" A systematic review and meta-analysis on the efficacy of micro-breaks
for increasing well-being and performance. PLOS ONE, 17(8), e0272460.
https://doi.org/10.1371/journal.pone.0272460

Kim, S., Park, Y. A., Niu, Q. (2017). Micro-break activities at work to recover from
daily work demands. Journal of Organizational Behavior, 38(1), 28-44.
https://doi.org/10.1002/job.2109

Hunter, E. M., Wu, C. (2016). Give me a better break: Choosing workday break activities
to maximize resource recovery. Journal of Applied Psychology, 101(2), 302-311.
https://doi.org/10.1037/apl0000045

Sonnentag, S., Fritz, C. (2007). The Recovery Experience Questionnaire: Development and
validation of a measure for assessing recuperation and unwinding from work. Journal of
Occupational Health Psychology, 12(3), 204-221.
https://doi.org/10.1037/1076-8998.12.3.204

Troubat, N., Fargeas-Gluck, M. A., Tulppo, M., Dugué, B. (2009). The stress of chess
players as a model to study the effects of psychological stimuli on physiological
responses. European Journal of Applied Physiology, 105(3), 343-349.
https://doi.org/10.1007/s00421-008-0908-2

Dovom, M. M., Fatolahi, H., Nikbin, S. et al. (2024). Effects of Official Chess
Competition on Salivary Cortisol and Mood Swings in Adolescent Girls: A Win-Loss
Approach. Applied Psychophysiology and Biofeedback, 49, 301-311.
https://doi.org/10.1007/s10484-023-09616-z

Collins, E., Cox, A. L. (2014). Switch on to games: Can digital games aid post-work
recovery? International Journal of Human-Computer Studies, 72(8-9), 654-662.
https://doi.org/10.1016/j.ijhcs.2013.12.006

Health and Safety Executive (Reino Unido). Work routine and breaks (orientação sobre
trabalho com equipamento de tela).
https://www.hse.gov.uk/msd/dse/work-routine.htm
```

## Como funciona

### Uma casca, dois jogos

O que sustenta este repositório não são os jogos, é a separação entre eles e a
casca.

`src/shell/` renderiza as telas, cronometra, conversa com o worker e escreve o
desfecho **sem saber que jogo está rodando**. Tudo chega por um contrato em
[`src/types.ts`](src/types.ts):

```ts
interface Jogo<Estado, Lance> {
  id: 'xadrez' | 'damas'
  nome: string
  criarEstado(): Estado
  lancesLegais(e: Estado): Lance[]
  aplicar(e: Estado, l: Lance): Estado
  encerrar(e: Estado): Estado
  vezDe(e: Estado): 'humano' | 'maquina'
  avaliarFim(e: Estado): Desfecho | null   // null = em andamento
  serializar(e: Estado): unknown           // o que o worker precisa ver
  desserializarLance(e: Estado, bruto: unknown): Lance | null
  Tabuleiro: ComponentType<PropsTabuleiro<Estado, Lance>>
  Lateral?: ComponentType<PropsLateral<Estado>>
  criarWorker(): Worker
}
```

As consequências valem mais que o diagrama:

- **Nada em `src/shell/` importa `src/games/*/rules.ts`.** A única menção a
  `src/games/` na casca é o `import()` dinâmico que carrega um jogo.
- **Selecionar peça e escolher a promoção são do jogo.** A casca recebe um lance
  pronto e nunca aprende o que é uma promoção.
- **O `Desfecho` já chega escrito.** Título, explicação e casas para destacar vêm
  prontos, e a casca não sabe o que é um rei.
- **Um worker por jogo**, criado quando a partida começa, com `terminate()` ao
  sair.
- **Carregamento sob demanda.** Abrir o site e jogar xadrez não baixa o código de
  damas.

### Os motores

[`src/engine/minimax.ts`](src/engine/minimax.ts) é genérico e serve os dois
jogos: minimax em forma negamax com poda alfa-beta, ordenação de lances,
aprofundamento iterativo e teto rígido de tempo. Quando o tempo acaba no meio de
uma iteração, a iteração inteira é descartada e a resposta vem da última
profundidade que terminou de verdade.

Ele recebe `fazer` e `desfazer` sobre uma posição mutável, não um `aplicar`
imutável. Isso é deliberado: o chess.js leva cerca de 70 µs para gerar os lances
de uma posição, e clonar a posição a cada nó custaria mais que a própria busca.

| Jogo | Tranquilo | Normal | Desafio | Teto por lance |
|---|---|---|---|---|
| Xadrez | prof. 1, sorteia entre os 3 melhores | prof. até 3 | prof. até 4 mais quiescência | 600 / 600 / 1000 ms |
| Damas | prof. 4, sorteia entre os 3 melhores | prof. 6 | prof. 8 | 600 / 600 / 1000 ms |

Damas comporta profundidade muito maior que xadrez com o mesmo orçamento porque
a captura obrigatória corta o fator de ramificação de forma agressiva.

A resposta da máquina é sempre segurada por no mínimo 350 ms nos dois jogos:
resposta instantânea parece bug e quebra o ritmo da pausa.

**Por que Web Worker.** A busca do Desafio no xadrez consome perto de um segundo
de CPU por lance, e na thread principal isso congelaria a interface. Como o
GitHub Pages não permite configurar `Cross-Origin-Opener-Policy` e
`Cross-Origin-Embedder-Policy`, nada aqui depende de `SharedArrayBuffer`.

**Uma nota sobre o chess.js**
([`internoChessJs.ts`](src/games/xadrez/internoChessJs.ts)). As regras vêm
inteiramente do chess.js, mas a busca não usa a API pública
`moves({ verbose: true })`. Cada objeto `Move` que ela devolve regenera a lista
completa de lances legais para desambiguar o SAN e serializa dois FENs. Medido
numa posição de meio-jogo, isso dá cerca de 3000 µs por chamada contra cerca de
70 µs do gerador que está por baixo, 40 vezes mais caro, o que inviabiliza
qualquer busca real. Nenhuma regra é reimplementada; o que se evita é a
formatação que uma busca nunca lê.

### As regras de damas

Escritas do zero em [`src/games/damas/rules.ts`](src/games/damas/rules.ts), sem
biblioteca. As quatro que decidem partidas:

1. **Captura é obrigatória.** Havendo captura, nenhum lance simples é legal.
2. **Lei da maioria.** Entre as sequências possíveis, é obrigatório escolher a
   que captura mais peças. Empate na quantidade, escolha livre. Sem lei da
   qualidade e sem sopro.
3. **Promoção só ao terminar** na última fileira. Uma pedra que apenas *passa*
   por ela no meio de uma captura continua pedra.
4. **Dama voa.** Anda e captura à distância, pousando em qualquer casa livre
   depois da peça capturada. Nunca se saltam duas peças coladas, e as capturadas
   só saem do tabuleiro no fim da sequência: até lá elas ainda bloqueiam.

![Partida de damas com captura obrigatória em curso: a pedra clara de d4 está selecionada, o primeiro salto já foi dado em f6, e as duas casas onde a sequência pode terminar, h8 e h4, aparecem aneladas. Nenhuma outra peça clara pode ser movida, porque havendo captura nenhum lance simples é legal](docs/img/partida-damas.png)

Na interface, uma captura múltipla é percorrida **um salto por vez**: a peça fica
selecionada e só o próximo destino acende, então nunca fica sem explicação por
que um clique foi recusado.

### Nenhuma tela rola

Início, partida e fim cabem na viewport. Não por `overflow: hidden`, que corta,
mas por um layout que cresce sozinho quando a compressão se esgota:

```css
.app {
  height: 100dvh;          /* faz o grid de linhas funcionar */
  min-height: min-content; /* cresce quando não couber mais */
  overflow-y: auto;        /* válvula: só aparece se realmente passou */
  overflow-x: clip;        /* horizontal nunca rola */
}
```

As telas são grids de linhas com o tabuleiro em `minmax(240px, 1fr)`: ele recebe
a altura que sobra e nunca empurra ninguém, então as três linhas a mais da tela
de fim o encolhem por si só, sem JavaScript medindo nada e sem
`transform: scale`, que não abriria espaço de verdade. 240px é o piso de
legibilidade, e é ele que o `min-content` soma para decidir que a página
realmente ficou sem espaço.

## Stack

- Vite, React 18 e TypeScript
- Tailwind CSS v4 (plugin oficial do Vite, sem arquivo de configuração)
- `chess.js` para todas as regras do xadrez
- Motor próprio: minimax com poda alfa-beta em Web Worker, um por jogo
- GSAP (core mais Flip) para a sequência de animação
- shadcn/ui (`button`, `dialog`, `tooltip`) e `lucide-react`
- Fontes auto-hospedadas via Fontsource: Bricolage Grotesque, Public Sans e
  Martian Mono
- `vite-plugin-pwa` só para precache, sem manifesto e sem prompt de instalação
- Deploy estático via GitHub Actions para GitHub Pages

Não há backend, banco, API em runtime nem CDN.

## Rodando localmente

```bash
npm install
```

```bash
npm run dev
```

Para conferir a build de produção:

```bash
npm run preview
```

Para regerar todas as imagens de `docs/img/` do zero:

```bash
npm run screenshots
```

O script sobe o dev server, tira os cinco PNGs e grava o GIF, e derruba o server.
Ele roda contra `npm run dev` de propósito: os hooks determinísticos de
`src/dev/testHooks.ts` só existem em desenvolvimento e desaparecem da build de
produção.

Para regerar a imagem que aparece quando o link é compartilhado:

```bash
npm run og
```

O cartão é montado com as fontes e as cores do próprio site, e o cavalo sai de
`public/favicon.svg`, o mesmo arquivo que a guia do navegador mostra. O
`public/og.png` resultante é versionado de propósito: o deploy roda apenas
`npm ci` e `npm run build`, nunca o Playwright, então a imagem precisa já estar
no repositório.

## Estrutura do projeto

```
src/
  shell/          telas, relógio, worker, desfecho. Não conhece jogo nenhum
  engine/         minimax genérico com poda alfa-beta
  anim/           vocabulário de movimento (durações e curvas)
  dev/            hooks de teste, só em desenvolvimento
  games/
    xadrez/       regras via chess.js, avaliação, tabuleiro, worker
    damas/        regras próprias, avaliação, tabuleiro, worker
  types.ts        o contrato entre a casca e um jogo
scripts/
  screenshots.mjs gera docs/img/ inteiro
  og.mjs          gera public/og.png, o cartao do compartilhamento
docs/
  evidencia.md    o aprofundamento científico e normativo
  img/            prints e GIF, todos gerados por script
```

## Acessibilidade

- Contraste **WCAG AA** em todo texto. O token de texto secundário foi escurecido
  6% em relação ao valor original do design, que media 4,11:1 contra o piso de
  4,5:1, preservando a matiz.
- Tabuleiro navegável por teclado, com `role="grid"` e `aria-label` descrevendo
  cada casa (a peça e a coordenada).
- Indicador de vez em `aria-live="polite"`.
- `prefers-reduced-motion` respeitado: com movimento reduzido a sequência de fim
  chega ao mesmo estado final, instantaneamente e sem nada se mexer.
- Rolagem **horizontal nunca**, em nenhum tamanho nem zoom. Em zoom de 400% o
  conteúdo continua alcançável, rolando na vertical se precisar, que é o que o
  WCAG 1.4.10 permite.
- Foco visível em todo elemento interativo.
- Sem som, sem vibração e sem notificação.

## Créditos

As peças de xadrez são o conjunto **Cburnett**, de Colin M. L. Burnett,
distribuído sob [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Os arquivos estão em `src/assets/pieces/`, sem modificações. É o mesmo conjunto
usado pelo Lichess.

As peças de damas são desenhadas em SVG e CSS na paleta do projeto.

## Licença

MIT, veja [LICENSE](LICENSE).

A licença MIT cobre o **código** deste repositório. As peças Cburnett são
**assets de terceiros** e seguem a licença própria delas, CC BY-SA 3.0, como
indicado acima.

## Contato

- LinkedIn: https://www.linkedin.com/in/luccas-souza7/
- GitHub: https://github.com/luccas-souza7
- WhatsApp: https://wa.me/5511932018859
- E-mail: luccasnsouza1@gmail.com
