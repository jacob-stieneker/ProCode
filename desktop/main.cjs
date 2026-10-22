const { app, BrowserWindow, dialog, Menu, protocol, session, shell } = require('electron');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { serveAsset } = require('./assets.cjs');
const { appId } = require('./config.cjs');
const { desktopMenu } = require('./menu.cjs');

app.setName('ProCode');
if (process.platform === 'win32') app.setAppUserModelId(appId);
// Chromium also throttles cross-origin grading frames outside the viewport.
// Keep their short scenario timers accurate; runner deadlines remain enforced.
app.commandLine.appendSwitch('disable-background-timer-throttling');
const profile = app.commandLine.getSwitchValue('user-data-dir');
const userData = profile ? path.resolve(profile) : path.join(app.getPath('appData'), 'ProCode');
mkdirSync(userData, { recursive: true });
app.setPath('userData', userData);
app.enableSandbox();
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'procode',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

let mainWindow;
function openReference(url) {
  try {
    const link = new URL(url);
    if (link.protocol === 'https:' && !link.username && !link.password)
      void shell.openExternal(link.href);
  } catch {
    // Ignore malformed or unsupported external links.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'ProCode',
    width: 1440,
    height: 1000,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: '#101827',
    show: false,
    ...(process.platform === 'win32' ? { icon: path.join(__dirname, 'ProCode.ico') } : {}),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      webviewTag: false,
      // Keep grading and timeout timers consistent when another app has focus.
      backgroundThrottling: false,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openReference(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const destination = new URL(url);
    if (destination.protocol !== 'procode:' || destination.host !== 'app') {
      event.preventDefault();
      openReference(url);
    }
  });
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());
  void mainWindow.loadURL('procode://app/').catch((error) => {
    dialog.showErrorBox('ProCode could not open', error.message);
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) createWindow();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app
    .whenReady()
    .then(() => {
      protocol.handle('procode', (request) => serveAsset(path.join(__dirname, 'web'), request));
      session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
        callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      session.defaultSession.webRequest.onBeforeRequest(
        { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'file://*/*', 'ftp://*/*'] },
        (_details, callback) => callback({ cancel: true }),
      );
      Menu.setApplicationMenu(Menu.buildFromTemplate(desktopMenu(process.platform)));
      app.setAboutPanelOptions({
        applicationName: 'ProCode',
        applicationVersion: app.getVersion(),
        credits: 'Local coding practice',
      });
      createWindow();
      app.on('activate', () => {
        if (!mainWindow) createWindow();
      });
    })
    .catch((error) => {
      dialog.showErrorBox('ProCode could not start', error.message);
      app.quit();
    });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
