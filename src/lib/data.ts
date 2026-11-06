import type { Brand, FontKey, FormatName, Project, Ratio, Settings, Slide, SlideBackground, SlideLayout, StudioData, Template } from "./types";

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const FONTS: Record<FontKey, { label: string; family: string; titleWeight: number }> = {
  outfit: { label: "Outfit", family: "Outfit", titleWeight: 700 },
  manrope: { label: "Manrope", family: "Manrope", titleWeight: 800 },
  space: { label: "Space Grotesk", family: "Space Grotesk", titleWeight: 700 },
  fraunces: { label: "Fraunces", family: "Fraunces", titleWeight: 700 },
  playfair: { label: "Playfair Display", family: "Playfair Display", titleWeight: 700 },
};

export const RATIO_SIZE: Record<Ratio, { w: number; h: number; label: string }> = {
  "1:1": { w: 1080, h: 1080, label: "1080 × 1080" },
  "4:5": { w: 1080, h: 1350, label: "1080 × 1350" },
  "9:16": { w: 1080, h: 1920, label: "1080 × 1920" },
};

export const FORMATS: { name: FormatName; detail: string; ratios: Ratio[] }[] = [
  { name: "Carrossel", detail: "Conte uma história em slides", ratios: ["1:1", "4:5"] },
  { name: "Post", detail: "Uma ideia, uma imagem", ratios: ["1:1", "4:5"] },
  { name: "Stories", detail: "Conteúdo vertical em sequência", ratios: ["9:16"] },
  { name: "Capa de Reels", detail: "Destaque seu vídeo", ratios: ["9:16"] },
];

export const LAYOUTS: { key: SlideLayout; label: string; hint: string }[] = [
  { key: "capa", label: "Capa", hint: "Título grande para abrir" },
  { key: "conteudo", label: "Conteúdo", hint: "Título e texto corrido" },
  { key: "lista", label: "Lista", hint: "Um item por linha no texto" },
  { key: "citacao", label: "Citação", hint: "Frase em destaque e autor" },
  { key: "numero", label: "Número", hint: "Um dado em destaque" },
  { key: "final", label: "Chamada final", hint: "Botão e convite à ação" },
];

export const BACKGROUNDS: { key: SlideBackground; label: string }[] = [
  { key: "marca", label: "Cor da marca" },
  { key: "escuro", label: "Escuro" },
  { key: "claro", label: "Claro" },
  { key: "gradiente", label: "Gradiente" },
  { key: "imagem", label: "Imagem" },
];

export function makeSlide(partial: Partial<Slide> = {}): Slide {
  return {
    id: uid("s"),
    layout: "conteudo",
    background: "marca",
    align: "left",
    kicker: "",
    title: "",
    body: "",
    cta: "",
    imageId: null,
    ...partial,
  };
}

export function formatRatio(format: FormatName, preferred: Ratio): Ratio {
  const allowed = FORMATS.find(f => f.name === format)?.ratios ?? ["1:1"];
  return allowed.includes(preferred) ? preferred : allowed[0];
}

/** Monta os slides iniciais a partir do tema. A geração por IA substitui isto depois. */
export function draftSlides(format: FormatName, topic: string, count: number, cta: string): Slide[] {
  const theme = topic.trim() || "Sua próxima grande ideia";
  if (format === "Post") {
    return [makeSlide({ layout: "capa", kicker: "IDEIA EM FOCO", title: theme, body: "Escreva aqui o texto de apoio do post.", cta })];
  }
  if (format === "Capa de Reels") {
    return [makeSlide({ layout: "capa", background: "gradiente", align: "center", kicker: "ASSISTA ATÉ O FIM", title: theme, body: "", cta })];
  }
  const total = Math.max(2, count);
  const slides: Slide[] = [makeSlide({ layout: "capa", kicker: format === "Stories" ? "NOVO" : "ARRASTE PARA O LADO", title: theme, body: "Tudo o que você precisa saber, em poucos minutos." })];
  for (let i = 1; i < total - 1; i++) {
    slides.push(makeSlide({
      layout: i === 1 ? "conteudo" : i === total - 2 && total > 4 ? "lista" : "conteudo",
      background: i % 2 === 0 ? "claro" : "escuro",
      kicker: `PASSO ${String(i).padStart(2, "0")}`,
      title: i === total - 2 && total > 4 ? "Resumo rápido" : `Ponto ${i} sobre o tema`,
      body: i === total - 2 && total > 4 ? "Primeiro ponto\nSegundo ponto\nTerceiro ponto" : "Explique este ponto em duas ou três frases curtas, com uma ideia por slide.",
    }));
  }
  slides.push(makeSlide({ layout: "final", background: "gradiente", kicker: "GOSTOU?", title: "Salve para *consultar depois*", body: "E mande para quem precisa ver isto hoje.", cta: cta || "Siga para mais" }));
  return slides;
}

