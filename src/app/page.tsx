"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight, ArrowRight, Bell, Check, ChevronDown, Cloud, Copy, FolderOpen, LayoutGrid,
  ImagePlus, LayoutDashboard, LibraryBig, Menu, MoreHorizontal, Palette, Pencil, Plus, Search, Settings2,
  SquarePen, Trash2, Upload, WandSparkles, X, RotateCcw, FileJson, HardDrive,
} from "lucide-react";
import logo from "../../assets/uploads/cardume-logo.webp";
import Editor from "@/components/Editor";
import SlideCanvas from "@/components/SlideCanvas";
import { BrandModal, ConfirmModal, CreateProjectModal, FORMAT_ICONS, NewBrandButton, type CreateDefaults } from "@/components/Modals";
import { Modal, Segmented, StoredImage, Toggle, formatBytes, timeAgo } from "@/components/ui";
import { FONTS, FORMATS, RATIO_SIZE, TEMPLATES, cloneSlides, uid } from "@/lib/data";
import { downloadBlob, prepareUpload } from "@/lib/images";
import { useStudio } from "@/lib/useStudio";
import type { Brand, FormatName, LibraryImage, Project, StudioData, Template } from "@/lib/types";

type Page = "Início" | "Projetos" | "Identidade visual" | "Biblioteca" | "Modelos" | "Configurações" | "Editor";
type Confirm = { title: string; message: string; confirmLabel: string; run: () => void };

const NAV: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: "Início", icon: LayoutDashboard },
  { label: "Projetos", icon: FolderOpen },
  { label: "Identidade visual", icon: Palette },
  { label: "Biblioteca", icon: LibraryBig },
];

const FILTERS: { key: "Todos" | FormatName; label: string }[] = [
  { key: "Todos", label: "Todos" },
  { key: "Carrossel", label: "Carrosséis" },
  { key: "Post", label: "Posts" },
  { key: "Stories", label: "Stories" },
  { key: "Capa de Reels", label: "Capas de Reels" },
];

