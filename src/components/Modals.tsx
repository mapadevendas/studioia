"use client";

import { useRef, useState } from "react";
import { ArrowRight, BookImage, Check, FileImage, Image as ImageIcon, Layers3, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { Modal, Segmented, StoredImage } from "./ui";
import SlideCanvas from "./SlideCanvas";
import { FONTS, FORMATS, RATIO_SIZE, draftSlides, formatRatio, makeSlide, uid } from "@/lib/data";
import { prepareUpload } from "@/lib/images";
import { contrast } from "@/lib/render";
import type { Brand, FontKey, FormatName, LibraryImage, Project, Ratio } from "@/lib/types";

export const FORMAT_ICONS: Record<FormatName, typeof Layers3> = {
  "Carrossel": Layers3,
  "Post": ImageIcon,
  "Stories": BookImage,
  "Capa de Reels": FileImage,
};

export type CreateDefaults = { format?: FormatName; brandId?: string; title?: string };

export function CreateProjectModal({ brands, defaults, defaultRatio, onClose, onCreate }: {
  brands: Brand[]; defaults: CreateDefaults; defaultRatio: Ratio; onClose: () => void; onCreate: (p: Project) => void;
}) {
  const [format, setFormat] = useState<FormatName>(defaults.format ?? "Carrossel");
  const [ratio, setRatio] = useState<Ratio>(formatRatio(defaults.format ?? "Carrossel", defaultRatio));
  const [title, setTitle] = useState(defaults.title ?? "");
  const [topic, setTopic] = useState("");
  const [brandId, setBrandId] = useState(defaults.brandId ?? brands[0]?.id ?? "");
  const [count, setCount] = useState(format === "Stories" ? 3 : 6);
  const [cta, setCta] = useState("");
  const [error, setError] = useState("");

  const allowed = FORMATS.find(f => f.name === format)!.ratios;
  const multi = format === "Carrossel" || format === "Stories";

  function pickFormat(f: FormatName) {
    setFormat(f);
    setRatio(formatRatio(f, ratio));
    setCount(f === "Stories" ? 3 : 6);
  }

  function submit() {
    if (!topic.trim() && !title.trim()) { setError("Conte sobre o que é o conteúdo ou dê um nome ao projeto."); return; }
    if (!brandId) { setError("Crie uma identidade visual antes."); return; }
    const now = Date.now();
    onCreate({
      id: uid("p"),
      title: title.trim() || topic.trim().slice(0, 60),
      format, ratio, brandId,
      slides: draftSlides(format, topic.trim() || title.trim(), multi ? count : 1, cta.trim()),
      caption: "",
      showNumbers: format === "Carrossel",
      showHandle: true,
      createdAt: now, updatedAt: now,
    });
  }

  return (
    <Modal eyebrow="NOVO PROJETO" title="Vamos criar algo bom." subtitle="Defina o ponto de partida. Tudo pode ser ajustado no editor." onClose={onClose} size="lg"
      footer={<><button className="button-secondary" onClick={onClose}>Cancelar</button><button className="button-primary" onClick={submit}>Criar e abrir editor <ArrowRight size={16} /></button></>}>
      <label className="field-label">Formato</label>
      <div className="format-select-grid">
        {FORMATS.map(f => {
          const Icon = FORMAT_ICONS[f.name];
          return (
            <button key={f.name} className={`format-option ${format === f.name ? "selected" : ""}`} onClick={() => pickFormat(f.name)}>
              <Icon size={19} /><strong>{f.name}</strong><small>{f.ratios.map(r => RATIO_SIZE[r].label).join(" · ")}</small>
              {format === f.name && <Check size={14} className="option-check" />}
            </button>
          );
        })}
      </div>

      <label className="field-label" htmlFor="c-topic">Sobre o que será o conteúdo?</label>
      <textarea id="c-topic" className="text-field" value={topic} onChange={e => { setTopic(e.target.value); setError(""); }} placeholder="Ex.: 5 erros que atrasam quem está começando a investir" rows={2} maxLength={160} autoFocus />

      <label className="field-label" htmlFor="c-title">Nome do projeto <span className="optional">· opcional</span></label>
      <input id="c-title" className="text-field" value={title} onChange={e => { setTitle(e.target.value); setError(""); }} placeholder="Se ficar vazio, usamos o tema" maxLength={80} />

      <div className="form-two-col">
        <div>
          <label className="field-label" htmlFor="c-brand">Identidade visual</label>
          <select id="c-brand" className="text-field" value={brandId} onChange={e => setBrandId(e.target.value)}>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {multi ? (
          <div>
            <label className="field-label" htmlFor="c-count">Quantidade de slides</label>
            <select id="c-count" className="text-field" value={count} onChange={e => setCount(Number(e.target.value))}>
              {(format === "Stories" ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 7, 8, 10]).map(n => <option key={n} value={n}>{n} slides</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="field-label" htmlFor="c-cta">Texto do botão <span className="optional">· opcional</span></label>
            <input id="c-cta" className="text-field" value={cta} onChange={e => setCta(e.target.value)} placeholder="Ex.: Link na bio" maxLength={32} />
          </div>
        )}
      </div>

      {allowed.length > 1 && <>
        <label className="field-label">Proporção</label>
        <Segmented label="Proporção" value={ratio} onChange={setRatio} options={allowed.map(r => ({ key: r, label: r === "1:1" ? "Quadrado 1:1" : "Retrato 4:5 (recomendado)" }))} />
      </>}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-hint"><Sparkles size={16} /><span>Montamos um rascunho com capa, conteúdo e chamada final para você só preencher. A escrita automática por IA entra numa próxima etapa.</span></div>
    </Modal>
  );
}

export function BrandModal({ brand, library, onClose, onSave, onDelete, onAddImage, canDelete }: {
  brand: Brand | null; library: LibraryImage[]; onClose: () => void; onSave: (b: Brand) => void; onDelete?: () => void;
  onAddImage: (img: LibraryImage, blob: Blob) => Promise<void>; canDelete: boolean;
}) {
  const [draft, setDraft] = useState<Brand>(brand ?? {
    id: uid("b"), name: "", descriptor: "", handle: "", primary: "#6A34D0", secondary: "#FF6A1A", dark: "#121016", light: "#F7F4FB", font: "outfit", logo: null, createdAt: Date.now(),
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Brand>) => { setDraft(d => ({ ...d, ...patch })); setError(""); };

  const lowContrast = contrast(draft.dark, draft.light) < 4.5;

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("O logo precisa ser uma imagem (PNG com fundo transparente fica melhor).");
    setUploading(true);
    try {
      const { blob, width, height } = await prepareUpload(file, 1200);
      const img: LibraryImage = { id: uid("img"), name: `Logo ${draft.name || "da marca"}`, width, height, size: blob.size, createdAt: Date.now() };
      await onAddImage(img, blob);
      set({ logo: img.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar o logo.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!draft.name.trim()) return setError("Dê um nome para a marca.");
    const handle = draft.handle.trim();
    onSave({ ...draft, name: draft.name.trim(), descriptor: draft.descriptor.trim() || "Identidade visual", handle: handle && !handle.startsWith("@") ? `@${handle}` : handle });
  }

  const preview = makeSlide({ layout: "capa", kicker: "PRÉVIA", title: "Sua ideia *em destaque*", body: "Assim fica o conteúdo com esta marca." });
  const colors: { key: "primary" | "secondary" | "dark" | "light"; label: string }[] = [
    { key: "primary", label: "Principal" }, { key: "secondary", label: "Destaque" }, { key: "dark", label: "Escura" }, { key: "light", label: "Clara" },
  ];

  return (
    <Modal eyebrow="IDENTIDADE VISUAL" title={brand ? `Editar ${brand.name}` : "Nova marca"} subtitle="Cores, fonte e logo que vão em todos os conteúdos desta marca." onClose={onClose} size="lg"
      footer={<>
        {brand && canDelete && onDelete && <button className="button-danger-ghost" onClick={onDelete}><Trash2 size={15} /> Excluir</button>}
        <span className="footer-spacer" />
        <button className="button-secondary" onClick={onClose}>Cancelar</button>
        <button className="button-primary" onClick={submit}>{brand ? "Salvar marca" : "Criar marca"} <Check size={16} /></button>
      </>}>
      <div className="brand-form">
        <div className="brand-form-fields">
          <div className="form-two-col">
            <div>
              <label className="field-label" htmlFor="b-name">Nome da marca</label>
              <input id="b-name" className="text-field" value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="Ex.: Cardume" maxLength={40} autoFocus />
            </div>
            <div>
              <label className="field-label" htmlFor="b-handle">Perfil (@)</label>
              <input id="b-handle" className="text-field" value={draft.handle} onChange={e => set({ handle: e.target.value })} placeholder="@suamarca" maxLength={40} />
            </div>
          </div>
          <label className="field-label" htmlFor="b-desc">Descrição curta <span className="optional">· opcional</span></label>
          <input id="b-desc" className="text-field" value={draft.descriptor} onChange={e => set({ descriptor: e.target.value })} placeholder="Ex.: Consultoria · Finanças" maxLength={60} />

          <label className="field-label">Cores</label>
          <div className="color-grid">
            {colors.map(c => (
              <label key={c.key} className="color-cell">
                <input type="color" value={draft[c.key]} onChange={e => set({ [c.key]: e.target.value.toUpperCase() } as Partial<Brand>)} />
                <span><strong>{c.label}</strong><code>{draft[c.key].toUpperCase()}</code></span>
              </label>
            ))}
          </div>
          {lowContrast && <p className="field-warning">As cores escura e clara estão parecidas: os textos podem ficar difíceis de ler.</p>}

          <label className="field-label" htmlFor="b-font">Fonte dos títulos</label>
          <div className="font-grid">
            {(Object.keys(FONTS) as FontKey[]).map(k => (
              <button key={k} type="button" className={`font-option ${draft.font === k ? "selected" : ""}`} onClick={() => set({ font: k })} style={{ fontFamily: `"${FONTS[k].family}"` }}>
                Aa<small>{FONTS[k].label}</small>
              </button>
            ))}
          </div>

          <label className="field-label">Logo <span className="optional">· opcional</span></label>
          <div className="logo-row">
            <div className="logo-box" style={{ background: draft.dark }}>
              {draft.logo ? <StoredImage id={draft.logo} alt="Logo" /> : <span style={{ color: draft.light }}>{draft.name || "Logo"}</span>}
            </div>
            <div className="logo-actions">
              <button className="button-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload size={15} /> {uploading ? "Enviando…" : draft.logo ? "Trocar" : "Enviar logo"}</button>
              {draft.logo && <button className="button-ghost" onClick={() => set({ logo: null })}>Remover</button>}
              {library.length > 0 && !draft.logo && (
                <select className="text-field compact" value="" onChange={e => e.target.value && set({ logo: e.target.value })} aria-label="Usar imagem da biblioteca">
                  <option value="">Usar da biblioteca…</option>
                  {library.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="brand-form-preview">
          <span className="preview-caption">Prévia ao vivo</span>
          <SlideCanvas slide={preview} brand={{ ...draft, name: draft.name || "Sua marca" }} ratio="4:5" index={0} total={5} showNumbers showHandle isCarousel quality={400} className="brand-preview-canvas" />
          <SlideCanvas slide={{ ...preview, layout: "lista", background: "claro", kicker: "TRÊS PASSOS", title: "Como funciona", body: "Escolha a cor\nDefina a fonte\nCrie o conteúdo" }} brand={{ ...draft, name: draft.name || "Sua marca" }} ratio="4:5" index={1} total={5} showNumbers showHandle isCarousel quality={400} className="brand-preview-canvas small" />
        </div>
      </div>
    </Modal>
  );
}

export function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }: { title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm"
      footer={<><button className="button-secondary" onClick={onCancel}>Cancelar</button><button className="button-danger" onClick={onConfirm}>{confirmLabel}</button></>}>
      <p className="confirm-text">{message}</p>
    </Modal>
  );
}

export function NewBrandButton({ onClick }: { onClick: () => void }) {
  return <button className="brand-add-card" onClick={onClick}><div><Plus size={22} /></div><strong>Adicionar identidade</strong><span>Cores, fonte e logo</span></button>;
}
