import storage from 'electron-json-storage'

export interface IData {
  [key: string]: any;
}

export function getP (key: any, ...options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    storage.get(key, options, (err: Error, data: IData) => {
      if (err) {
        reject({})
      } else {
        resolve(data)
      }
    })
  })
}

export function setP (key: any, json: any, ...options: any): Promise<undefined|Error> {
  return new Promise((resolve, reject) => {
    storage.set(key, json, options, (err: Error) => {
      if (err) {
        reject(err)
      } else {
        resolve(undefined)
      }
    })
  })
}

export function removeP (key: any, ...options: any): Promise<undefined|Error>{
  return new Promise((resolve, reject) => {
    storage.remove(key, options, (err: Error) => {
      if (err) {
        reject(err)
      } else {
        resolve(undefined)
      }
    })
  })
}

export function clearP(...options: any): Promise<undefined|Error> {
  return new Promise((resolve, reject) => {
    storage.clear(options, (err: Error) => {
      if (err) {
        reject(err)
      } else {
        resolve(undefined)
      }
    })
  })
}