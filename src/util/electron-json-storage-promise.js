import storage from 'electron-json-storage'

export function getP (key, ...options) {
  return new Promise((resolve, reject) => {
    storage.get(key, options, (err, data) => {
      if (err) {
        reject()
      } else {
        resolve(data)
      }
    })
  })
}

export function setP (key, ...options) {
  return new Promise((resolve, reject) => {
    storage.set(key, options, (err) => {
      if (err) {
        reject()
      } else {
        resolve()
      }
    })
  })
}
