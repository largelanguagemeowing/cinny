const { app, BrowserWindow, shell, Menu, session, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const { registerAppScheme, registerAppHandler, APP_ORIGIN } = require('./app-protocol.cjs');
const { buildAppMenu } = require('./menu.cjs');
const { createRichPresenceServer } = require('./rich-presence.cjs');

// dist sits next to electron/ in both dev and the packaged asar
const DIST_DIR = path.join(__dirname, '..', 'dist');

let mainWindow = null;

// MSC4320 rich-presence publisher: impersonates Discord's local RPC pipe and
// forwards captured activity to the renderer to publish as the user's profile
// field. Created lazily on first request from the renderer (off by default).
let rpServer = null;
const ensureRichPresenceServer = () => {
  if (!rpServer) {
    rpServer = createRichPresenceServer({
      onActivity: (activity) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('rich-presence:activity', activity);
        }
      },
    });
  }
  return rpServer;
};

ipcMain.handle('rich-presence:start', async () => {
  try {
    return await ensureRichPresenceServer().start();
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
});
ipcMain.handle('rich-presence:stop', async () => {
  try {
    await rpServer?.stop();
  } catch {
    // ignore
  }
});

function isInternalUrl(url) {
  return url.startsWith(APP_ORIGIN);
}

// privileged scheme must be registered before the app is ready
registerAppScheme();

// getDisplayMedia() (screen share in calls) needs an explicit handler in
// Electron; on Wayland desktopCapturer routes through the xdg-desktop-portal
// picker, on X11 it grabs the primary screen.
function enableScreenShare() {
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen', 'window'] })
        .then((sources) => callback(sources.length ? { video: sources[0] } : undefined))
        .catch(() => callback());
    },
    { useSystemPicker: true }
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 400,
    backgroundColor: '#15171e',
    autoHideMenuBar: true,
    title: 'Cinny',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Electron has no default browser context menu. Copy the rendered image so
  // authenticated media and decrypted blob URLs work without fetching again.
  const imageWindow = mainWindow;
  imageWindow.webContents.on('context-menu', (_event, params) => {
    if (params.mediaType !== 'image') return;
    Menu.buildFromTemplate([
      {
        label: 'Copy image',
        enabled: params.hasImageContents,
        click: () => {
          if (!imageWindow.isDestroyed()) {
            imageWindow.webContents.copyImageAt(params.x, params.y);
          }
        },
      },
    ]).popup({ window: imageWindow });
  });

  // open target=_blank / window.open externally, never as a child window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url) && !isInternalUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // keep in-app navigation on our origin; send outbound links to the browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`${APP_ORIGIN}/`);
}

// single instance; focus existing window on second launch
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(buildAppMenu());
    registerAppHandler(DIST_DIR);
    enableScreenShare();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    rpServer?.stop();
  });
}
