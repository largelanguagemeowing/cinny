import { atom } from 'jotai';
import { EncryptedAttachmentInfo } from 'browser-encrypt-attachment';
import { MatrixEvent, MsgType } from 'matrix-js-sdk';
import { KlipyGif } from '../utils/klipy';
import { IImageInfo } from '../../types/matrix/common';
import { parseOoyeGif } from '../utils/ooye';

const STORAGE_KEY = 'gifFavorites';

// A favourite GIF can come from the Klipy picker, from any GIF image/sticker
// event in a timeline (mxc), or from an OOYE-bridged GIF message (external
// mp4 url).
export type FavoriteGif =
  | { kind: 'klipy'; gif: KlipyGif }
  | {
      kind: 'mxc';
      mxc: string;
      body: string;
      info?: IImageInfo;
      encInfo?: EncryptedAttachmentInfo;
    }
  | { kind: 'url'; title: string; videoUrl: string; pageUrl?: string };

export const getFavoriteGifId = (fav: FavoriteGif): string => {
  if (fav.kind === 'klipy') return fav.gif.id;
  if (fav.kind === 'mxc') return fav.mxc;
  return fav.videoUrl;
};

type StoredFavorite = {
  id: string;
  fav: FavoriteGif;
  addedAt: number;
};

const parseStoredFavorite = (item: any): StoredFavorite | undefined => {
  if (!item || typeof item.id !== 'string' || typeof item.addedAt !== 'number') return undefined;
  const { fav } = item;
  if (fav && (fav.kind === 'klipy' || fav.kind === 'mxc' || fav.kind === 'url')) {
    return { id: item.id, fav, addedAt: item.addedAt };
  }
  // Legacy format: { id, gif: KlipyGif, addedAt }
  if (item.gif) {
    return { id: item.id, fav: { kind: 'klipy', gif: item.gif }, addedAt: item.addedAt };
  }
  return undefined;
};

const readFavorites = (): StoredFavorite[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseStoredFavorite)
      .filter((item): item is StoredFavorite => item !== undefined);
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

export const toggleGifFavoriteAtom = atom<null, [FavoriteGif], void>(null, (get, set, fav) => {
  const id = getFavoriteGifId(fav);
  const current = get(gifFavoritesAtom);
  const exists = current.some((f) => f.id === id);
  const next = exists
    ? current.filter((f) => f.id !== id)
    : [{ id, fav, addedAt: Date.now() }, ...current];
  set(gifFavoritesAtom, next);
  writeFavorites(next);
});

// Extract a favouritable GIF from a timeline event: GIF image messages, GIF
// stickers and OOYE-bridged GIF text/notice messages.
export const getEventFavoriteGif = (mEvent: MatrixEvent): FavoriteGif | undefined => {
  const content = mEvent.getContent();
  const msgType = content.msgtype;

  if (mEvent.getType() === 'm.sticker' || msgType === MsgType.Image) {
    const info = content.info as IImageInfo | undefined;
    const mxc = content.file?.url ?? content.url;
    if (typeof mxc !== 'string') return undefined;
    let filename = 'gif';
    if (typeof content.filename === 'string' && content.filename) filename = content.filename;
    else if (typeof content.body === 'string' && content.body) filename = content.body;
    const isGif = info?.mimetype === 'image/gif' || /\.gif$/i.test(filename);
    if (!isGif) return undefined;
    return {
      kind: 'mxc',
      mxc,
      body: filename,
      info,
      encInfo: content.file,
    };
  }

  if (msgType === MsgType.Text || msgType === MsgType.Notice) {
    const ooye = parseOoyeGif(content);
    if (ooye) {
      return { kind: 'url', title: ooye.title, videoUrl: ooye.videoUrl, pageUrl: ooye.pageUrl };
    }
  }

  return undefined;
};
