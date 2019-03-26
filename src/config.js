// アプリのコンフィグレーション
// envとの違いはユーザーが明示的に設定できるか否か

import EventEmitter from 'events'
import {getP, setP} from './util/electron-json-storage-promise'

export class Config extends EventEmitter {
  constructor(cfg) {
    super()
    this.uuid = null
    this.parameters = []
  
    if (If(cfg)) {
      this.title = cfg.title
      this.uuid = cfg.uuid
      this.parameters = cfg.parameters
    }
  }

  async lateinit() {
    await Promise.all([
      getP('uuid'),
      getP('parameters')
    ])
    .then(arr => {
      this.uuid = arr[0]
      this.parameters = arr[1]
    })
    this.emit('changed', this)
  }

  modify(key, value) {
    return setP(key, value)
    .then( () => {
      this[key] = value;
      this.emit('changed', this)
    })
  }
}


export async function getConfig() {
  const config = new Config()
  await config.lateinit()
  return config
}

function If(obj) {
  if (typeof obj === 'object' && Object.keys(obj).length === 0)
    return false
  else
    return (obj) ? true : false
}