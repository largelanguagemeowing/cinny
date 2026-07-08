import { atom } from 'jotai';
import { KlipyGif } from '../utils/klipy';

const STORAGE_KEY = 'gifFavorites';

type StoredFavorite = {
  id: string;
  gif: KlipyGif;
  addedAt: number;
};

const readFavorites = (): StoredFavorite[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && item.gif && typeof item.addedAt === 'number'
    );
  } catch {
    return [];
  }
};

const writeFavorites = (favorites: StoredFavorite[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore quota errors
  }
};

export const gifFavoritesAtom = atom<StoredFavorite[]>(readFavorites());

export const addGifFavoriteAtom = atom<null, [KlipyGif], void>(null, (get, set, gif) => {
  const current = get(gifFavoritesAtom);
  if (current.some((f) => f.id === gif.id)) return;
  const next = [{ id: gif.id, gif, addedAt: Date.now() }, ...current];
  set(gifFavoritesAtom, next);
  writeFavorites(next);
});

export const removeGifFavoriteAtom = atom<null, [string], void>(null, (get, set, gifId) => {
  const current = get(gifFavoritesAtom);
  const next = current.filter((f) => f.id !== gifId);
  set(gifFavoritesAtom, next);
  writeFavorites(next);
});

export const toggleGifFavoriteAtom = atom<null, [KlipyGif], void>(null, (get, set, gif) => {
  const current = get(gifFavoritesAtom);
  const exists = current.some((f) => f.id === gif.id);
  const next = exists
    ? current.filter((f) => f.id !== gif.id)
    : [{ id: gif.id, gif, addedAt: Date.now() }, ...current];
  set(gifFavoritesAtom, next);
  writeFavorites(next);
});

export const isGifFavoritedAtom = atom<null, [string], boolean>(null, (get, _set, gifId) => {
  const favorites = get(gifFavoritesAtom);
  return favorites.some((f) => f.id === gifId);
});
