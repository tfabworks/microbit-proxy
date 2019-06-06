import SerialPortWrapper from './SerialPortWrapper'
import { ipcMain, app, shell, BrowserWindow, Menu, Tray, MenuItem, Event } from 'electron'
import { autoUpdater } from "electron-updater"
import path from 'path'
import env from '../env'

import {Config} from '../config'

let mainWindow: BrowserWindow|null;
let tray = null
let config = new Config({})
let serial = new SerialPortWrapper(config)

function setIpcHandler() {
  ipcMain.on('ready', async (ev: Event) => {
    serial.subscribe(ev.sender)
    if (serial.port)
      ev.sender.send('serial:connected', serial.port)
    await autoUpdater.checkForUpdatesAndNotify()
  })

  autoUpdater.on('error', (_, err) => {
    mainWindow && mainWindow.webContents.send('notify', `😱 Error: ${err}`)
  })

  autoUpdater.once('checking-for-update', () => {
    mainWindow && mainWindow.webContents.send('notify', '🔎 Checking for updates')
  })

  autoUpdater.once('update-available', () => {
    mainWindow && mainWindow.webContents.send('notify', '🎉 Update available. Downloading ⌛️')
  })

  autoUpdater.once('update-not-available', () => {
    mainWindow && mainWindow.webContents.send('notify', '👎 Update not available')
  })

  autoUpdater.once('update-downloaded', () => {
    const msg = '🤘 Update downloaded'
    mainWindow && mainWindow.webContents.send('notify', msg)
  })

}

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 784,
    center: true,
    resizable: false,
    title: env.title,
    autoHideMenuBar: true
  })

  mainWindow.loadFile('index.html')
  if (env.stage === 'development') { mainWindow.webContents.openDevTools() }

  // a tag でリンクを開く時、デフォルトのブラウザで表示する
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault()
    shell.openExternal(url)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
    serial.unsubscribe()
  })

  if (env.isWin) {
    mainWindow.on('app-command', (e, cmd) => {
      if (cmd === 'browser-backward' && mainWindow && mainWindow.webContents.canGoBack()) {
        mainWindow && mainWindow.webContents.goBack()
      }
    })
  }
}

function createApp() {
  app.on('ready', () => {
    const iconPath = (env.isWin)? '../build/icons/microbit-proxy.ico' : '../build/icons/microbit-proxy.png'
    tray = new Tray(path.join(__dirname, iconPath))
    const contextMenu = new Menu()
    contextMenu.append(new MenuItem({label: 'Windowを開く', click() {
      windowOpen()
    }}))
    contextMenu.append(new MenuItem({label: '終了', click() {
      app.quit()
    }}))
    tray.on('double-click', () => {
      windowOpen()
    })
    tray.setToolTip(env.title)
    tray.setContextMenu(contextMenu)
  })

  app.on('window-all-closed', function () {
    // When all window closed, system tray still lives on. Therefore nothing to do.
  })

  app.on('activate', function (ev) {
    ev.preventDefault()
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createMainWindow()
    }
  })
}

function windowOpen() {
  if (!mainWindow)
    createMainWindow()
  else
    mainWindow.show()
}

// main
(async function() {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }
  // appのイベントハンドラーを先に登録しないとEvent: readyを捕捉できない
  setIpcHandler()
  createApp()
  await config.lateinit()
    createMainWindow()
}());
