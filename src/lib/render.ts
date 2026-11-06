import { FONTS, RATIO_SIZE } from "./data";
import { loadImage } from "./images";
import type { Brand, Ratio, Slide } from "./types";

/**
 * Desenha um slide num canvas. A mesma função serve para a prévia do editor,
 * as miniaturas e a exportação em PNG — o que se vê é o que se baixa.
 * O contexto chega em coordenadas de 1080 px de largura.
 */

export type RenderOptions = {
  brand: Brand;
  index: number;
  total: number;
  showNumbers: boolean;
  showHandle: boolean;
  isCarousel: boolean;
  image: HTMLImageElement | null;
  logo: HTMLImageElement | null;
};

type Palette = {
  fill: string | ((ctx: CanvasRenderingContext2D, w: number, h: number) => void);
  text: string;
  muted: string;
  accent: string;
  hlMode: "color" | "marker";
  markerFill: string;
  markerText: string;
  ctaFill: string;
  ctaText: string;
  flockA: string;
  flockB: string;
  flockAlpha: number;
};

/* ---------- cor ---------- */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function readableOn(bg: string, dark = "#121014") {
  return contrast(bg, "#FFFFFF") >= contrast(bg, dark) ? "#FFFFFF" : dark;
}

function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function pickAccent(bg: string, candidates: string[], fallback: string) {
  for (const c of candidates) if (contrast(c, bg) >= 2.6) return c;
  return fallback;
}

function palette(slide: Slide, brand: Brand): Palette {
  const { primary, secondary, dark, light } = brand;
  switch (slide.background) {
    case "claro": {
      const accent = pickAccent(light, [primary, secondary], dark);
      const marker = contrast(accent, dark) < 1.6;
      return {
        fill: light, text: dark, muted: rgba(dark, 0.6), accent,
        hlMode: marker ? "marker" : "color", markerFill: secondary, markerText: readableOn(secondary, dark),
        ctaFill: primary, ctaText: readableOn(primary, dark),
        flockA: primary, flockB: secondary, flockAlpha: 0.22,
      };
    }
    case "escuro": {
      const accent = pickAccent(dark, [secondary, primary], "#FFFFFF");
      return {
        fill: dark, text: "#FFFFFF", muted: "rgba(255,255,255,.62)", accent,
        hlMode: "color", markerFill: secondary, markerText: readableOn(secondary, dark),
        ctaFill: accent, ctaText: readableOn(accent, dark),
        flockA: primary, flockB: secondary, flockAlpha: 0.5,
      };
    }
    case "gradiente": {
      const text = readableOn(mix(primary, secondary, 0.5), dark);
      return {
        fill: (ctx, w, h) => {
          const g = ctx.createLinearGradient(0, 0, w, h);
          g.addColorStop(0, primary);
          g.addColorStop(1, secondary);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        },
        text, muted: text === "#FFFFFF" ? "rgba(255,255,255,.78)" : rgba(dark, 0.7), accent: text,
        hlMode: "marker", markerFill: dark, markerText: "#FFFFFF",
        ctaFill: text === "#FFFFFF" ? "#FFFFFF" : dark, ctaText: text === "#FFFFFF" ? dark : "#FFFFFF",
        flockA: "#FFFFFF", flockB: "#FFFFFF", flockAlpha: 0.22,
      };
    }
    case "imagem":
      return {
        fill: dark, text: "#FFFFFF", muted: "rgba(255,255,255,.78)", accent: pickAccent("#1a1a1a", [secondary, primary], "#FFFFFF"),
        hlMode: "color", markerFill: secondary, markerText: readableOn(secondary, dark),
        ctaFill: secondary, ctaText: readableOn(secondary, dark),
        flockA: "#FFFFFF", flockB: secondary, flockAlpha: 0,
      };
    case "marca":
    default: {
      const text = readableOn(primary, dark);
      const accent = pickAccent(primary, [secondary, light], text);
      return {
        fill: primary, text, muted: text === "#FFFFFF" ? "rgba(255,255,255,.72)" : rgba(dark, 0.65), accent,
        hlMode: "color", markerFill: secondary, markerText: readableOn(secondary, dark),
        ctaFill: accent, ctaText: readableOn(accent, dark),
        flockA: text, flockB: secondary, flockAlpha: 0.32,
      };
    }
  }
}

/* ---------- fontes ---------- */

const fontPromises = new Map<string, Promise<unknown>>();

