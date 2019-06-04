import React from 'react'
import ReactDOM from 'react-dom'
import { getP as get, setP as set } from '../util/electron-json-storage-promise'
import uuidv4 from 'uuid/v4'
import { ipcRenderer } from 'electron';

import App from './App'
import {getConfig, Config} from '../config'

ipcRenderer.on('config:changed', (ev: any, config: any) => {
  AppRender(config)
})

get('initialized')
.then( (data) => {
  if (!checkEmptyObject(data)) {
    return Promise.all([
      set('initialized', true, throwError),
      set('uuid', uuidv4())
    ])
  } else {
    return Promise.all([Promise.resolve(undefined), Promise.resolve(undefined) ])
  }
})
.then( getConfig )
.then( (config: Config) => {
  console.log(config)
  AppRender(config)
})

function AppRender(config: Config) {
  ReactDOM.render(<App config={config} />, document.getElementById('root'))
}

const throwError = (err: Error) => { throw err }

function checkEmptyObject (obj: any) {
  if (typeof obj === 'object') {
    return !!(Object.keys(obj).length)
  } else { return !!(obj) }
}
