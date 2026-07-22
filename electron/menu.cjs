// Standard application menu. Kept hidden via the window's autoHideMenuBar, but
// its accelerators still fire (Ctrl+Shift+I / F12 devtools, reload, zoom, etc.).

const { Menu } = require('electron');

const isMac = process.platform === 'darwin';

function buildAppMenu() {
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }, // Ctrl+Shift+I (Cmd+Opt+I on mac)
        {
          label: 'Toggle Developer Tools (F12)',
          accelerator: 'F12',
          click: (_item, win) => win && win.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = { buildAppMenu };