export default function Home() {
  const studio = useStudio();
  const { data } = studio;
  const [active, setActive] = useState<Page>("Início");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | FormatName>("Todos");
  const [sort, setSort] = useState<"recentes" | "nome" | "antigos">("recentes");
  const [create, setCreate] = useState<CreateDefaults | null>(null);
  const [brandModal, setBrandModal] = useState<Brand | "new" | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((msg: string) => setNotice(msg), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (active === "Editor") setActive("Projetos");
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const brandOf = useCallback((id: string) => data.brands.find(b => b.id === id) ?? data.brands[0], [data.brands]);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.projects.filter(p => {
      if (filter !== "Todos" && p.format !== filter) return false;
      if (!q) return true;
      return `${p.title} ${brandOf(p.brandId)?.name ?? ""} ${p.format}`.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => sort === "nome" ? a.title.localeCompare(b.title, "pt-BR") : sort === "antigos" ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt);
  }, [data.projects, query, filter, sort, brandOf]);

  const recent = useMemo(() => [...data.projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3), [data.projects]);
  const editing = editingId ? data.projects.find(p => p.id === editingId) ?? null : null;

  function navigate(page: Page) {
    setActive(page);
    setMobileNav(false);
    if (page !== "Editor") setEditingId(null);
    window.scrollTo({ top: 0 });
  }

  function openProject(p: Project) {
    setEditingId(p.id);
    setActive("Editor");
    setMobileNav(false);
    window.scrollTo({ top: 0 });
  }

  function createProject(p: Project) {
    studio.upsertProject(p);
    setCreate(null);
    openProject(p);
    notify("Projeto criado. Edite os textos e exporte quando quiser.");
  }

  function duplicateProject(p: Project) {
    const copy: Project = { ...p, id: uid("p"), title: `${p.title} (cópia)`, slides: cloneSlides(p.slides), createdAt: Date.now(), updatedAt: Date.now() };
    studio.upsertProject(copy);
    notify("Projeto duplicado.");
  }

  function askDeleteProject(p: Project) {
    setConfirm({
      title: "Excluir projeto?",
      message: `“${p.title}” e seus ${p.slides.length} slide(s) serão apagados. Não dá para desfazer.`,
      confirmLabel: "Excluir projeto",
      run: () => {
        studio.deleteProject(p.id);
        if (editingId === p.id) navigate("Projetos");
        notify("Projeto excluído.");
      },
    });
  }

  function applyTemplate(t: Template, brandId?: string) {
    const now = Date.now();
    createProject({
      id: uid("p"), title: t.name, format: t.format, ratio: t.ratio, brandId: brandId ?? data.brands[0].id,
      slides: cloneSlides(t.slides), caption: "", showNumbers: t.format === "Carrossel", showHandle: true, createdAt: now, updatedAt: now,
    });
  }

  async function addImage(img: LibraryImage, blob: Blob) {
    try {
      await studio.addImage(img, blob);
    } catch {
      notify("Sem espaço para guardar a imagem neste navegador.");
      throw new Error("Sem espaço para guardar a imagem neste navegador.");
    }
  }

  const { upsertProject } = studio;
  const onEditorChange = useCallback((p: Project) => upsertProject(p), [upsertProject]);

  if (!studio.ready) {
    return <div className="boot-screen"><div className="boot-mark"><i /><i /><i /></div></div>;
  }

  const pageTitle = active === "Início" ? "Visão geral" : active === "Editor" ? editing?.title ?? "Editor" : active;
  const notifications = [
    data.projects.length === 0 ? "Crie o seu primeiro projeto para começar." : `${data.projects.length} projeto(s) salvos neste navegador.`,
    data.library.length === 0 ? "Envie fotos na Biblioteca para usar de fundo nos slides." : `${data.library.length} imagem(ns) na sua biblioteca.`,
    "Conexão com a nuvem: disponível numa próxima etapa.",
  ];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.src} alt="Cardume — organizado por natureza, feito para multiplicar" className="brand-logo" width={900} height={225} />
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        <button className="workspace-switch" onClick={() => navigate("Configurações")}>
          <div className="workspace-avatar">{data.settings.studioName.trim()[0]?.toUpperCase() ?? "C"}</div>
          <div className="workspace-copy"><strong>{data.settings.studioName}</strong><span>Espaço pessoal</span></div>
          <ChevronDown size={15} />
        </button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} className={`nav-item ${active === item.label ? "active" : ""}`} onClick={() => navigate(item.label)}>
                <Icon size={18} /><span>{item.label}</span>
                {item.label === "Projetos" && <span className="nav-count">{data.projects.length}</span>}
                {item.label === "Biblioteca" && data.library.length > 0 && <span className="nav-count">{data.library.length}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">FERRAMENTAS</div>
        <nav className="nav-list">
          <button className={`nav-item ${active === "Editor" ? "active" : ""}`} onClick={() => { const p = editing ?? recent[0]; if (p) openProject(p); else setCreate({}); }}><SquarePen size={18} /><span>Editor visual</span></button>
          <button className={`nav-item ${active === "Modelos" ? "active" : ""}`} onClick={() => navigate("Modelos")}><LayoutGrid size={18} /><span>Modelos</span><span className="nav-count">{TEMPLATES.length}</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-top"><span>Armazenamento</span><HardDrive size={15} /></div>
            <strong>Neste navegador</strong>
            <div className="usage-track"><div style={{ width: `${Math.min(100, 8 + data.projects.length * 4 + data.library.length * 3)}%` }} /></div>
            <p>{data.projects.length} projetos · {data.library.length} imagens</p>
          </div>
          <button className={`nav-item ${active === "Configurações" ? "active" : ""}`} onClick={() => navigate("Configurações")}><Settings2 size={18} /><span>Configurações</span></button>
          <div className="profile-row">
            <div className="profile-avatar">{data.settings.userName.trim()[0]?.toUpperCase() ?? "V"}</div>
            <div className="profile-info"><strong>{data.settings.userName}</strong><span>Plano pessoal</span></div>
            <button className="icon-button" onClick={() => navigate("Configurações")} aria-label="Perfil"><MoreHorizontal size={18} /></button>
          </div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu size={20} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input ref={searchRef} value={query} onChange={e => { setQuery(e.target.value); if (active !== "Projetos" && e.target.value) navigate("Projetos"); }} placeholder="Buscar projetos..." aria-label="Buscar projetos" />
              {query ? <button className="search-clear" onClick={() => setQuery("")} aria-label="Limpar busca"><X size={13} /></button> : <kbd>⌘ K</kbd>}
            </div>
            <div className="dropdown">
              <button className="icon-button notification-button" aria-label="Avisos" onClick={() => setNotifOpen(o => !o)}><Bell size={18} /><i /></button>
              {notifOpen && <>
                <button className="dropdown-scrim" aria-label="Fechar" onClick={() => setNotifOpen(false)} />
                <div className="dropdown-menu notif-menu">
                  <div className="notif-head">Avisos</div>
                  {notifications.map(n => <div key={n} className="notif-item"><span />{n}</div>)}
                </div>
              </>}
            </div>
            <button className="button-primary topbar-create" onClick={() => setCreate({})}><Plus size={16} /> <span>Criar</span></button>
          </div>
        </header>

        {active === "Editor" && editing ? (
          <Editor key={editing.id} project={editing} brands={data.brands} library={data.library} saveState={studio.saveState}
            onChange={onEditorChange} onBack={() => navigate("Projetos")} onAddImage={addImage} notify={notify} />
        ) : active === "Identidade visual" ? (
          <div className="page-content">
            <div className="page-heading">
              <div><div className="eyebrow"><span className="eyebrow-dot" /> SISTEMA DE MARCA</div><h1>Identidade visual</h1><p>Cores, fonte e logo de cada marca. Todo conteúdo criado segue a marca escolhida.</p></div>
              <button className="button-primary" onClick={() => setBrandModal("new")}><Plus size={17} /> Nova marca</button>
            </div>
            <div className="brand-grid">
              {data.brands.map(b => {
                const count = data.projects.filter(p => p.brandId === b.id).length;
                return (
                  <div className="brand-card" key={b.id}>
                    <div className="brand-card-top">
                      <div className="brand-mark" style={{ background: b.dark, color: b.light }}>
                        {b.logo ? <StoredImage id={b.logo} alt={b.name} /> : <span style={{ fontFamily: `"${FONTS[b.font].family}"` }}>{b.name[0]}</span>}
                      </div>
                      <button className="icon-button" onClick={() => setBrandModal(b)} aria-label={`Editar ${b.name}`}><Pencil size={16} /></button>
                    </div>
                    <h3>{b.name}</h3>
                    <p>{b.descriptor}{b.handle && <> · <span className="handle">{b.handle}</span></>}</p>
                    <div className="brand-palette">
                      {[b.primary, b.secondary, b.dark, b.light].map((c, i) => <span key={i} style={{ background: c }} title={c} />)}
                    </div>
                    <div className="brand-color-row"><code>{b.primary}</code><span className="brand-color-label">{count} projeto(s)</span></div>
                    <button className="brand-open" onClick={() => setCreate({ brandId: b.id })}>Criar conteúdo com esta marca <ArrowRight size={15} /></button>
                  </div>
                );
              })}
              <NewBrandButton onClick={() => setBrandModal("new")} />
            </div>
          </div>
        ) : active === "Projetos" ? (
          <div className="page-content">
            <div className="page-heading">
              <div><div className="eyebrow"><span className="eyebrow-dot" /> SEU CONTEÚDO</div><h1>Projetos</h1><p>Todos os seus rascunhos em um só lugar.</p></div>
              <button className="button-primary" onClick={() => setCreate({})}><Plus size={17} /> Novo projeto</button>
            </div>
            <div className="filter-row">
              {FILTERS.map(f => {
                const n = f.key === "Todos" ? data.projects.length : data.projects.filter(p => p.format === f.key).length;
                return <button key={f.key} className={`filter-chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label} <span>{n}</span></button>;
              })}
              <div className="filter-spacer" />
              <label className="sort-button">
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Ordenar">
                  <option value="recentes">Mais recentes</option>
                  <option value="antigos">Mais antigos</option>
                  <option value="nome">Nome (A–Z)</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
            {query && <p className="search-note">{projects.length} resultado(s) para “{query}” <button className="text-button" onClick={() => setQuery("")}>Limpar</button></p>}
            {projects.length ? (
              <div className="projects-grid">
                {projects.map(p => <ProjectCard key={p.id} project={p} brand={brandOf(p.brandId)} onOpen={() => openProject(p)} onDuplicate={() => duplicateProject(p)} onDelete={() => askDeleteProject(p)} onRename={() => setRenaming(p)} />)}
                <button className="new-project-card" onClick={() => setCreate({})}><span><Plus size={23} /></span><strong>Criar novo projeto</strong><small>Carrossel, post, stories ou capa</small></button>
              </div>
            ) : (
              <EmptyState title={query || filter !== "Todos" ? "Nada encontrado" : "Nenhum projeto ainda"} text={query || filter !== "Todos" ? "Tente outra busca ou outro filtro." : "Crie o primeiro conteúdo ou comece por um modelo."}
                action={query || filter !== "Todos" ? <button className="button-secondary" onClick={() => { setQuery(""); setFilter("Todos"); }}>Limpar filtros</button> : <button className="button-primary" onClick={() => setCreate({})}><Plus size={16} /> Novo projeto</button>} />
            )}
          </div>
        ) : active === "Biblioteca" ? (
          <LibraryPage library={data.library} onAdd={addImage} notify={notify}
            onDelete={img => setConfirm({ title: "Excluir imagem?", message: `“${img.name}” sai da biblioteca e dos slides e logos que a usam.`, confirmLabel: "Excluir imagem", run: () => { studio.deleteImage(img.id); notify("Imagem excluída."); } })} />
        ) : active === "Modelos" ? (
          <TemplatesPage brands={data.brands} onUse={applyTemplate} />
        ) : active === "Configurações" ? (
          <SettingsPage data={data} onChange={studio.updateSettings} notify={notify}
            onExport={() => { downloadBlob(new Blob([studio.exportBackup()], { type: "application/json" }), "cardume-backup.json"); notify("Cópia de segurança baixada."); }}
            onReset={() => setConfirm({ title: "Apagar tudo?", message: "Projetos, marcas, imagens e preferências deste navegador serão apagados e o estúdio volta aos exemplos.", confirmLabel: "Apagar tudo", run: () => { studio.resetAll(); notify("Estúdio restaurado com os exemplos."); } })} />
        ) : (
          <div className="page-content">
            <div className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-dot" /> OLÁ, {data.settings.userName.toUpperCase()}</div>
                <h1>Ideias organizadas,<br /><span>conteúdo que multiplica.</span></h1>
                <p>Crie carrosséis, posts e stories com a identidade da sua marca, em minutos.</p>
                <div className="welcome-actions">
                  <button className="button-primary large-button" onClick={() => setCreate({})}><WandSparkles size={17} /> Criar conteúdo <ArrowRight size={16} /></button>
                  <button className="button-secondary large-button" onClick={() => navigate("Modelos")}>Ver modelos</button>
                </div>
                <div className="hero-stats">
                  <div><strong>{data.projects.length}</strong><span>projetos</span></div>
                  <div><strong>{data.projects.reduce((s, p) => s + p.slides.length, 0)}</strong><span>slides</span></div>
                  <div><strong>{data.brands.length}</strong><span>marcas</span></div>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                {recent[0] && <div className="hero-card hero-card-back"><SlideCanvas slide={recent[0].slides[Math.min(1, recent[0].slides.length - 1)]} brand={brandOf(recent[0].brandId)} ratio="4:5" index={1} total={recent[0].slides.length} showNumbers showHandle isCarousel quality={360} className="hero-canvas" /></div>}
                {recent[0] && <div className="hero-card hero-card-front"><SlideCanvas slide={recent[0].slides[0]} brand={brandOf(recent[0].brandId)} ratio="4:5" index={0} total={recent[0].slides.length} showNumbers showHandle isCarousel quality={420} className="hero-canvas" /></div>}
                <div className="hero-flock">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>
              </div>
            </div>

            <div className="section-heading">
              <div><h2>Comece por aqui</h2><p>Escolha o formato ideal para sua ideia.</p></div>
              <button className="text-button" onClick={() => navigate("Modelos")}>Ver modelos prontos <ArrowRight size={15} /></button>
            </div>
            <div className="format-grid">
              {FORMATS.map(f => {
                const Icon = FORMAT_ICONS[f.name];
                return (
                  <button className="format-card" key={f.name} onClick={() => setCreate({ format: f.name })}>
                    <div className={`format-icon format-${f.name.toLowerCase().replaceAll(" ", "-")}`}><Icon size={20} /></div>
                    <div className="format-copy"><strong>{f.name}</strong><span>{f.detail}</span><small>{f.ratios.map(r => RATIO_SIZE[r].label).join(" · ")}</small></div>
                    <ArrowDownRight size={17} className="format-arrow" />
                  </button>
                );
              })}
            </div>

            <div className="section-heading recent-heading">
              <div><h2>Projetos recentes</h2><p>Suas últimas ideias, prontas para continuar.</p></div>
              <button className="text-button" onClick={() => navigate("Projetos")}>Ver todos <ArrowRight size={15} /></button>
            </div>
            <div className="projects-grid">
              {recent.map(p => <ProjectCard key={p.id} project={p} brand={brandOf(p.brandId)} onOpen={() => openProject(p)} onDuplicate={() => duplicateProject(p)} onDelete={() => askDeleteProject(p)} onRename={() => setRenaming(p)} />)}
              <button className="new-project-card" onClick={() => setCreate({})}><span><Plus size={23} /></span><strong>Nova ideia</strong><small>Comece do zero</small></button>
            </div>

            <div className="phase-banner">
              <div className="phase-icon"><Cloud size={18} /></div>
              <div><strong>Seus dados ficam neste navegador.</strong><p>Tudo é salvo automaticamente aqui. A sincronização na nuvem, o login e a escrita por IA entram nas próximas etapas.</p></div>
              <button className="text-button" onClick={() => navigate("Configurações")}>Fazer cópia <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {active !== "Editor" && <footer className="app-footer"><span>cardume <i>·</i> organizado por natureza, feito para multiplicar</span><span>Salvo neste navegador <span className="footer-dot" /></span></footer>}
      </section>

      {create && <CreateProjectModal brands={data.brands} defaults={create} defaultRatio={data.settings.defaultRatio} onClose={() => setCreate(null)} onCreate={createProject} />}

      {brandModal && (
        <BrandModal brand={brandModal === "new" ? null : brandModal} library={data.library} onClose={() => setBrandModal(null)} onAddImage={addImage} canDelete={data.brands.length > 1}
          onSave={b => { studio.upsertBrand(b); setBrandModal(null); notify(brandModal === "new" ? "Marca criada." : "Marca atualizada."); }}
          onDelete={brandModal !== "new" ? () => {
            const b = brandModal;
            const n = data.projects.filter(p => p.brandId === b.id).length;
            setBrandModal(null);
            setConfirm({ title: "Excluir marca?", message: n ? `${n} projeto(s) usam “${b.name}” e passarão para outra marca.` : `“${b.name}” será excluída.`, confirmLabel: "Excluir marca", run: () => { studio.deleteBrand(b.id); notify("Marca excluída."); } });
          } : undefined} />
      )}

      {renaming && <RenameModal project={renaming} onClose={() => setRenaming(null)} onSave={title => { studio.upsertProject({ ...renaming, title }); setRenaming(null); notify("Nome atualizado."); }} />}

      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.run(); setConfirm(null); }} />}

      {notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={15} /></button></div>}
    </main>
  );
}

function ProjectCard({ project, brand, onOpen, onDuplicate, onDelete, onRename }: { project: Project; brand: Brand; onOpen: () => void; onDuplicate: () => void; onDelete: () => void; onRename: () => void }) {
  const [menu, setMenu] = useState(false);
  const first = project.slides[0];
  return (
    <div className="project-card">
      <button className="project-preview-button" onClick={onOpen} aria-label={`Abrir ${project.title}`}>
        <div className={`project-preview ratio-${project.ratio.replace(":", "x")}`}>
          {first && <SlideCanvas slide={first} brand={brand} ratio={project.ratio} index={0} total={project.slides.length} showNumbers={project.showNumbers} showHandle={project.showHandle} isCarousel={project.slides.length > 1} quality={360} className="preview-canvas" />}
          {project.slides.length > 1 && <span className="slide-badge">{project.slides.length} slides</span>}
        </div>
      </button>
      <div className="project-info">
        <div><strong>{project.title}</strong><span>{brand.name} <i>·</i> {project.format}</span></div>
        <div className="dropdown">
          <button className="icon-button project-more" onClick={() => setMenu(m => !m)} aria-label="Opções do projeto" aria-expanded={menu}><MoreHorizontal size={18} /></button>
          {menu && <>
            <button className="dropdown-scrim" aria-label="Fechar" onClick={() => setMenu(false)} />
            <div className="dropdown-menu small">
              <button onClick={() => { setMenu(false); onOpen(); }}><SquarePen size={15} /> Abrir no editor</button>
              <button onClick={() => { setMenu(false); onRename(); }}><Pencil size={15} /> Renomear</button>
              <button onClick={() => { setMenu(false); onDuplicate(); }}><Copy size={15} /> Duplicar</button>
              <button className="danger" onClick={() => { setMenu(false); onDelete(); }}><Trash2 size={15} /> Excluir</button>
            </div>
          </>}
        </div>
      </div>
      <div className="project-meta"><span>{timeAgo(project.updatedAt)}</span><button onClick={onOpen}>Editar <ArrowRight size={13} /></button></div>
    </div>
  );
}

function RenameModal({ project, onClose, onSave }: { project: Project; onClose: () => void; onSave: (t: string) => void }) {
  const [title, setTitle] = useState(project.title);
  const submit = () => title.trim() && onSave(title.trim());
  return (
    <Modal title="Renomear projeto" onClose={onClose} size="sm"
      footer={<><button className="button-secondary" onClick={onClose}>Cancelar</button><button className="button-primary" onClick={submit} disabled={!title.trim()}>Salvar</button></>}>
      <label className="field-label" htmlFor="r-title">Nome</label>
      <input id="r-title" className="text-field" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} maxLength={80} autoFocus />
    </Modal>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-flock">{Array.from({ length: 6 }).map((_, i) => <i key={i} />)}</div>
      <strong>{title}</strong><p>{text}</p>{action}
    </div>
  );
}

function LibraryPage({ library, onAdd, onDelete, notify }: { library: LibraryImage[]; onAdd: (img: LibraryImage, blob: Blob) => Promise<void>; onDelete: (img: LibraryImage) => void; notify: (m: string) => void }) {
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter(f => f.type.startsWith("image/"));
    if (!list.length) return notify("Escolha arquivos de imagem (JPG, PNG ou WebP).");
    setBusy(list.length);
    let ok = 0;
    for (const file of list) {
      if (file.size > 15 * 1024 * 1024) { notify(`${file.name} passa de 15 MB e foi ignorada.`); setBusy(b => b - 1); continue; }
      try {
        const { blob, width, height } = await prepareUpload(file);
        await onAdd({ id: uid("img"), name: file.name.replace(/\.[^.]+$/, ""), width, height, size: blob.size, createdAt: Date.now() }, blob);
        ok++;
      } catch { /* aviso já mostrado */ }
      setBusy(b => b - 1);
    }
    if (ok) notify(ok === 1 ? "Imagem adicionada." : `${ok} imagens adicionadas.`);
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> SEUS ARQUIVOS</div><h1>Biblioteca</h1><p>Fotos e logos para usar de fundo nos slides e nas marcas.</p></div>
        <button className="button-primary" onClick={() => fileRef.current?.click()} disabled={busy > 0}><Upload size={17} /> {busy ? `Enviando ${busy}…` : "Enviar imagens"}</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ""; }} />
      </div>
      <div className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}>
        <ImagePlus size={22} /><strong>Arraste imagens para cá</strong><span>ou clique para escolher · JPG, PNG ou WebP até 15 MB</span>
      </div>
      {library.length ? (
        <div className="library-grid">
          {library.map(img => (
            <div className="library-card" key={img.id}>
              <div className="library-thumb"><StoredImage id={img.id} alt={img.name} /></div>
              <div className="library-info">
                <div><strong title={img.name}>{img.name}</strong><span>{img.width} × {img.height} · {formatBytes(img.size)}</span></div>
                <button className="icon-button" onClick={() => onDelete(img)} aria-label={`Excluir ${img.name}`}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="library-empty">Nenhuma imagem ainda. As que você enviar ficam guardadas neste navegador.</p>
      )}
    </div>
  );
}

function TemplatesPage({ brands, onUse }: { brands: Brand[]; onUse: (t: Template, brandId: string) => void }) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [format, setFormat] = useState<"Todos" | FormatName>("Todos");
  const brand = brands.find(b => b.id === brandId) ?? brands[0];
  const list = TEMPLATES.filter(t => format === "Todos" || t.format === format);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> PONTO DE PARTIDA</div><h1>Modelos</h1><p>Estruturas prontas que já saem com as cores da sua marca.</p></div>
        <label className="brand-picker">
          <span>Ver com a marca</span>
          <select value={brandId} onChange={e => setBrandId(e.target.value)}>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <ChevronDown size={15} />
        </label>
      </div>
      <div className="filter-row">
        {FILTERS.map(f => <button key={f.key} className={`filter-chip ${format === f.key ? "active" : ""}`} onClick={() => setFormat(f.key)}>{f.label}</button>)}
      </div>
      <div className="template-grid">
        {list.map(t => {
          const slides = cloneSlides(t.slides);
          return (
            <button className="template-card" key={t.id} onClick={() => onUse(t, brand.id)}>
              <div className={`template-art ratio-${t.ratio.replace(":", "x")}`}>
                <SlideCanvas slide={slides[0]} brand={brand} ratio={t.ratio} index={0} total={slides.length} showNumbers={t.format === "Carrossel"} showHandle isCarousel={slides.length > 1} quality={360} className="preview-canvas" />
                <span className="template-use">Usar modelo <ArrowRight size={14} /></span>
              </div>
              <div className="template-meta"><strong>{t.name}</strong><span>{t.format} · {slides.length > 1 ? `${slides.length} slides` : RATIO_SIZE[t.ratio].label}</span><small>{t.description}</small></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsPage({ data, onChange, onExport, onReset, notify }: { data: StudioData; onChange: (p: Partial<StudioData["settings"]>) => void; onExport: () => void; onReset: () => void; notify: (m: string) => void }) {
  const s = data.settings;
  return (
    <div className="page-content narrow">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> PREFERÊNCIAS</div><h1>Configurações</h1><p>Seu perfil, os padrões dos novos projetos e seus dados.</p></div>
      </div>

      <section className="settings-card">
        <h3>Perfil</h3>
        <div className="form-two-col">
          <div><label className="field-label" htmlFor="s-name">Seu nome</label><input id="s-name" className="text-field" value={s.userName} maxLength={40} onChange={e => onChange({ userName: e.target.value })} onBlur={() => !s.userName.trim() && onChange({ userName: "Você" })} /></div>
          <div><label className="field-label" htmlFor="s-studio">Nome do estúdio</label><input id="s-studio" className="text-field" value={s.studioName} maxLength={40} onChange={e => onChange({ studioName: e.target.value })} onBlur={() => !s.studioName.trim() && onChange({ studioName: "Meu estúdio" })} /></div>
        </div>
      </section>

      <section className="settings-card">
        <h3>Padrões de novos projetos</h3>
        <label className="field-label">Proporção de carrosséis e posts</label>
        <Segmented label="Proporção padrão" value={s.defaultRatio} onChange={v => { onChange({ defaultRatio: v }); notify("Padrão atualizado."); }} options={[{ key: "4:5", label: "Retrato 4:5" }, { key: "1:1", label: "Quadrado 1:1" }]} />
        <div className="settings-toggles">
          <Toggle checked={s.showNumbers} onChange={v => onChange({ showNumbers: v })} label="Numeração dos slides" hint="Mostra 01 / 05 no canto dos carrosséis" />
          <Toggle checked={s.showHandle} onChange={v => onChange({ showHandle: v })} label="Mostrar @ da marca" hint="No rodapé de cada slide" />
        </div>
      </section>

      <section className="settings-card">
        <h3>Seus dados</h3>
        <p className="settings-text">Tudo fica salvo neste navegador: {data.projects.length} projetos, {data.brands.length} marcas e {data.library.length} imagens. Se limpar os dados do navegador, eles somem — faça cópias de vez em quando.</p>
        <div className="settings-actions">
          <button className="button-secondary" onClick={onExport}><FileJson size={16} /> Baixar cópia de segurança</button>
          <button className="button-danger-ghost" onClick={onReset}><RotateCcw size={15} /> Apagar tudo e recomeçar</button>
        </div>
      </section>

      <section className="settings-card connect-card">
        <div className="connect-icon"><Cloud size={20} /></div>
        <div>
          <h3>Nuvem e login <span className="tag-soon">EM BREVE</span></h3>
          <p className="settings-text">Na próxima etapa, os projetos e imagens passam a ser salvos na nuvem, com login e acesso de qualquer aparelho.</p>
        </div>
      </section>
    </div>
  );
}
