"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { defaultData } from "./data";
import { browserStore } from "./storage";
import { forgetImage } from "./images";
import type { Brand, LibraryImage, Project, Settings, StudioData } from "./types";

export type SaveState = "carregando" | "salvo" | "salvando" | "erro";

export function useStudio() {
  const [data, setData] = useState<StudioData>(defaultData);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("carregando");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    browserStore.load().then(saved => {
      if (saved) setData(saved);
      setReady(true);
      setSaveState("salvo");
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    setSaveState("salvando");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      browserStore.save(data).then(() => setSaveState("salvo")).catch(() => setSaveState("erro"));
    }, 400);
  }, [data, ready]);

  const upsertProject = useCallback((project: Project) => {
    setData(d => {
      const exists = d.projects.some(p => p.id === project.id);
      const next = { ...project, updatedAt: Date.now() };
      return { ...d, projects: exists ? d.projects.map(p => p.id === project.id ? next : p) : [next, ...d.projects] };
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));
  }, []);

  const upsertBrand = useCallback((brand: Brand) => {
    setData(d => {
      const exists = d.brands.some(b => b.id === brand.id);
      return { ...d, brands: exists ? d.brands.map(b => b.id === brand.id ? brand : b) : [...d.brands, brand] };
    });
  }, []);

  const deleteBrand = useCallback((id: string) => {
    setData(d => {
      const fallback = d.brands.find(b => b.id !== id);
      if (!fallback) return d;
      return {
        ...d,
        brands: d.brands.filter(b => b.id !== id),
        projects: d.projects.map(p => p.brandId === id ? { ...p, brandId: fallback.id } : p),
      };
    });
  }, []);

  const addImage = useCallback(async (image: LibraryImage, blob: Blob) => {
    await browserStore.putImage(image.id, blob);
    setData(d => ({ ...d, library: [image, ...d.library] }));
  }, []);

  const deleteImage = useCallback(async (id: string) => {
    await browserStore.deleteImage(id);
    forgetImage(id);
    setData(d => ({
      ...d,
      library: d.library.filter(i => i.id !== id),
      brands: d.brands.map(b => b.logo === id ? { ...b, logo: null } : b),
      projects: d.projects.map(p => p.slides.some(s => s.imageId === id)
        ? { ...p, slides: p.slides.map(s => s.imageId === id ? { ...s, imageId: null } : s) }
        : p),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(async () => {
    await browserStore.clear();
    first.current = true;
    setData(defaultData());
    setSaveState("salvo");
  }, []);

  const exportBackup = useCallback(() => JSON.stringify(data, null, 2), [data]);

  return { data, ready, saveState, upsertProject, deleteProject, upsertBrand, deleteBrand, addImage, deleteImage, updateSettings, resetAll, exportBackup };
}

export type Studio = ReturnType<typeof useStudio>;
