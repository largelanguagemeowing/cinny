// Fork-only: distinguishes the Electron desktop build from the web build.
// The desktop preload exposes `window.cinnyDesktop` (see electron/preload.cjs).

declare global {
  interface Window {
    cinnyDesktop?: {
      platform: string;
      versions: { electron: string; chrome: string; node: string };
    };
  }
}

export const isDesktop = (): boolean => typeof window.cinnyDesktop !== 'undefined';

// Matrix device display name shown in the account's sessions list
export const getDeviceDisplayName = (): string => (isDesktop() ? 'Cinny Desktop' : 'Cinny Web');
