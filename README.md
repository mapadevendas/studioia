# Cardume · Estúdio de conteúdo

Organizado por natureza, feito para multiplicar. Estúdio para criar carrosséis, posts, Stories e capas de Reels com a identidade visual de cada marca.

## O que já funciona

- Início, Projetos, Identidade visual, Biblioteca, Modelos, Configurações e Editor
- Criação de projetos com rascunho automático (capa, conteúdo e chamada final)
- Editor com slides em miniatura, 6 modelos de slide, 5 fundos (marca, escuro, claro, gradiente, foto), alinhamento, destaque com `*asteriscos*`, legenda, desfazer/refazer e atalhos
- Exportação em PNG na resolução final (1080 px) e ZIP com todos os slides + legenda
- Marcas com 4 cores, 5 fontes, logo e prévia ao vivo
- Biblioteca de imagens com arrastar e soltar
- 8 modelos prontos que já saem com as cores da marca escolhida
- Busca, filtros, ordenação, renomear, duplicar e excluir
- Cópia de segurança em JSON

## Onde os dados ficam

Por enquanto tudo fica no navegador: os dados em `localStorage` e as imagens em IndexedDB (`src/lib/storage.ts`).
Para levar para a nuvem (por exemplo Cloudflare D1 para os dados e R2 para as imagens), crie outra implementação da interface `StudioStore` e troque `browserStore` em `src/lib/useStudio.ts` e `src/lib/images.ts`.

## Executar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Próximas etapas

1. Nuvem e login (Cloudflare)
2. Escrita por IA de roteiro, textos dos slides, legenda e CTA
3. Agendamento e publicação

## Segurança

Não coloque chaves secretas no frontend nem versione arquivos `.env`.
