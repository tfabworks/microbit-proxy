// アプリのコンフィグレーション
// envとの違いはユーザーが明示的に設定できるか否か

import EventEmitter from 'events'
import {getP as get, setP as set, IData} from './util/electron-json-storage-promise'

interface IOptions {
  title?: string;
  uuid?: string;
}

export class Config extends EventEmitter {
  uuid: string;
  title: string;

  constructor(cfg: IOptions) {
    super()
    this.title = cfg.title || ""
    this.uuid = cfg.uuid || ""
  }

  async lateinit() {
    await get('uuid')
    .then(obj => {
      this.uuid = obj.uuid
    })
    this.emit('changed', this)
  }

  modify(key: keyof Config, value: any) {
    return set(key, value)
    .then( () => {
      this[key] = value;
      this.emit('changed', this)
    })
  }
}


export async function getConfig() {
  const config = new Config({})
  await config.lateinit()
  return config
}

function If(obj: any) {
  if (typeof obj === 'object' && Object.keys(obj).length === 0)
    return false
  else
    return (obj) ? true : false
}
