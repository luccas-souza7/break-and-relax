/*
 * Gera public/THIRD-PARTY-NOTICES.txt: npm run notices
 *
 * MIT, BSD e Apache pedem que o aviso de copyright acompanhe as copias
 * distribuidas. Um site empacotado normalmente nao leva aviso nenhum, porque o
 * bundler joga fora os comentarios e ninguem repoe. Este script repoe, e o
 * arquivo vai junto com a build, alcancavel na raiz do site publicado.
 *
 * Percorre o fecho transitivo de "dependencies" (o que de fato chega ao
 * navegador), nunca devDependencies, que ficam na maquina de quem constroi.
 *
 * Alem dos pacotes, entram os assets que nao vem do npm e tem licenca propria,
 * como as pecas de xadrez. Eles estao em ASSETS, escritos a mao, porque nao ha
 * package.json de onde ler.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MODULOS = join(RAIZ, 'node_modules')
const SAIDA = join(RAIZ, 'public', 'THIRD-PARTY-NOTICES.txt')

/** Nomes de arquivo de licenca, na ordem em que valem a pena ser procurados. */
const ARQUIVOS = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'license', 'COPYING']

/* Assets versionados que nao sao pacotes npm e tem licenca propria. */
const ASSETS = [
  {
    nome: 'Pecas de xadrez Cburnett',
    versao: 'src/assets/pieces/, public/favicon.svg, public/og.png',
    licenca: 'CC BY-SA 3.0',
    texto: [
      'Conjunto de pecas de xadrez de Colin M. L. Burnett.',
      'Licenca: Creative Commons Attribution-ShareAlike 3.0 Unported.',
      'Texto completo: https://creativecommons.org/licenses/by-sa/3.0/',
      '',
      'As pecas em src/assets/pieces/ estao sem modificacao.',
      '',
      'O logo do site e OBRA DERIVADA de uma delas, a "Chess klt45.svg", e por',
      'isso carrega a mesma licenca, e nao a MIT do repositorio. Sao dois',
      'arquivos: public/favicon.svg, que redesenha os contornos da peca como',
      'silhueta cheia, sem traco, com olho e narina vazados e enquadramento',
      'fechado de 45 para 37 unidades; e public/og.png, que embute esse mesmo',
      'desenho ampliado.',
      '',
      'Share-alike: quem reusar ou modificar esses dois arquivos precisa manter',
      'esta licenca e esta atribuicao.',
    ].join('\n'),
  },
]

function lerPacote(nome) {
  const pasta = join(MODULOS, nome)
  const manifesto = join(pasta, 'package.json')
  if (!existsSync(manifesto)) return null
  const pkg = JSON.parse(readFileSync(manifesto, 'utf8'))
  const arquivo = ARQUIVOS.map((f) => join(pasta, f)).find((c) => existsSync(c))
  return {
    nome: pkg.name ?? nome,
    versao: pkg.version ?? '',
    licenca: typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'nao declarada'),
    dependencias: Object.keys(pkg.dependencies ?? {}),
    /* Sem arquivo de licenca no pacote, o que sobra e o campo declarado. O
       gsap e assim: a licenca dele vive numa URL, nao num arquivo. */
    texto: arquivo ? readFileSync(arquivo, 'utf8').trim() : null,
  }
}

/* Fecho transitivo a partir das dependencias de producao. */
const raiz = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'))
const fila = Object.keys(raiz.dependencies ?? {})
const vistos = new Set()
const pacotes = []

while (fila.length > 0) {
  const nome = fila.shift()
  if (vistos.has(nome)) continue
  vistos.add(nome)
  const pacote = lerPacote(nome)
  if (!pacote) continue
  pacotes.push(pacote)
  fila.push(...pacote.dependencias)
}

pacotes.sort((a, b) => a.nome.localeCompare(b.nome))

const semTexto = pacotes.filter((p) => !p.texto).map((p) => `${p.nome} (${p.licenca})`)

const bloco = (item) =>
  [
    '-'.repeat(78),
    `${item.nome} ${item.versao}`,
    `Licenca: ${item.licenca}`,
    '-'.repeat(78),
    '',
    item.texto ?? `Sem arquivo de licenca no pacote. Licenca declarada: ${item.licenca}.`,
    '',
  ].join('\n')

const cabecalho = [
  'AVISOS DE TERCEIROS',
  '',
  `${raiz.name} redistribui codigo e fontes de terceiros. Abaixo estao os avisos`,
  'de copyright e as licencas de cada um, como as proprias licencas pedem.',
  '',
  'A lista e o fecho transitivo de "dependencies", e peca por excesso: parte',
  'dela so roda na hora de compilar e nunca chega ao navegador, como o',
  'lightningcss, que transforma o CSS. Separar o que o bundler de fato embutiu,',
  'pacote a pacote, nao e coisa que um manifesto responda, e avisar demais nao',
  'faz mal a ninguem. Nada aqui e devDependency.',
  '',
  `Gerado por npm run notices. Nao edite a mao.`,
  `${pacotes.length} pacotes e ${ASSETS.length} asset(s) fora do npm.`,
  '',
  '',
].join('\n')

mkdirSync(dirname(SAIDA), { recursive: true })
writeFileSync(SAIDA, cabecalho + [...ASSETS, ...pacotes].map(bloco).join('\n'), 'utf8')

const kb = readFileSync(SAIDA).length / 1024
console.log(`public/THIRD-PARTY-NOTICES.txt: ${pacotes.length} pacotes, ${kb.toFixed(0)} KB`)
if (semTexto.length > 0) {
  console.log(`sem arquivo de licenca no pacote, usando o campo declarado: ${semTexto.join(', ')}`)
}
