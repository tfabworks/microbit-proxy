import SerialPortWrapper from './SerialPortWrapper'
import { ipcMain } from 'electron'
const { app, shell, BrowserWindow } = require('electron')

const isWin = (process.platform === 'win32')
const {Config} = require('../config')

let mainWindow
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

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 784,
    center: true,
    resizable: false,
    // title: config.title,
    autoHideMenuBar: true
  })

  mainWindow.loadFile('index.html')
  if (process.env.NODE_ENV === 'dev') { mainWindow.webContents.openDevTools() }

  // a tag でリンクを開く時、デフォルトのブラウザで表示する
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault()
    shell.openExternal(url)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  if (isWin) {
    mainWindow.on('app-command', (e, cmd) => {
      if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack()
      }
    })
  }
}

function createApp() {
  
  app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// main
(async function() {
  // appのイベントハンドラーを先に登録しないとEvent: readyを捕捉できない
  setIpcHandler()
  createApp()
  
  await config.lateinit()
  createWindow()
}());
