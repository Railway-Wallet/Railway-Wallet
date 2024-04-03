const {
  app,
  BrowserWindow,
  screen: electronScreen,
  shell,
  Menu,
} = require('electron');

const isDev = require('electron-is-dev');
const path = require('path');
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

function UpsertKeyValue(obj, keyToChange, value) {
  const keyToChangeLower = keyToChange.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      obj[key] = value;
      return;
    }
  }
  obj[keyToChange] = value;
}

function createWindow() {
  // Create the browser window.
  let win = new BrowserWindow({
    width: electronScreen.getPrimaryDisplay().workArea.width,
    height: electronScreen.getPrimaryDisplay().workArea.height,
    minWidth: 600,
    minHeight: 500,
    show: false,
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    title: 'Railway: Private DeFi Wallet',
  });

  win.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
    const { requestHeaders } = details;
    UpsertKeyValue(requestHeaders, 'Origin', '*');
    UpsertKeyValue(requestHeaders, 'Sec-Fetch-Mode', 'no-cors');
    UpsertKeyValue(requestHeaders, 'Sec-Fetch-Site', 'none');
    UpsertKeyValue(requestHeaders, 'Sec-Fetch-Dest', 'document');
    cb({ requestHeaders });
  });

  win.webContents.session.webRequest.onHeadersReceived((details, cb) => {
    const { responseHeaders } = details;
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
    cb({ responseHeaders });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.setBackgroundColor('#0a0b0c');

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;
  win.loadURL(startURL);

  win.once('ready-to-show', () => win?.show());

  win.on('closed', () => {
    win = null;
  });

  // Open the DevTools.
  // win.webContents.openDevTools();
  // const log = require('electron-log/main');
  // log.initialize();

  win.on('focus', () => {
    win.webContents.send('focused');
  });
}

// Menu
const menuDefaultOptions = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
            },
          ]
        : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
          ]
        : [{ role: 'close' }]),
    ],
  },
];

const menuNewOptions = [
  {
    role: 'help',
    submenu: [
      {
        label: 'Open Local Storage Folder',
        click: () => {
          const userData = app.getPath('userData');

          if (isWin) {
            shell.openPath(`${userData}`);
          } else {
            shell.showItemInFolder(`${userData}`);
          }
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate([...menuDefaultOptions, ...menuNewOptions]);
Menu.setApplicationMenu(menu);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