export function cloneSlides(slides: Omit<Slide, "id">[] | Slide[]): Slide[] {
  return slides.map(s => ({ ...s, id: uid("s") }));
}

const now = Date.now();
const hour = 3_600_000;

export const DEFAULT_BRANDS: Brand[] = [
  { id: "b_cardume", name: "Cardume", descriptor: "Organizado por natureza", handle: "@cardume", primary: "#6A34D0", secondary: "#FF6A1A", dark: "#0E0D12", light: "#F7F4FB", font: "outfit", logo: null, createdAt: now - 400 * hour },
  { id: "b_ademicon", name: "Ademicon", descriptor: "Consórcios · Institucional", handle: "@ademicon", primary: "#722B4C", secondary: "#E8B5C9", dark: "#241A1F", light: "#F7F1F4", font: "manrope", logo: null, createdAt: now - 300 * hour },
  { id: "b_reinventaia", name: "Reinventaia", descriptor: "Mentoria · Mulheres 40+", handle: "@reinventaia", primary: "#C67C58", secondary: "#F3D9C6", dark: "#3A2A21", light: "#FBF4EE", font: "fraunces", logo: null, createdAt: now - 200 * hour },
  { id: "b_sala", name: "Sala Secreta", descriptor: "Produtividade · IA", handle: "@salasecreta", primary: "#222222", secondary: "#C9F25C", dark: "#111111", light: "#F2F2EF", font: "space", logo: null, createdAt: now - 100 * hour },
];

export const DEFAULT_SETTINGS: Settings = {
  userName: "Karina",
  studioName: "Meu estúdio",
  defaultRatio: "4:5",
  showNumbers: true,
  showHandle: true,
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "p_consorcio", title: "Consórcio sem complicação", format: "Carrossel", ratio: "4:5", brandId: "b_ademicon",
    caption: "Consórcio não precisa ser difícil. Salve este post e mande para quem está planejando a próxima conquista. 💬",
    showNumbers: true, showHandle: true, createdAt: now - 30 * hour, updatedAt: now - 2 * hour,
    slides: [
      makeSlide({ layout: "capa", kicker: "GUIA RÁPIDO", title: "Consórcio *sem complicação*", body: "O que ninguém te explicou antes de assinar." }),
      makeSlide({ layout: "conteudo", background: "claro", kicker: "PASSO 01", title: "Sem juros, com planejamento", body: "Você paga uma taxa de administração diluída nas parcelas, e não juros sobre o valor do bem." }),
      makeSlide({ layout: "numero", background: "escuro", kicker: "VOCÊ SABIA?", title: "8,9 mi", body: "de brasileiros participam de consórcios ativos hoje." }),
      makeSlide({ layout: "lista", background: "claro", kicker: "COMO SER CONTEMPLADO", title: "Três caminhos", body: "Sorteio mensal\nLance livre\nLance embutido" }),
      makeSlide({ layout: "final", background: "gradiente", kicker: "PRÓXIMO PASSO", title: "Simule a sua *carta de crédito*", body: "Fale com um especialista e veja as opções.", cta: "Link na bio" }),
    ],
  },
  {
    id: "p_recomecar", title: "3 ideias para recomeçar", format: "Stories", ratio: "9:16", brandId: "b_reinventaia",
    caption: "Recomeçar depois dos 40 é coragem. Qual destas ideias você vai testar primeiro?",
    showNumbers: true, showHandle: true, createdAt: now - 60 * hour, updatedAt: now - 26 * hour,
    slides: [
      makeSlide({ layout: "capa", align: "center", kicker: "PARA VOCÊ", title: "3 ideias para *recomeçar*", body: "Depois dos 40, com calma e direção." }),
      makeSlide({ layout: "citacao", background: "claro", title: "Nunca é tarde para ser quem você poderia ter sido.", body: "George Eliot" }),
      makeSlide({ layout: "final", background: "gradiente", align: "center", kicker: "VAMOS JUNTAS?", title: "Responda com *EU QUERO*", body: "Te mando o guia completo no direct.", cta: "Responder" }),
    ],
  },
  {
    id: "p_fase", title: "Sua próxima fase começa aqui", format: "Post", ratio: "1:1", brandId: "b_sala",
    caption: "Organização não é rigidez, é liberdade para focar no que importa.",
    showNumbers: false, showHandle: true, createdAt: now - 200 * hour, updatedAt: now - 150 * hour,
    slides: [makeSlide({ layout: "capa", background: "escuro", kicker: "PRODUTIVIDADE", title: "Sua próxima fase *começa aqui.*", body: "Menos ruído. Mais intenção." })],
  },
];

