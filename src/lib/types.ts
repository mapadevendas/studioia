export type FormatName = "Carrossel" | "Post" | "Stories" | "Capa de Reels";
export type Ratio = "1:1" | "4:5" | "9:16";
export type SlideLayout = "capa" | "conteudo" | "lista" | "citacao" | "numero" | "final";
export type SlideBackground = "marca" | "escuro" | "claro" | "gradiente" | "imagem";
export type FontKey = "outfit" | "manrope" | "space" | "fraunces" | "playfair";

export type Slide = {
  id: string;
  layout: SlideLayout;
  background: SlideBackground;
  align: "left" | "center";
  kicker: string;
  title: string;
  body: string;
  cta: string;
  imageId: string | null;
};

export type Project = {
  id: string;
  title: string;
  format: FormatName;
  ratio: Ratio;
  brandId: string;
  slides: Slide[];
  caption: string;
  showNumbers: boolean;
  showHandle: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Brand = {
  id: string;
  name: string;
  descriptor: string;
  handle: string;
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  font: FontKey;
  logo: string | null;
  createdAt: number;
};

export type LibraryImage = {
  id: string;
  name: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
};

export type Settings = {
  userName: string;
  studioName: string;
  defaultRatio: "1:1" | "4:5";
  showNumbers: boolean;
  showHandle: boolean;
};

export type StudioData = {
  version: 1;
  projects: Project[];
  brands: Brand[];
  library: LibraryImage[];
  settings: Settings;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  format: FormatName;
  ratio: Ratio;
  slides: Omit<Slide, "id">[];
};