export function ensureFonts(brand: Brand): Promise<unknown> {
  const f = FONTS[brand.font] ?? FONTS.outfit;
  const key = f.family;
  let p = fontPromises.get(key);
  if (!p) {
    if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
    p = Promise.all([
      document.fonts.load(`${f.titleWeight} 64px "${f.family}"`),
      document.fonts.load(`400 40px "${bodyFamily(brand)}"`),
      document.fonts.load(`700 40px "${bodyFamily(brand)}"`),
      document.fonts.load(`italic 500 64px "${f.family}"`),
    ]).catch(() => undefined);
    fontPromises.set(key, p);
  }
  return p;
}

function isSerif(brand: Brand) {
  return brand.font === "fraunces" || brand.font === "playfair";
}

function bodyFamily(brand: Brand) {
  return isSerif(brand) ? "DM Sans" : (FONTS[brand.font] ?? FONTS.outfit).family;
}

function titleFont(brand: Brand, size: number) {
  const f = FONTS[brand.font] ?? FONTS.outfit;
  return `${f.titleWeight} ${size}px "${f.family}", sans-serif`;
}

function bodyFont(brand: Brand, size: number, weight = 400) {
  return `${weight} ${size}px "${bodyFamily(brand)}", sans-serif`;
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

/* ---------- texto com destaque ---------- */

type Word = { text: string; hl: boolean; br?: boolean };
type Line = { words: (Word & { w: number })[]; width: number };

function parseRich(text: string): Word[] {
  const words: Word[] = [];
  let hl = false;
  const paragraphs = text.split("\n");
  paragraphs.forEach((para, pi) => {
    let buffer = "";
    const flush = () => {
      if (buffer) words.push({ text: buffer, hl });
      buffer = "";
    };
    for (const ch of para) {
      if (ch === "*") { flush(); hl = !hl; continue; }
      if (ch === " ") { flush(); continue; }
      buffer += ch;
    }
    flush();
    if (pi < paragraphs.length - 1) words.push({ text: "", hl: false, br: true });
  });
  return words;
}

function wrap(ctx: CanvasRenderingContext2D, words: Word[], maxWidth: number): Line[] {
  const space = ctx.measureText(" ").width;
  const lines: Line[] = [];
  let current: Line = { words: [], width: 0 };
  const push = () => { lines.push(current); current = { words: [], width: 0 }; };
  for (const word of words) {
    if (word.br) { push(); continue; }
    let w = ctx.measureText(word.text).width;
    let text = word.text;
    // palavra maior que a linha: corta
    while (w > maxWidth && text.length > 1) {
      let cut = text.length - 1;
      while (cut > 1 && ctx.measureText(text.slice(0, cut) + "-").width > maxWidth) cut--;
      if (current.words.length) push();
      const part = text.slice(0, cut) + "-";
      current.words.push({ ...word, text: part, w: ctx.measureText(part).width });
      current.width = current.words[0].w;
      push();
      text = text.slice(cut);
      w = ctx.measureText(text).width;
    }
    const needed = current.words.length ? current.width + space + w : w;
    if (needed > maxWidth && current.words.length) push();
    current.width = current.words.length ? current.width + space + w : w;
    current.words.push({ ...word, text, w });
  }
  if (current.words.length || !lines.length) push();
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, font: (s: number) => string, max: number, min: number, maxWidth: number, maxLines: number) {
  const words = parseRich(text);
  let size = max;
  for (;;) {
    ctx.font = font(size);
    const lines = wrap(ctx, words, maxWidth);
    if (lines.length <= maxLines || size <= min) return { size, lines };
    size = Math.max(min, Math.floor(size * 0.93));
  }
}

function drawLines(
  ctx: CanvasRenderingContext2D, lines: Line[], x: number, y: number, maxWidth: number,
  size: number, lh: number, align: "left" | "center", color: string, pal: Palette, highlight = true,
) {
  const space = ctx.measureText(" ").width;
  lines.forEach((line, i) => {
    let cx = align === "center" ? x + (maxWidth - line.width) / 2 : x;
    const top = y + i * size * lh;
    line.words.forEach(word => {
      if (word.hl && highlight && pal.hlMode === "marker") {
        ctx.fillStyle = pal.markerFill;
        const padX = size * 0.12;
        roundRect(ctx, cx - padX, top + size * 0.02, word.w + padX * 2, size * 1.06, size * 0.14);
        ctx.fill();
        ctx.fillStyle = pal.markerText;
      } else {
        ctx.fillStyle = word.hl && highlight ? pal.accent : color;
      }
      ctx.fillText(word.text, cx, top + size * 0.06);
      cx += word.w + space;
    });
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ---------- decoração: o cardume ---------- */

function drawFlock(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, pal: Palette, seed: number) {
  if (pal.flockAlpha <= 0) return;
  const cols = 6;
  const rows = 4;
  ctx.save();
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const jitter = Math.sin((c + 1) * 12.9898 + (r + 1) * 78.233 + seed) * 43758.5453;
      const rand = jitter - Math.floor(jitter);
      if (rand < 0.28 + (cols - c) * 0.07) continue;
      const t = c / (cols - 1);
      const s = (14 + t * 26) * scale;
      const px = x + c * 54 * scale + (r % 2) * 20 * scale;
      const py = y + r * 54 * scale + rand * 10 * scale;
      ctx.globalAlpha = pal.flockAlpha * (0.35 + t * 0.65);
      ctx.strokeStyle = mix(pal.flockA.startsWith("#") ? pal.flockA : "#FFFFFF", pal.flockB.startsWith("#") ? pal.flockB : "#FFFFFF", t);
      ctx.lineWidth = Math.max(2, s * 0.2);
      roundRect(ctx, px, py, s, s * 0.82, s * 0.28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + ctx.lineWidth / 2, py + s * 0.82);
      ctx.lineTo(px + ctx.lineWidth / 2, py + s * 1.25);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------- slide ---------- */

export function renderSlide(ctx: CanvasRenderingContext2D, W: number, H: number, slide: Slide, o: RenderOptions) {
  const { brand } = o;
  const pal = palette(slide, brand);
  const tall = H / W > 1.5;
  const padX = 96;
  const padY = tall ? 210 : 92;
  const maxWidth = W - padX * 2;
  const center = slide.align === "center";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  setSpacing(ctx, 0);

  // fundo
  ctx.clearRect(0, 0, W, H);
  if (typeof pal.fill === "function") pal.fill(ctx, W, H);
  else { ctx.fillStyle = pal.fill; ctx.fillRect(0, 0, W, H); }

  if (slide.background === "imagem") {
    if (o.image) {
      const ir = o.image.naturalWidth / o.image.naturalHeight;
      const cr = W / H;
      let sw = o.image.naturalWidth, sh = o.image.naturalHeight, sx = 0, sy = 0;
      if (ir > cr) { sw = sh * cr; sx = (o.image.naturalWidth - sw) / 2; }
      else { sh = sw / cr; sy = (o.image.naturalHeight - sh) / 2; }
      ctx.drawImage(o.image, sx, sy, sw, sh, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, mix(brand.dark, brand.primary, 0.35));
      g.addColorStop(1, brand.dark);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.font = bodyFont(brand, 28, 500);
      ctx.textAlign = "center";
      ctx.fillText("Escolha uma imagem no painel", W / 2, H / 2 - 14);
      ctx.textAlign = "left";
    }
    const shade = ctx.createLinearGradient(0, H * 0.25, 0, H);
    shade.addColorStop(0, "rgba(0,0,0,0.1)");
    shade.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }

  // cardume decorativo
  if (slide.layout === "capa" || slide.layout === "final") {
    drawFlock(ctx, W - 380, padY + 90, 1.05, pal, o.index);
  } else if (slide.background !== "claro") {
    drawFlock(ctx, W - 300, H - padY - 260, 0.75, { ...pal, flockAlpha: pal.flockAlpha * 0.6 }, o.index);
  }

  // topo: marca + contador
  const headerH = 60;
  if (o.logo) {
    const lh = 64;
    const lw = Math.min(320, (o.logo.naturalWidth / o.logo.naturalHeight) * lh);
    ctx.drawImage(o.logo, padX, padY, lw, lw / (o.logo.naturalWidth / o.logo.naturalHeight));
  } else {
    ctx.fillStyle = pal.text;
    ctx.font = titleFont(brand, 34);
    setSpacing(ctx, -0.5);
    ctx.fillText(brand.name, padX, padY + 10);
    const nameW = ctx.measureText(brand.name).width;
    ctx.fillStyle = pal.accent === pal.text ? pal.muted : pal.accent;
    ctx.beginPath();
    ctx.arc(padX + nameW + 9, padY + 39, 5, 0, Math.PI * 2);
    ctx.fill();
    setSpacing(ctx, 0);
  }
  if (o.showNumbers && o.total > 1) {
    ctx.font = bodyFont(brand, 26, 600);
    setSpacing(ctx, 2);
    const label = `${String(o.index + 1).padStart(2, "0")} / ${String(o.total).padStart(2, "0")}`;
    const lw = ctx.measureText(label).width;
    ctx.fillStyle = pal.muted;
    ctx.fillText(label, W - padX - lw, padY + 18);
    setSpacing(ctx, 0);
  }

  // rodapé: @ e seta
  const footerY = H - padY - 30;
  if (o.showHandle && brand.handle) {
    ctx.font = bodyFont(brand, 26, 500);
    ctx.fillStyle = pal.muted;
    ctx.fillText(brand.handle, padX, footerY);
  }
  if (o.isCarousel && o.index < o.total - 1) {
    ctx.strokeStyle = pal.text;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3;
    const ax = W - padX;
    const ay = footerY + 14;
    ctx.beginPath();
    ctx.moveTo(ax - 64, ay);
    ctx.lineTo(ax, ay);
    ctx.moveTo(ax - 16, ay - 14);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax - 16, ay + 14);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // bloco de conteúdo
  type Item = { h: number; gap: number; draw: (y: number) => void };
  const items: Item[] = [];
  const align = center ? "center" : "left";

  const kicker = slide.kicker.trim();
  if (kicker && slide.layout !== "citacao") {
    ctx.font = bodyFont(brand, 26, 700);
    setSpacing(ctx, 5);
    const kw = ctx.measureText(kicker.toUpperCase()).width;
    setSpacing(ctx, 0);
    items.push({
      h: 30, gap: 36,
      draw: y => {
        ctx.font = bodyFont(brand, 26, 700);
        setSpacing(ctx, 5);
        const dot = 18;
        const total = kw + dot + 16;
        const x0 = center ? padX + (maxWidth - total) / 2 : padX;
        ctx.fillStyle = pal.accent === pal.text && pal.hlMode === "marker" ? pal.markerFill : pal.accent;
        roundRect(ctx, x0, y + 5, dot, dot, 5);
        ctx.fill();
        ctx.fillStyle = slide.background === "marca" || slide.background === "gradiente" ? pal.text : pal.accent;
        ctx.fillText(kicker.toUpperCase(), x0 + dot + 16, y + 2);
        setSpacing(ctx, 0);
      },
    });
  }

  if (slide.layout === "citacao") {
    items.push({
      h: 150, gap: 10,
      draw: y => {
        ctx.font = `700 260px "Fraunces", Georgia, serif`;
        ctx.fillStyle = pal.hlMode === "marker" ? pal.markerFill : pal.accent;
        const qw = ctx.measureText("“").width;
        ctx.fillText("“", center ? padX + (maxWidth - qw) / 2 : padX - 10, y - 30);
      },
    });
  }

  const titleSpec: Record<Slide["layout"], [number, number, number, number]> = {
    capa: [128, 64, 5, 1.04],
    conteudo: [86, 54, 4, 1.08],
    lista: [80, 52, 3, 1.08],
    citacao: [68, 42, 7, 1.18],
    numero: [300, 110, 2, 1.0],
    final: [104, 60, 4, 1.06],
  };
  const title = slide.title.trim();
  if (title) {
    const [max, min, lines, lh] = titleSpec[slide.layout];
    const isQuote = slide.layout === "citacao";
    const font = (s: number) => isQuote
      ? `italic 500 ${s}px "${(FONTS[brand.font] ?? FONTS.outfit).family}", serif`
      : titleFont(brand, s);
    setSpacing(ctx, slide.layout === "numero" ? -6 : -1.5);
    const t = fit(ctx, title, font, tall && slide.layout === "capa" ? 138 : max, min, maxWidth, tall ? lines + 1 : lines);
    setSpacing(ctx, 0);
    items.push({
      h: t.lines.length * t.size * lh, gap: slide.layout === "numero" ? 28 : 40,
      draw: y => {
        ctx.font = font(t.size);
        setSpacing(ctx, slide.layout === "numero" ? -6 : -1.5);
        const color = slide.layout === "numero" ? (pal.hlMode === "marker" ? pal.text : pal.accent) : pal.text;
        drawLines(ctx, t.lines, padX, y, maxWidth, t.size, lh, align, color, pal, slide.layout !== "numero");
        setSpacing(ctx, 0);
      },
    });
  }

  const body = slide.body.trim();
  if (body) {
    if (slide.layout === "lista") {
      const entries = body.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 7);
      const size = entries.length > 5 ? 34 : 40;
      const bullet = size * 1.5;
      const textW = maxWidth - bullet - 28;
      ctx.font = bodyFont(brand, size, 500);
      const wrapped = entries.map(e => wrap(ctx, parseRich(e), textW));
      const rowH = (w: Line[]) => Math.max(bullet, w.length * size * 1.3) + 26;
      items.push({
        h: wrapped.reduce((s, w) => s + rowH(w), 0), gap: 0,
        draw: y => {
          let cy = y;
          wrapped.forEach((w, i) => {
            const bx = padX;
            ctx.fillStyle = pal.hlMode === "marker" ? pal.markerFill : pal.accent;
            roundRect(ctx, bx, cy, bullet, bullet, bullet * 0.3);
            ctx.fill();
            ctx.fillStyle = pal.hlMode === "marker" ? pal.markerText : readableOn(pal.accent, brand.dark);
            ctx.font = bodyFont(brand, size * 0.72, 700);
            const n = String(i + 1);
            ctx.fillText(n, bx + (bullet - ctx.measureText(n).width) / 2, cy + bullet * 0.24);
            ctx.font = bodyFont(brand, size, 500);
            const textH = w.length * size * 1.3;
            drawLines(ctx, w, bx + bullet + 28, cy + Math.max(0, (bullet - textH) / 2), textW, size, 1.3, "left", pal.text, pal);
            cy += rowH(w);
          });
        },
      });
    } else {
      const isQuote = slide.layout === "citacao";
      const text = isQuote ? `— ${body}` : body;
      const maxBody = slide.layout === "numero" ? 48 : slide.layout === "conteudo" ? 42 : 38;
      const b = fit(ctx, text, s => bodyFont(brand, s, isQuote ? 600 : 400), maxBody, 28, center ? maxWidth * 0.9 : maxWidth * 0.94, slide.layout === "conteudo" ? 9 : 5);
      items.push({
        h: b.lines.length * b.size * 1.42, gap: 0,
        draw: y => {
          ctx.font = bodyFont(brand, b.size, isQuote ? 600 : 400);
          const w = center ? maxWidth * 0.9 : maxWidth * 0.94;
          drawLines(ctx, b.lines, center ? padX + (maxWidth - w) / 2 : padX, y, w, b.size, 1.42, align, isQuote ? pal.text : pal.muted, pal);
        },
      });
    }
  }

  const cta = slide.cta.trim();
  if (cta && (slide.layout === "final" || slide.layout === "capa")) {
    const size = 32;
    ctx.font = bodyFont(brand, size, 700);
    const tw = ctx.measureText(cta).width;
    const bw = tw + 64 + 40;
    const bh = 84;
    items.push({
      h: bh, gap: 0,
      draw: y => {
        const x0 = center ? padX + (maxWidth - bw) / 2 : padX;
        ctx.fillStyle = pal.ctaFill;
        roundRect(ctx, x0, y, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = pal.ctaText;
        ctx.font = bodyFont(brand, size, 700);
        ctx.fillText(cta, x0 + 34, y + (bh - size) / 2 + 1);
        ctx.strokeStyle = pal.ctaText;
        ctx.lineWidth = 3;
        const ax = x0 + bw - 36;
        const ay = y + bh / 2;
        ctx.beginPath();
        ctx.moveTo(ax - 22, ay);
        ctx.lineTo(ax, ay);
        ctx.moveTo(ax - 9, ay - 9);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax - 9, ay + 9);
        ctx.stroke();
      },
    });
  }

  // espaço entre texto e botão
  if (items.length > 1 && cta && (slide.layout === "final" || slide.layout === "capa")) items[items.length - 2].gap = 52;

  const blockH = items.reduce((s, it, i) => s + it.h + (i < items.length - 1 ? it.gap : 0), 0);
  const areaTop = padY + headerH + 70;
  const areaBottom = H - padY - 90;
  let y: number;
  if (center) y = areaTop + (areaBottom - areaTop - blockH) / 2;
  else if (slide.layout === "conteudo" || slide.layout === "lista") y = areaTop + (tall ? 120 : 30);
  else y = areaBottom - blockH;
  y = Math.max(areaTop, y);

  for (const it of items) {
    it.draw(y);
    y += it.h + it.gap;
  }
}

/* ---------- exportação ---------- */

export type ExportInput = { slide: Slide; index: number; total: number; ratio: Ratio; brand: Brand; showNumbers: boolean; showHandle: boolean; isCarousel: boolean };

export async function slideToBlob(input: ExportInput): Promise<Blob> {
  const size = RATIO_SIZE[input.ratio];
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d")!;
  await ensureFonts(input.brand);
  const [image, logo] = await Promise.all([
    input.slide.background === "imagem" ? loadImage(input.slide.imageId) : Promise.resolve(null),
    loadImage(input.brand.logo),
  ]);
  renderSlide(ctx, size.w, size.h, input.slide, { ...input, image, logo });
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Falha ao gerar a imagem.")), "image/png"));
}
