"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, Bell, BookImage, BriefcaseBusiness,
  Check, ChevronDown, CircleHelp, Clock3, Command, Copy, FileImage,
  FolderOpen, Grid2X2, Image as ImageIcon, LayoutDashboard, LibraryBig,
  Menu, MoreHorizontal, Palette, Plus, Search, Settings2, Sparkles,
  SquarePen, WandSparkles, X, Layers3, Type, Shapes, Download
} from "lucide-react";

type Project = {
  id: number;
  title: string;
  format: string;
  brand: string;
  updated: string;
  theme: string;
  slides: number;
};

const initialProjects: Project[] = [
  { id: 1, title: "Consórcio sem complicação", format: "Carrossel", brand: "Ademicon", updated: "Hoje, 10:42", theme: "plum", slides: 7 },
  { id: 2, title: "3 ideias para recomeçar", format: "Stories", brand: "Reinventaia", updated: "Ontem", theme: "sand", slides: 4 },
  { id: 3, title: "Sua próxima fase começa aqui", format: "Post", brand: "Sala Secreta", updated: "22 out.", theme: "dark", slides: 1 },
];

const formats = [
  { name: "Carrossel", detail: "Conte uma história em slides", size: "1080 × 1080", icon: Layers3 },
  { name: "Post", detail: "Uma ideia, uma imagem", size: "1080 × 1080", icon: ImageIcon },
  { name: "Stories", detail: "Conteúdo vertical", size: "1080 × 1920", icon: BookImage },
  { name: "Capa de Reels", detail: "Destaque seu vídeo", size: "1080 × 1920", icon: FileImage },
];

const brandDefaults = [
  { name: "Ademicon", descriptor: "Consórcios · Institucional", color: "#722B4C", initials: "A", bg: "#F4E8ED" },
  { name: "Reinventaia", descriptor: "Mentoria · Mulheres 40+", color: "#C67C58", initials: "R", bg: "#F7EDE5" },
  { name: "Sala Secreta", descriptor: "Produtividade · IA", color: "#222222", initials: "S", bg: "#E9E7E4" },
];

