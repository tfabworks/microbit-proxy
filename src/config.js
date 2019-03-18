import EventEmitter from 'events'
import {getP, setP} from './util/electron-json-storage-promise'

export class Config extends EventEmitter {
  constructor(cfg) {
    super()
    this.title
    this.uuid
    this.parameters
  
    if (cfg) {
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
      this.title = 'Microbit:Connect'
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
  return await Promise.all([
    getP('uuid'),
    getP('parameters')
  ])
  .then( arr => {
    return new Config({
      title: 'Microbit:Connect',
      uuid: arr[0],
      parameters: arr[1]
    })
  })
}