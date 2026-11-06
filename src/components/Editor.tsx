"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter, AlignLeft, ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Copy, Download,
  FileArchive, ImagePlus, Loader2, Plus, Redo2, Trash2, Undo2, Upload, ArrowUp, ArrowDown, ClipboardCopy, Check,
} from "lucide-react";
import SlideCanvas from "./SlideCanvas";
import { StoredImage, Toggle } from "./ui";
import { BACKGROUNDS, FORMATS, LAYOUTS, RATIO_SIZE, makeSlide, uid } from "@/lib/data";
import { downloadBlob, prepareUpload, slugify } from "@/lib/images";
import { slideToBlob } from "@/lib/render";
import { makeZip } from "@/lib/zip";
import type { Brand, LibraryImage, Project, Ratio, Slide, SlideLayout } from "@/lib/types";
import type { SaveState } from "@/lib/useStudio";

type Props = {
  project: Project;
  brands: Brand[];
  library: LibraryImage[];
  saveState: SaveState;
  onChange: (p: Project) => void;
  onBack: () => void;
  onAddImage: (img: LibraryImage, blob: Blob) => Promise<void>;
  notify: (msg: string) => void;
};

const MAX_SLIDES = 20;

export default function Editor({ project: initial, brands, library, saveState, onChange, onBack, onAddImage, notify }: Props) {
  const [history, setHistory] = useState<{ past: Project[]; present: Project; future: Project[] }>({ past: [], present: initial, future: [] });
  const { past, present: project, future } = history;
  const [current, setCurrent] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [tab, setTab] = useState<"slide" | "projeto">("slide");
  const lastEdit = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const brand = brands.find(b => b.id === project.brandId) ?? brands[0];
  const slide = project.slides[Math.min(current, project.slides.length - 1)];
  const isCarousel = project.slides.length > 1;
  const allowedRatios = FORMATS.find(f => f.name === project.format)?.ratios ?? ["1:1"];
  const multi = project.format !== "Post" && project.format !== "Capa de Reels";

  const sent = useRef(initial);
  useEffect(() => {
    if (project === sent.current) return;
    sent.current = project;
    onChange(project);
  }, [project, onChange]);

  /** grava uma alteração; edições seguidas no mesmo campo viram um passo só no desfazer */
  const commit = useCallback((next: Project, key = "") => {
    const now = Date.now();
    const merge = key && lastEdit.current.key === key && now - lastEdit.current.at < 900;
    lastEdit.current = { key, at: now };
    setHistory(h => ({ past: merge ? h.past : [...h.past.slice(-60), h.present], present: next, future: [] }));
  }, []);

  const undo = useCallback(() => {
    lastEdit.current = { key: "", at: 0 };
    setHistory(h => h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h);
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = { key: "", at: 0 };
    setHistory(h => h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h);
  }, []);

  useEffect(() => {
    if (current > project.slides.length - 1) setCurrent(project.slides.length - 1);
  }, [current, project.slides.length]);

  const updateSlide = (patch: Partial<Slide>, key?: string) => {
    const slides = project.slides.map((s, i) => i === current ? { ...s, ...patch } : s);
    commit({ ...project, slides }, key ? `${slide.id}:${key}` : "");
  };

  const addSlide = (layout: SlideLayout = "conteudo") => {
    if (project.slides.length >= MAX_SLIDES) return notify(`Limite de ${MAX_SLIDES} slides por projeto.`);
    const base = makeSlide({ layout, background: slide?.background === "claro" ? "escuro" : "claro", kicker: "NOVO SLIDE", title: "Escreva o título", body: "Texto de apoio deste slide." });
    const slides = [...project.slides];
    slides.splice(current + 1, 0, base);
    commit({ ...project, slides });
    setCurrent(current + 1);
  };

  const duplicateSlide = () => {
    if (project.slides.length >= MAX_SLIDES) return notify(`Limite de ${MAX_SLIDES} slides por projeto.`);
    const slides = [...project.slides];
    slides.splice(current + 1, 0, { ...slide, id: uid("s") });
    commit({ ...project, slides });
    setCurrent(current + 1);
  };

  const removeSlide = () => {
    if (project.slides.length <= 1) return notify("O projeto precisa de pelo menos um slide.");
    const slides = project.slides.filter((_, i) => i !== current);
    commit({ ...project, slides });
    setCurrent(Math.max(0, current - 1));
  };

  const moveSlide = (dir: -1 | 1) => {
    const to = current + dir;
    if (to < 0 || to >= project.slides.length) return;
    const slides = [...project.slides];
    [slides[current], slides[to]] = [slides[to], slides[current]];
    commit({ ...project, slides });
    setCurrent(to);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); redo(); return; }
      if (typing) return;
      if (e.key === "ArrowRight") setCurrent(c => Math.min(project.slides.length - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent(c => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, project.slides.length]);

  async function exportCurrent() {
    setExportOpen(false);
    setExporting("png");
    try {
      const blob = await slideToBlob({ slide, index: current, total: project.slides.length, ratio: project.ratio, brand, showNumbers: project.showNumbers, showHandle: project.showHandle, isCarousel });
      downloadBlob(blob, `${slugify(project.title)}-${String(current + 1).padStart(2, "0")}.png`);
      notify("Imagem baixada em PNG.");
    } catch {
      notify("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setExporting(null);
    }
  }

  async function exportAll() {
    setExportOpen(false);
    setExporting("zip");
    try {
      const files = [];
      for (let i = 0; i < project.slides.length; i++) {
        const blob = await slideToBlob({ slide: project.slides[i], index: i, total: project.slides.length, ratio: project.ratio, brand, showNumbers: project.showNumbers, showHandle: project.showHandle, isCarousel });
        files.push({ name: `${String(i + 1).padStart(2, "0")}.png`, blob });
      }
      if (project.caption.trim()) files.push({ name: "legenda.txt", blob: new Blob([project.caption], { type: "text/plain;charset=utf-8" }) });
      const zip = await makeZip(files);
      downloadBlob(zip, `${slugify(project.title)}.zip`);
      notify(`${project.slides.length} slides baixados num arquivo ZIP.`);
    } catch {
      notify("Não foi possível gerar o ZIP. Tente de novo.");
    } finally {
      setExporting(null);
    }
  }

  async function copyCaption() {
    setExportOpen(false);
    try {
      await navigator.clipboard.writeText(project.caption);
      notify("Legenda copiada.");
    } catch {
      notify("Não foi possível copiar. Selecione o texto da legenda e copie manualmente.");
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Envie um arquivo de imagem (JPG, PNG ou WebP).");
    if (file.size > 15 * 1024 * 1024) return notify("Imagem muito grande. O limite é 15 MB.");
    try {
      const { blob, width, height } = await prepareUpload(file);
      const img: LibraryImage = { id: uid("img"), name: file.name.replace(/\.[^.]+$/, ""), width, height, size: blob.size, createdAt: Date.now() };
      await onAddImage(img, blob);
      updateSlide({ background: "imagem", imageId: img.id });
      notify("Imagem adicionada à biblioteca e aplicada ao slide.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    }
  }

  const saveLabel = saveState === "salvando" ? "Salvando…" : saveState === "erro" ? "Não foi possível salvar" : "Salvo neste navegador";

  return (
    <div className="editor-page">
      <div className="editor-top">
        <button className="button-ghost" onClick={onBack}><ArrowLeft size={16} /> Projetos</button>
        <div className="editor-title">
          <input value={project.title} onChange={e => commit({ ...project, title: e.target.value }, "title")} onBlur={() => !project.title.trim() && commit({ ...project, title: "Projeto sem nome" })} aria-label="Nome do projeto" maxLength={80} />
          <span className={`save-pill ${saveState}`}><i />{saveLabel}</span>
        </div>
        <div className="editor-top-actions">
          <button className="icon-button bordered" onClick={undo} disabled={!past.length} aria-label="Desfazer" title="Desfazer (Ctrl+Z)"><Undo2 size={17} /></button>
          <button className="icon-button bordered" onClick={redo} disabled={!future.length} aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)"><Redo2 size={17} /></button>
          <div className="dropdown">
            <button className="button-primary" onClick={() => setExportOpen(o => !o)} disabled={!!exporting} aria-expanded={exportOpen}>
              {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />} {exporting === "zip" ? "Gerando ZIP…" : exporting ? "Gerando…" : "Exportar"} <ChevronDown size={15} />
            </button>
            {exportOpen && <>
              <button className="dropdown-scrim" aria-label="Fechar" onClick={() => setExportOpen(false)} />
              <div className="dropdown-menu">
                <button onClick={exportCurrent}><Download size={16} /><span><strong>Slide atual em PNG</strong><small>{RATIO_SIZE[project.ratio].label} px</small></span></button>
                {isCarousel && <button onClick={exportAll}><FileArchive size={16} /><span><strong>Todos os slides (ZIP)</strong><small>{project.slides.length} imagens + legenda</small></span></button>}
                <button onClick={copyCaption} disabled={!project.caption.trim()}><ClipboardCopy size={16} /><span><strong>Copiar legenda</strong><small>{project.caption.trim() ? `${project.caption.length} caracteres` : "Escreva na aba Projeto"}</small></span></button>
              </div>
            </>}
          </div>
        </div>
      </div>

      <div className="editor-layout">
        <aside className="slides-rail" aria-label="Slides">
          <div className="rail-head"><span>Slides</span><small>{project.slides.length}/{MAX_SLIDES}</small></div>
          <div className="rail-list">
            {project.slides.map((s, i) => (
              <button key={s.id} className={`rail-thumb ${i === current ? "active" : ""}`} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}>
                <span className="rail-num">{i + 1}</span>
                <SlideCanvas slide={s} brand={brand} ratio={project.ratio} index={i} total={project.slides.length} showNumbers={project.showNumbers} showHandle={project.showHandle} isCarousel={isCarousel} quality={220} className="thumb-canvas" />
              </button>
            ))}
            {multi && <button className="rail-add" onClick={() => addSlide()} aria-label="Adicionar slide"><Plus size={18} /><span>Slide</span></button>}
          </div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-toolbar">
            <span className="canvas-info"><strong>{project.format}</strong> · {RATIO_SIZE[project.ratio].label}</span>
            <div className="canvas-tools">
              {multi && <>
                <button className="canvas-tool" onClick={() => moveSlide(-1)} disabled={current === 0} title="Mover para trás" aria-label="Mover slide para trás"><ArrowUp size={15} /></button>
                <button className="canvas-tool" onClick={() => moveSlide(1)} disabled={current === project.slides.length - 1} title="Mover para frente" aria-label="Mover slide para frente"><ArrowDown size={15} /></button>
                <button className="canvas-tool" onClick={duplicateSlide} title="Duplicar slide" aria-label="Duplicar slide"><Copy size={15} /></button>
              </>}
              <button className="canvas-tool danger" onClick={removeSlide} disabled={project.slides.length <= 1} title="Apagar slide" aria-label="Apagar slide"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="canvas-stage">
            {isCarousel && <button className="stage-nav prev" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} aria-label="Slide anterior"><ChevronLeft size={20} /></button>}
            <div className={`stage-frame ratio-${project.ratio.replace(":", "x")}`}>
              <SlideCanvas slide={slide} brand={brand} ratio={project.ratio} index={current} total={project.slides.length} showNumbers={project.showNumbers} showHandle={project.showHandle} isCarousel={isCarousel} quality={1080} className="stage-canvas" />
            </div>
            {isCarousel && <button className="stage-nav next" onClick={() => setCurrent(c => Math.min(project.slides.length - 1, c + 1))} disabled={current === project.slides.length - 1} aria-label="Próximo slide"><ChevronRight size={20} /></button>}
          </div>
          <div className="canvas-footerbar">
            <span>Slide {current + 1} de {project.slides.length}</span>
            <span className="kbd-hint">Use ← → para navegar · Ctrl+Z para desfazer</span>
          </div>
        </section>

        <aside className="editor-controls">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "slide"} className={tab === "slide" ? "active" : ""} onClick={() => setTab("slide")}>Slide {current + 1}</button>
            <button role="tab" aria-selected={tab === "projeto"} className={tab === "projeto" ? "active" : ""} onClick={() => setTab("projeto")}>Projeto</button>
          </div>

          {tab === "slide" ? (
            <div className="controls-scroll">
              <label className="field-label">Modelo do slide</label>
              <div className="layout-grid">
                {LAYOUTS.map(l => (
                  <button key={l.key} className={`layout-option ${slide.layout === l.key ? "selected" : ""}`} onClick={() => updateSlide({ layout: l.key })} title={l.hint}>
                    <span className={`layout-glyph glyph-${l.key}`}><i /><i /><i /></span>{l.label}
                  </button>
                ))}
              </div>

              <label className="field-label">Fundo</label>
              <div className="bg-options">
                {BACKGROUNDS.map(b => (
                  <button key={b.key} className={`bg-option ${slide.background === b.key ? "selected" : ""}`} onClick={() => updateSlide({ background: b.key })} title={b.label} aria-label={b.label}>
                    <span className={`bg-swatch bg-${b.key}`} style={{ "--p": brand.primary, "--s": brand.secondary, "--d": brand.dark, "--l": brand.light } as React.CSSProperties}>{b.key === "imagem" && <ImagePlus size={14} />}</span>
                    <small>{b.label}</small>
                  </button>
                ))}
              </div>

              {slide.background === "imagem" && (
                <div className="image-picker">
                  <div className="image-picker-head"><span>Imagem de fundo</span><button className="text-button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Enviar</button></div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { uploadImage(e.target.files?.[0]); e.target.value = ""; }} />
                  {library.length ? (
                    <div className="image-picker-grid">
                      {library.slice(0, 12).map(img => (
                        <button key={img.id} className={slide.imageId === img.id ? "selected" : ""} onClick={() => updateSlide({ imageId: img.id })} aria-label={img.name}>
                          <StoredImage id={img.id} alt={img.name} />
                          {slide.imageId === img.id && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button className="image-empty" onClick={() => fileRef.current?.click()}><ImagePlus size={20} /><span>Envie uma foto para usar de fundo</span></button>
                  )}
                </div>
              )}

              <div className="field-row">
                <label className="field-label">Alinhamento</label>
                <div className="segmented small">
                  <button className={slide.align === "left" ? "active" : ""} onClick={() => updateSlide({ align: "left" })} aria-label="Alinhar à esquerda"><AlignLeft size={15} /></button>
                  <button className={slide.align === "center" ? "active" : ""} onClick={() => updateSlide({ align: "center" })} aria-label="Centralizar"><AlignCenter size={15} /></button>
                </div>
              </div>

              <div className="control-divider" />

              {slide.layout !== "citacao" && <>
                <label className="field-label" htmlFor="f-kicker">Chamada pequena</label>
                <input id="f-kicker" className="text-field" value={slide.kicker} maxLength={40} onChange={e => updateSlide({ kicker: e.target.value }, "kicker")} placeholder="Ex.: PASSO 01" />
              </>}

              <label className="field-label" htmlFor="f-title">{slide.layout === "numero" ? "Número em destaque" : slide.layout === "citacao" ? "Frase" : "Título"}</label>
              <textarea id="f-title" className="text-field large-text" rows={3} maxLength={160} value={slide.title} onChange={e => updateSlide({ title: e.target.value }, "title")} placeholder={slide.layout === "numero" ? "Ex.: 73%" : "Escreva o título"} />
              {slide.layout !== "numero" && <p className="field-hint">Coloque palavras entre *asteriscos* para destacar na cor da marca.</p>}

              <label className="field-label" htmlFor="f-body">{slide.layout === "lista" ? "Itens da lista (um por linha)" : slide.layout === "citacao" ? "Autor" : "Texto de apoio"}</label>
              <textarea id="f-body" className="text-field" rows={slide.layout === "lista" ? 5 : 4} maxLength={420} value={slide.body} onChange={e => updateSlide({ body: e.target.value }, "body")} placeholder={slide.layout === "lista" ? "Primeiro item\nSegundo item" : "Texto de apoio"} />

              {(slide.layout === "final" || slide.layout === "capa") && <>
                <label className="field-label" htmlFor="f-cta">Texto do botão <span className="optional">· opcional</span></label>
                <input id="f-cta" className="text-field" value={slide.cta} maxLength={32} onChange={e => updateSlide({ cta: e.target.value }, "cta")} placeholder="Ex.: Link na bio" />
              </>}
            </div>
          ) : (
            <div className="controls-scroll">
              <label className="field-label" htmlFor="f-brand">Identidade visual</label>
              <select id="f-brand" className="text-field" value={project.brandId} onChange={e => commit({ ...project, brandId: e.target.value })}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              {allowedRatios.length > 1 && <>
                <label className="field-label">Proporção</label>
                <div className="segmented">
                  {allowedRatios.map(r => (
                    <button key={r} className={project.ratio === r ? "active" : ""} onClick={() => commit({ ...project, ratio: r as Ratio })}>{r === "1:1" ? "Quadrado 1:1" : "Retrato 4:5"}</button>
                  ))}
                </div>
              </>}

              <div className="control-divider" />
              <Toggle checked={project.showNumbers} onChange={v => commit({ ...project, showNumbers: v })} label="Numeração dos slides" hint="Mostra 01 / 05 no canto" />
              <Toggle checked={project.showHandle} onChange={v => commit({ ...project, showHandle: v })} label="Mostrar @ da marca" hint={brand.handle || "Defina o @ na identidade visual"} />
              <div className="control-divider" />

              <label className="field-label" htmlFor="f-caption">Legenda da publicação</label>
              <textarea id="f-caption" className="text-field" rows={7} maxLength={2200} value={project.caption} onChange={e => commit({ ...project, caption: e.target.value }, "caption")} placeholder="Escreva a legenda que vai junto com o post…" />
              <div className="char-count">{project.caption.length} / 2200</div>
            </div>
          )}

          {multi && tab === "slide" && (
            <div className="controls-foot">
              <button className="button-secondary" onClick={() => addSlide()}><Plus size={15} /> Novo slide</button>
              <button className="button-secondary" onClick={() => setCurrent(c => Math.min(project.slides.length - 1, c + 1))} disabled={current === project.slides.length - 1}>Próximo <ArrowRight size={15} /></button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
