import { createClient, MatrixClient, IndexedDBStore, IndexedDBCryptoStore } from 'matrix-js-sdk';
import {
  AllDevicesIsolationMode,
  OnlySignedDevicesIsolationMode,
} from 'matrix-js-sdk/lib/crypto-api';

import { cryptoCallbacks } from './secretStorageKeys';
import { clearNavToActivePathStore } from '../app/state/navToActivePath';
import { getSettings } from '../app/state/settings';
import { pushSessionToSW } from '../sw-session';
import { USER_PROFILE_FIELDS } from '../types/matrix/profile';
import { reportClientStorageError, resetClientStorageError } from './storageStatus';

type Session = {
  baseUrl: string;
  accessToken: string;
  userId: string;
  deviceId: string;
};

export const initClient = async (session: Session): Promise<MatrixClient> => {
  resetClientStorageError();
  const indexedDBStore = new IndexedDBStore({
    indexedDB: global.indexedDB,
    localStorage: global.localStorage,
    dbName: 'web-sync-store',
  });

  const legacyCryptoStore = new IndexedDBCryptoStore(global.indexedDB, 'crypto-store');

  indexedDBStore.on('degraded', reportClientStorageError);

  const mx = createClient({
    baseUrl: session.baseUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    store: indexedDBStore,
    cryptoStore: legacyCryptoStore,
    deviceId: session.deviceId,
    timelineSupport: true,
    cryptoCallbacks: cryptoCallbacks as any,
    verificationMethods: ['m.sas.v1'],
  });

  await indexedDBStore.startup();
  await mx.initRustCrypto();

  // Apply the user's device-isolation preference. The crypto store holds this
  // only in memory, so we re-apply it on every client init from localStorage.
  const crypto = mx.getCrypto();
  if (crypto) {
    crypto.setDeviceIsolationMode(
      getSettings().onlySignedDevices
        ? new OnlySignedDevicesIsolationMode()
        : new AllDevicesIsolationMode(false)
    );
  }

  mx.setMaxListeners(50);

  return mx;
};

export const startClient = async (mx: MatrixClient) => {
  // Push the session to the service worker before syncing so that
  // authenticated media requests have the Authorization header from the
  // very first request. This covers the login -> navigate flow where no
  // page reload occurs and the SW may not have the session yet.
  pushSessionToSW(mx.baseUrl, mx.getAccessToken());
  await mx.startClient({
    lazyLoadMembers: true,
    unstableMSC4429SyncUserProfileFields: USER_PROFILE_FIELDS,
  });
};

export const clearCacheAndReload = async (mx: MatrixClient) => {
  mx.stopClient();
  clearNavToActivePathStore(mx.getSafeUserId());
  await mx.store.deleteAllData();
  window.location.reload();
};

export const logoutClient = async (mx: MatrixClient) => {
  pushSessionToSW();
  mx.stopClient();
  try {
    await mx.logout();
  } catch {
    // ignore if failed to logout
  }
  await mx.clearStores();
  window.localStorage.clear();
  window.location.reload();
};

export const clearLoginData = async () => {
  const dbs = await window.indexedDB.databases();

  dbs.forEach((idbInfo) => {
    const { name } = idbInfo;
    if (name) {
      window.indexedDB.deleteDatabase(name);
    }
  });

  window.localStorage.clear();
  window.location.reload();
};
