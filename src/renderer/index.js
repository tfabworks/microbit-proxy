import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { getP, setP, clearP } from '../util/electron-json-storage-promise'
import uuidv4 from 'uuid/v4'
import { ipcRenderer } from 'electron';

import App from './App'
import {getConfig} from '../config'

ipcRenderer.on('config:changed', (ev, config) => {
  AppRender(config)
})

getP('initialized')
.then(data => { // 初期化されてるかチェック
  if (!checkEmptyObject(data)) {
    return Promise.all([
      setP('initialized', true, throwError),
      setP('parameters', [{
        id: '1',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }]),
      setP('uuid', uuidv4())
    ])
  } else {
    return Promise.resolve()
  }
})
.then( getConfig )
.then( config => {
  console.log(config)
  AppRender(config)
})

function AppRender(config) {
  ReactDOM.render(<App config={config} />, document.getElementById('root'))
}

const throwError = (err) => { throw err }

function checkEmptyObject (obj) {
  if (typeof obj === 'object') {
    return !!(Object.keys(obj).length)
  } else { return !!(obj) }
}
