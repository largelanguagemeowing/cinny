// Runs with context isolation; keep the surface minimal.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cinnyDesktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
