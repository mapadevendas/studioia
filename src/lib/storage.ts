import type { StudioData } from "./types";

/**
 * Onde o estúdio guarda os dados. Hoje é o navegador (localStorage para os
 * dados, IndexedDB para as imagens). Para ir para a nuvem (ex.: Cloudflare
 * D1 + R2), basta outra implementação desta mesma interface.
 */
export interface StudioStore {
  load(): Promise<StudioData | null>;
  save(data: StudioData): Promise<void>;
  putImage(id: string, blob: Blob): Promise<void>;
  getImage(id: string): Promise<Blob | null>;
  deleteImage(id: string): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "cardume-studio:v1";
const DB = "cardume-studio";
const STORE = "images";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    t.oncomplete = () => { resolve(req.result); db.close(); };
    t.onerror = () => { reject(t.error); db.close(); };
  });
}

export const browserStore: StudioStore = {
  async load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StudioData;
      return parsed?.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(data) {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  },
  async putImage(id, blob) {
    await tx("readwrite", s => s.put(blob, id));
  },
  async getImage(id) {
    try {
      return (await tx<Blob | undefined>("readonly", s => s.get(id) as IDBRequest<Blob | undefined>)) ?? null;
    } catch {
      return null;
    }
  },
  async deleteImage(id) {
    await tx("readwrite", s => s.delete(id));
  },
  async clear() {
    window.localStorage.removeItem(KEY);
    await tx("readwrite", s => s.clear());
  },
};
