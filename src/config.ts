// アプリのコンフィグレーション
// envとの違いはユーザーが明示的に設定できるか否か

import storage from 'electron-json-storage'
import {getP as get, setP as set, IData} from './util/electron-json-storage-promise'

interface IOptions {
  uuid?: string;
}

export class Config {
  uuid: string;
  dataPath: string;

  constructor(cfg: IOptions) {
    this.uuid = cfg.uuid || ""
    this.dataPath = storage.getDefaultDataPath()
  }

  async lateinit() {
    await get('uuid')
    .then(uuid => {
      this.uuid = uuid
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