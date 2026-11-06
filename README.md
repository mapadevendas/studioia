# AI Content Studio · Fase 1

Protótipo funcional de interface para um estúdio de criação de conteúdo visual. Nesta fase, o foco é validar navegação, identidade visual, criação de projetos e uma primeira prévia editável, sem consumir créditos de IA.

## O que já funciona

- Dashboard responsivo
- Navegação entre início, projetos, identidades visuais, biblioteca, modelos e editor
- Criação de projetos para carrossel, post, Stories e capa de Reels
- Adição de marcas com cor principal
- Editor inicial com texto editável, cor de fundo e prévia ao vivo
- Busca local por projetos
- Exportação de texto de prévia
- Projetos de demonstração para explorar a interface

## Limitações desta etapa

Os dados são mantidos apenas na sessão do navegador. Ainda não há autenticação, banco de dados, armazenamento em nuvem, exportação PNG/ZIP, integração com Canva ou geração por IA. Isso é intencional para validar o fluxo antes de conectar serviços externos.

## Requisitos

- Node.js 20.9 ou superior
- npm

## Executar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Publicar na Vercel

1. Crie um repositório novo no GitHub e envie os arquivos deste projeto.
2. Na Vercel, importe esse repositório.
3. Use as configurações padrão para Next.js.
4. Não configure variáveis do Supabase ou IA nesta fase.
5. Faça o deploy e teste no celular e no computador.

## Próximas etapas

1. Persistência real e autenticação com Supabase, usando um projeto separado.
2. Editor visual com camadas, mover/redimensionar elementos, duplicar e ordenar slides.
3. Exportação PNG individual e ZIP de carrossel.
4. IA para roteiro, textos de slides, legenda e CTA, com controle de custos por operação.
5. Avaliar a integração oficial com Canva com base nas permissões e capacidades disponíveis para a conta.

## Segurança

Não coloque chaves secretas no frontend nem versione arquivos `.env`. Use um projeto Supabase dedicado para este produto; não conecte este protótipo a projetos existentes sem revisar o ambiente primeiro.
