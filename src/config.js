// アプリのコンフィグレーション
// envとの違いはユーザーが明示的に設定できるか否か

import EventEmitter from 'events'
import {getP, setP} from './util/electron-json-storage-promise'

export class Config extends EventEmitter {
  constructor(cfg) {
    super()
    this.title = ""
    this.uuid = null
  
    if (If(cfg)) {
      this.title = cfg.title
      this.uuid = cfg.uuid
    }
  }

  async lateinit() {
    await getP('uuid')
    .then(uuid => {
      this.uuid = uuid
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