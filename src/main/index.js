import SerialPortWrapper from './SerialPortWrapper'
import { ipcMain, app, shell, BrowserWindow, Menu, Tray, MenuItem } from 'electron'
import path from 'path'
import env from '../env'

const {Config} = require('../config')

let mainWindow
let tray = null
let config = new Config()
let serial = new SerialPortWrapper(config)

config.on('changed', (cfg) => {
  serial.configChanged(cfg)
})

function setIpcHandler() {
  ipcMain.on('ready', (ev) => {
    serial.subscribe(ev.sender)
  })

  ipcMain.on('config:add', async (ev, key, value) => {
    config.once('changed', (cfg) => {
      ev.sender.send('config:changed', cfg)
    })
    config.modify(key, value)
  })

  ipcMain.on('config:remove', async (ev, key, value) => {
    config.once('changed', (cnf) =>{
      ev.sender.send('config:changed', cnf)
    })
    const newConf = config.parameters.filter(v => { return v.id !== value })
    config.modify(key, newConf)
  })
}

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 784,
    center: true,
    resizable: false,
    // title: config.title,
    autoHideMenuBar: true
  })

  mainWindow.loadFile('index.html')
  if (env.stage === 'dev') { mainWindow.webContents.openDevTools() }

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
      if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack()
      }
    })
  }
}

function createApp() {
  app.on('ready', () => {
    tray = new Tray(path.join(__dirname, '../../build/icons/microbit-proxy.ico'))
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
