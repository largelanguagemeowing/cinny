export type PersistedMediaVolume = {
  volume: number;
  mute: boolean;
};

const STORAGE_KEY = 'mediaVolume';

export const DEFAULT_MEDIA_VOLUME: PersistedMediaVolume = {
  volume: 1,
  mute: false,
};

// The value the browser applies to <audio>/<video> volume.
const clampVolume = (volume: number): number => Math.max(0, Math.min(volume, 1));

export const getPersistedMediaVolume = (): PersistedMediaVolume => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_MEDIA_VOLUME;
    const parsed = JSON.parse(raw) as Partial<PersistedMediaVolume>;
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_MEDIA_VOLUME;
    const volume = typeof parsed.volume === 'number' ? clampVolume(parsed.volume) : 1;
    return { volume, mute: Boolean(parsed.mute) };
  } catch {
    return DEFAULT_MEDIA_VOLUME;
  }
};

// Merges into the persisted value so callers only touch the fields they own
// (e.g. video updates volume without clobbering a muted state set by audio).
export const updatePersistedMediaVolume = (patch: Partial<PersistedMediaVolume>): void => {
  try {
    const next = { ...getPersistedMediaVolume(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
};