export default function Home() {
  const [active, setActive] = useState("Início");
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [format, setFormat] = useState("Carrossel");
  const [topic, setTopic] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Ademicon");
  const [slideCount, setSlideCount] = useState("7");
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#722B4C");
  const [brands, setBrands] = useState(brandDefaults);
  const [editorProject, setEditorProject] = useState<Project | null>(null);
  const [editorText, setEditorText] = useState("Sua próxima grande ideia começa aqui.");
  const [editorSubtext, setEditorSubtext] = useState("Transforme conhecimento em conteúdo que conecta.");
  const [editorColor, setEditorColor] = useState("#722B4C");
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const filteredProjects = useMemo(() => projects.filter(p =>
    `${p.title} ${p.brand} ${p.format}`.toLowerCase().includes(query.toLowerCase())
  ), [projects, query]);

  function createProject() {
    const newProject: Project = {
      id: Date.now(),
      title: projectTitle.trim() || topic.trim() || `Novo ${format.toLowerCase()}`,
      format, brand: selectedBrand, updated: "Agora mesmo",
      theme: "plum", slides: format === "Post" ? 1 : Number(slideCount)
    };
    setProjects(prev => [newProject, ...prev]);
    setEditorProject(newProject);
    setEditorText(topic.trim() || "Sua próxima grande ideia começa aqui.");
    setEditorSubtext("Transforme conhecimento em conteúdo que conecta.");
    setEditorColor(brands.find(b => b.name === selectedBrand)?.color || "#722B4C");
    setShowCreate(false);
    setActive("Editor");
    setNotice("Projeto criado. Os dados ficam nesta demonstração enquanto você testa a interface.");
  }

  function saveBrand() {
    if (!brandName.trim()) return;
    setBrands(prev => [...prev, { name: brandName.trim(), descriptor: "Nova identidade visual", color: brandColor, initials: brandName.trim()[0].toUpperCase(), bg: "#F4F1EE" }]);
    setBrandName("");
    setShowBrand(false);
    setNotice("Identidade adicionada à demonstração.");
  }

  function navigate(name: string) {
    setActive(name);
    setMobileNav(false);
    if (name !== "Editor") setEditorProject(null);
  }

  function exportPreview() {
    const text = `${editorText}\n\n${editorSubtext}\n\n${editorProject?.brand ?? "Minha marca"}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(editorProject?.title || "conteudo").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Texto de prévia exportado. A exportação em PNG/ZIP entra na próxima etapa.");
  }

  const navItems = [
    { label: "Início", icon: LayoutDashboard },
    { label: "Projetos", icon: FolderOpen },
    { label: "Identidade visual", icon: Palette },
    { label: "Biblioteca", icon: LibraryBig },
  ];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-symbol"><Sparkles size={19} strokeWidth={2.3} /></div>
          <div><div className="brand-name">studio<span>.</span></div><div className="brand-caption">AI CONTENT STUDIO</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X size={18}/></button>
        </div>
        <button className="workspace-switch">
          <div className="workspace-avatar">K</div>
          <div className="workspace-copy"><strong>Meu estúdio</strong><span>Espaço pessoal</span></div>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.label} className={`nav-item ${active === item.label ? "active" : ""}`} onClick={() => navigate(item.label)}><Icon size={18}/><span>{item.label}</span>{item.label === "Projetos" && <span className="nav-count">{projects.length}</span>}</button>;
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">FERRAMENTAS</div>
        <nav className="nav-list">
          <button className={`nav-item ${active === "Editor" ? "active" : ""}`} onClick={() => { setActive("Editor"); if (!editorProject) setEditorProject(projects[0] || null); }}><SquarePen size={18}/><span>Editor visual</span></button>
          <button className={`nav-item ${active === "Modelos" ? "active" : ""}`} onClick={() => navigate("Modelos")}><Grid2X2 size={18}/><span>Modelos</span><span className="soon-dot" /></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-top"><span>Seu espaço</span><Activity size={15}/></div>
            <strong>Fase 1 · Protótipo</strong>
            <div className="usage-track"><div /></div>
            <p>Sem consumo de IA nesta etapa.</p>
          </div>
          <button className="nav-item" onClick={() => setNotice("Configurações serão conectadas nas próximas fases.")}><Settings2 size={18}/><span>Configurações</span></button>
          <div className="profile-row"><div className="profile-avatar">K</div><div className="profile-info"><strong>Karina</strong><span>Plano pessoal</span></div><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}
      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu size={20}/></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{active === "Início" ? "Visão geral" : active}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar projetos..." /><kbd>⌘ K</kbd></div>
            <button className="icon-button notification-button" aria-label="Notificações" onClick={() => setNotice("Você está em dia. Nenhuma notificação nova.")}><Bell size={18}/><i/></button>
            <div className="top-avatar">K</div>
          </div>
        </header>

        {active === "Editor" && editorProject ? (
          <div className="editor-page">
            <div className="page-heading editor-heading">
              <div><div className="eyebrow">EDITOR VISUAL <span>·</span> RASCUNHO</div><h1>{editorProject.title}</h1><p>Edite o conteúdo e veja uma prévia ao vivo.</p></div>
              <div className="heading-actions"><button className="button-secondary" onClick={() => {setActive("Projetos");setEditorProject(null)}}>Voltar aos projetos</button><button className="button-primary" onClick={exportPreview}><Download size={16}/> Exportar texto</button></div>
            </div>
            <div className="editor-layout">
              <div className="editor-controls">
                <div className="panel-heading"><span>Conteúdo</span><span className="tiny-pill">EDITÁVEL</span></div>
                <label className="field-label">Texto principal</label><textarea className="text-field large-text" value={editorText} onChange={e => setEditorText(e.target.value)} rows={4}/>
                <label className="field-label">Texto de apoio</label><textarea className="text-field" value={editorSubtext} onChange={e => setEditorSubtext(e.target.value)} rows={3}/>
                <label className="field-label">Cor de destaque</label><div className="color-picker-row"><input type="color" value={editorColor} onChange={e => setEditorColor(e.target.value)}/><code>{editorColor.toUpperCase()}</code></div>
                <div className="control-divider"/>
                <div className="panel-heading"><span>Elementos</span><span className="subtle-text">Prévia inicial</span></div>
                <div className="element-row"><Type size={17}/><span>Texto principal</span><Check size={15} className="element-check"/></div>
                <div className="element-row"><Shapes size={17}/><span>Forma decorativa</span><span className="element-muted">Fundo</span></div>
                <div className="element-row"><ImageIcon size={17}/><span>Imagem de fundo</span><span className="element-muted">Demo</span></div>
                <div className="editor-note"><Sparkles size={16}/><p>Esta é a base do editor. Camadas avançadas, arrastar elementos e exportação de imagens entram na Fase 2.</p></div>
              </div>
              <div className="canvas-area">
                <div className="canvas-toolbar"><span><span className="status-dot"/> Salvo nesta sessão</span><div><button className="canvas-tool" title="Desfazer indisponível na Fase 1"><Command size={15}/></button><span>100%</span><button className="canvas-tool" onClick={() => setNotice("Zoom avançado entra na Fase 2.")}><Plus size={15}/></button></div></div>
                <div className="canvas-stage"><div className={`design-canvas ${editorProject.format === "Stories" || editorProject.format === "Capa de Reels" ? "portrait-canvas" : ""}`} style={{backgroundColor: editorColor}}>
                  <div className="canvas-orb orb-one"/><div className="canvas-orb orb-two"/>
                  <div className="canvas-brand">{editorProject.brand}<span>®</span></div>
                  <div className="canvas-content"><div className="canvas-kicker">UMA NOVA PERSPECTIVA</div><h2>{editorText}</h2><p>{editorSubtext}</p><div className="canvas-cta">DESCUBRA MAIS <ArrowRight size={14}/></div></div>
                  <div className="canvas-footer"><span>IDEIAS QUE MOVEM</span><span>01 / {String(editorProject.slides).padStart(2,"0")}</span></div>
                </div></div>
                <div className="canvas-footerbar"><span>{editorProject.format} · {editorProject.format === "Stories" || editorProject.format === "Capa de Reels" ? "1080 × 1920" : "1080 × 1080"}</span><span>Prévia de demonstração</span></div>
              </div>
            </div>
          </div>
        ) : active === "Identidade visual" ? (
          <div className="page-content">
            <div className="page-heading"><div><div className="eyebrow">SISTEMA DE MARCA</div><h1>Identidade visual</h1><p>Organize as marcas e mantenha cada conteúdo consistente.</p></div><button className="button-primary" onClick={() => setShowBrand(true)}><Plus size={17}/> Nova marca</button></div>
            <div className="brand-grid">{brands.map((b, i) => <div className="brand-card" key={`${b.name}-${i}`}><div className="brand-card-top"><div className="brand-mark" style={{background:b.bg,color:b.color}}>{b.initials}</div><button className="icon-button" onClick={() => setNotice(`Marca ${b.name}: edição completa será habilitada na próxima iteração.`)}><MoreHorizontal size={18}/></button></div><h3>{b.name}</h3><p>{b.descriptor}</p><div className="brand-color-row"><span className="swatch" style={{background:b.color}}/><code>{b.color.toUpperCase()}</code><span className="brand-color-label">Cor principal</span></div><button className="brand-open" onClick={() => {setSelectedBrand(b.name);setShowCreate(true)}}>Criar conteúdo com esta marca <ArrowRight size={15}/></button></div>)}
              <button className="brand-add-card" onClick={() => setShowBrand(true)}><div><Plus size={22}/></div><strong>Adicionar identidade</strong><span>Configure cores, logo e tipografia</span></button></div>
          </div>
        ) : active === "Projetos" ? (
          <div className="page-content">
            <div className="page-heading"><div><div className="eyebrow">SEU CONTEÚDO</div><h1>Projetos</h1><p>Todos os seus rascunhos em um só lugar.</p></div><button className="button-primary" onClick={() => setShowCreate(true)}><Plus size={17}/> Novo projeto</button></div>
            <div className="filter-row"><div className="filter-chip active">Todos <span>{filteredProjects.length}</span></div><div className="filter-chip">Carrosséis</div><div className="filter-chip">Posts</div><div className="filter-chip">Stories</div><div className="filter-spacer"/><button className="sort-button">Mais recentes <ChevronDown size={15}/></button></div>
            <div className="projects-grid">{filteredProjects.map(p => <ProjectCard key={p.id} project={p} onOpen={() => {setEditorProject(p);setEditorText(p.title);setEditorSubtext("Transforme conhecimento em conteúdo que conecta.");setEditorColor(brands.find(b=>b.name===p.brand)?.color || "#722B4C");setActive("Editor")}} />)}<button className="new-project-card" onClick={() => setShowCreate(true)}><span><Plus size={23}/></span><strong>Criar novo projeto</strong><small>Comece com uma tela em branco</small></button></div>
          </div>
        ) : active === "Biblioteca" || active === "Modelos" ? (
          <div className="page-content">
            <div className="page-heading"><div><div className="eyebrow">PONTO DE PARTIDA</div><h1>{active === "Biblioteca" ? "Biblioteca" : "Modelos"}</h1><p>Modelos iniciais para acelerar a criação sem começar do zero.</p></div></div>
            <div className="template-grid">{["Editorial minimalista","Destaque de campanha","Dica em 3 passos","Capa de conteúdo"].map((t,i)=><button className="template-card" key={t} onClick={() => {setFormat(i===2?"Carrossel":i===3?"Capa de Reels":"Post");setProjectTitle(t);setTopic("");setShowCreate(true)}}><div className={`template-art art-${i}`}><span>{["IDEIA EM FOCO","NOVA CAMPANHA","3 PASSOS","ASSISTA AGORA"][i]}</span><b>{["Menos ruído.\nMais intenção.","Sua marca,\nmais forte.","Pequenas ações.\nGrandes mudanças.","O que você\nprecisa saber."][i]}</b><i/></div><div className="template-meta"><strong>{t}</strong><span>{["Post quadrado","Post quadrado","Carrossel","Capa vertical"][i]}</span></div></button>)}</div>
          </div>
        ) : (
          <div className="page-content">
            <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> SEU ESTÚDIO CRIATIVO</div><h1>Transforme ideias<br/>em <span>conteúdo memorável.</span></h1><p>Planeje, crie e organize seu conteúdo visual em um só lugar.</p><div className="welcome-actions"><button className="button-primary large-button" onClick={() => setShowCreate(true)}><WandSparkles size={17}/> Criar conteúdo <ArrowRight size={16}/></button><button className="button-secondary large-button" onClick={() => navigate("Identidade visual")}>Configurar marca</button></div></div><div className="hero-art"><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><div className="hero-sheet sheet-back"><div/><div/><div/></div><div className="hero-sheet sheet-front"><span>IDEIAS QUE CONECTAM</span><strong>O próximo<br/>capítulo começa<br/><em>agora.</em></strong><i/><small>SEU CONTEÚDO. SUA VOZ.</small></div><div className="hero-floating floating-spark"><Sparkles size={19}/></div><div className="hero-floating floating-check"><Check size={17}/></div><div className="hero-floating floating-type"><Type size={18}/></div></div></div>
            <div className="section-heading"><div><h2>Comece por aqui</h2><p>Escolha o formato ideal para sua ideia.</p></div><button className="text-button" onClick={() => setShowCreate(true)}>Ver todos os formatos <ArrowRight size={15}/></button></div>
            <div className="format-grid">{formats.map(f=>{const Icon=f.icon;return <button className="format-card" key={f.name} onClick={()=>{setFormat(f.name);setProjectTitle("");setShowCreate(true)}}><div className={`format-icon format-${f.name.toLowerCase().replaceAll(" ","-")}`}><Icon size={20}/></div><div className="format-copy"><strong>{f.name}</strong><span>{f.detail}</span><small>{f.size}</small></div><ArrowDownRight size={17} className="format-arrow"/></button>})}</div>
            <div className="section-heading recent-heading"><div><h2>Projetos recentes</h2><p>Suas últimas ideias, prontas para continuar.</p></div><button className="text-button" onClick={() => navigate("Projetos")}>Ver todos <ArrowRight size={15}/></button></div>
            <div className="projects-grid">{filteredProjects.slice(0,3).map(p=><ProjectCard key={p.id} project={p} onOpen={()=>{setEditorProject(p);setEditorText(p.title);setEditorSubtext("Transforme conhecimento em conteúdo que conecta.");setEditorColor(brands.find(b=>b.name===p.brand)?.color || "#722B4C");setActive("Editor")}} />)}<button className="new-project-card" onClick={() => setShowCreate(true)}><span><Plus size={23}/></span><strong>Nova ideia</strong><small>Comece do zero</small></button></div>
            <div className="phase-banner"><div className="phase-icon"><Sparkles size={18}/></div><div><strong>Seu estúdio está tomando forma.</strong><p>Esta é a primeira etapa: interface, marcas e fluxo de projetos. Salvamento em nuvem, IA e exportação de imagens serão adicionados nas próximas fases.</p></div><span className="phase-status">FASE 1 DE 4</span></div>
          </div>
        )}
        <footer className="app-footer"><span>studio. <i>·</i> AI Content Studio</span><span>Protótipo de desenvolvimento <span className="footer-dot"/> Fase 1</span></footer>
      </section>

      {showCreate && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setShowCreate(false)}}><div className="modal create-modal"><div className="modal-header"><div><div className="eyebrow">NOVO PROJETO</div><h2>Vamos criar algo bom.</h2><p>Defina o ponto de partida. Você poderá ajustar depois.</p></div><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={19}/></button></div><div className="modal-body"><label className="field-label">Formato</label><div className="format-select-grid">{formats.map(f=>{const Icon=f.icon;return <button key={f.name} className={`format-option ${format===f.name?"selected":""}`} onClick={()=>setFormat(f.name)}><Icon size={19}/><strong>{f.name}</strong><small>{f.size}</small>{format===f.name&&<Check size={14} className="option-check"/>}</button>})}</div><label className="field-label">Nome do projeto <span className="optional">· opcional</span></label><input className="text-field" value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} placeholder="Ex.: 5 motivos para começar agora"/><label className="field-label">Sobre o que será o conteúdo?</label><textarea className="text-field" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Descreva a ideia em uma frase..." rows={3}/><div className="form-two-col"><div><label className="field-label">Identidade visual</label><select className="text-field" value={selectedBrand} onChange={e=>setSelectedBrand(e.target.value)}>{brands.map(b=><option key={b.name}>{b.name}</option>)}</select></div>{format==="Carrossel"&&<div><label className="field-label">Quantidade de slides</label><select className="text-field" value={slideCount} onChange={e=>setSlideCount(e.target.value)}>{["4","5","6","7","8","10"].map(n=><option key={n} value={n}>{n} slides</option>)}</select></div>}</div><div className="modal-hint"><Sparkles size={16}/><span>A geração por IA será conectada na Fase 3. Por enquanto, você pode testar o fluxo e o editor sem custo de API.</span></div></div><div className="modal-footer"><button className="button-secondary" onClick={()=>setShowCreate(false)}>Cancelar</button><button className="button-primary" onClick={createProject}>Criar projeto <ArrowRight size={16}/></button></div></div></div>}

      {showBrand && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowBrand(false)}}><div className="modal brand-modal"><div className="modal-header"><div><div className="eyebrow">IDENTIDADE VISUAL</div><h2>Adicionar marca</h2><p>Comece com o nome e uma cor principal.</p></div><button className="icon-button" onClick={()=>setShowBrand(false)} aria-label="Fechar"><X size={19}/></button></div><div className="modal-body"><label className="field-label">Nome da marca</label><input className="text-field" value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Ex.: Minha marca"/><label className="field-label">Cor principal</label><div className="color-picker-row large"><input type="color" value={brandColor} onChange={e=>setBrandColor(e.target.value)}/><code>{brandColor.toUpperCase()}</code><span className="color-preview" style={{background:brandColor}}/></div><div className="modal-hint"><Palette size={16}/><span>Na próxima etapa, você poderá cadastrar logotipo, tipografia e mais cores.</span></div></div><div className="modal-footer"><button className="button-secondary" onClick={()=>setShowBrand(false)}>Cancelar</button><button className="button-primary" onClick={saveBrand}>Adicionar marca <Plus size={16}/></button></div></div></div>}

      {notice && <div className="toast"><Check size={17}/><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Fechar aviso"><X size={15}/></button></div>}
    </main>
  );
}

function ProjectCard({project, onOpen}:{project:Project;onOpen:()=>void}) {
  return <div className="project-card"><button className="project-preview-button" onClick={onOpen} aria-label={`Abrir ${project.title}`}><div className={`project-preview preview-${project.theme}`}><div className="preview-noise"/><div className="preview-label">{project.brand.toUpperCase()}</div><div className="preview-title">{project.title}</div><div className="preview-line"/><div className="preview-page">01 / {String(project.slides).padStart(2,"0")}</div><div className="preview-shape"/></div></button><div className="project-info"><div><strong>{project.title}</strong><span>{project.brand} <i>·</i> {project.format}</span></div><button className="icon-button project-more" onClick={onOpen} aria-label="Abrir projeto"><MoreHorizontal size={18}/></button></div><div className="project-meta"><span><Clock3 size={13}/>{project.updated}</span><button onClick={onOpen}>Editar <ArrowRight size={13}/></button></div></div>;
}
