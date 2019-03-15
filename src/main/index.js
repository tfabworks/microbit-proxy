const { app, shell, BrowserWindow } = require('electron')
import SerialPortWrapper from './SerialPortWrapper'
import { ipcMain } from 'electron';

const isWin = (process.platform === 'win32')
const config = require('../config')

let mainWindow
let serial = new SerialPortWrapper()

ipcMain.on('ready', (ev) => {
  serial.append(ev.sender)
})

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 784,
    center: true,
    // title: config.title,
    autoHideMenuBar: true,
  })

  mainWindow.loadFile('index.html')
  if (process.env.NODE_ENV === 'dev')
                mainWindow.webContents.openDevTools()

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

app.on('ready', createWindow)

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