export function defaultData(): StudioData {
  return { version: 1, projects: DEFAULT_PROJECTS, brands: DEFAULT_BRANDS, library: [], settings: DEFAULT_SETTINGS };
}

const t = (slide: Partial<Slide>): Omit<Slide, "id"> => {
  const { id: _id, ...rest } = makeSlide(slide);
  void _id;
  return rest;
};

export const TEMPLATES: Template[] = [
  {
    id: "t_editorial", name: "Editorial minimalista", description: "Uma frase forte com respiro", format: "Post", ratio: "4:5",
    slides: [t({ layout: "capa", background: "claro", kicker: "IDEIA EM FOCO", title: "Menos ruído. *Mais intenção.*", body: "Uma ideia por vez, bem dita." })],
  },
  {
    id: "t_campanha", name: "Destaque de campanha", description: "Anúncio com chamada clara", format: "Post", ratio: "1:1",
    slides: [t({ layout: "final", background: "gradiente", kicker: "NOVA CAMPANHA", title: "Sua marca, *mais forte.*", body: "Condições especiais só esta semana.", cta: "Saiba mais" })],
  },
  {
    id: "t_passos", name: "Dica em 3 passos", description: "Capa, três passos e chamada", format: "Carrossel", ratio: "4:5",
    slides: [
      t({ layout: "capa", kicker: "3 PASSOS", title: "Pequenas ações. *Grandes mudanças.*", body: "Arraste e comece hoje." }),
      t({ layout: "conteudo", background: "claro", kicker: "PASSO 01", title: "Comece pelo simples", body: "Escolha uma única tarefa e faça antes de abrir as mensagens." }),
      t({ layout: "conteudo", background: "escuro", kicker: "PASSO 02", title: "Crie um ritual", body: "Mesmo horário, mesmo lugar. A repetição tira o peso da decisão." }),
      t({ layout: "conteudo", background: "claro", kicker: "PASSO 03", title: "Meça o progresso", body: "Anote o que fez. Ver a sequência crescer é o que mantém você no jogo." }),
      t({ layout: "final", background: "gradiente", kicker: "GOSTOU?", title: "Salve e *teste amanhã*", body: "Depois me conta o resultado.", cta: "Siga para mais" }),
    ],
  },
  {
    id: "t_reels", name: "Capa de conteúdo", description: "Capa vertical para vídeo", format: "Capa de Reels", ratio: "9:16",
    slides: [t({ layout: "capa", background: "gradiente", align: "center", kicker: "ASSISTA AGORA", title: "O que você *precisa saber*", body: "" })],
  },
  {
    id: "t_mitos", name: "Mito ou verdade", description: "Desmonte crenças em sequência", format: "Carrossel", ratio: "1:1",
    slides: [
      t({ layout: "capa", background: "escuro", kicker: "MITO OU VERDADE?", title: "5 crenças que *te atrasam*", body: "A terceira surpreende." }),
      t({ layout: "conteudo", background: "claro", kicker: "MITO", title: "Precisa ter tempo sobrando", body: "Constância vence intensidade. Quinze minutos por dia já mudam o resultado." }),
      t({ layout: "numero", background: "marca", kicker: "VERDADE", title: "21 dias", body: "é o mínimo para um hábito começar a ficar automático." }),
      t({ layout: "final", background: "gradiente", kicker: "E VOCÊ?", title: "Qual destas *você acreditava?*", body: "Conte nos comentários.", cta: "Comentar" }),
    ],
  },
  {
    id: "t_depoimento", name: "Depoimento", description: "Prova social com citação", format: "Stories", ratio: "9:16",
    slides: [
      t({ layout: "citacao", background: "claro", align: "center", title: "Em três meses, organizei a rotina e dobrei os resultados.", body: "Cliente da mentoria" }),
      t({ layout: "final", background: "marca", align: "center", kicker: "SUA VEZ", title: "Quer o *mesmo resultado?*", body: "As vagas abrem esta semana.", cta: "Quero saber" }),
    ],
  },
  {
    id: "t_lista", name: "Checklist", description: "Lista prática para salvar", format: "Post", ratio: "4:5",
    slides: [t({ layout: "lista", background: "claro", kicker: "SALVE ESTE POST", title: "Checklist da semana", body: "Revisar metas\nPlanejar conteúdos\nResponder clientes\nFechar o financeiro" })],
  },
  {
    id: "t_dado", name: "Dado em destaque", description: "Um número que para o scroll", format: "Post", ratio: "1:1",
    slides: [t({ layout: "numero", background: "escuro", kicker: "VOCÊ SABIA?", title: "73%", body: "das pessoas decidem a compra depois de ver conteúdo útil da marca." })],
  },
];
