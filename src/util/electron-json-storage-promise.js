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

export function setP (key, json, ...options) {
  return new Promise((resolve, reject) => {
    storage.set(key, json, options, (err) => {
      if (err) {
        reject()
      } else {
        resolve()
      }
    })
  })
}

export function removeP (key, ...options) {
  return new Promise((resolve, reject) => {
    storage.remove(key, options, (err) => {
      if (err) {
        reject()
      } else {
        resolve()
      }
    })
  })
}

export function clearP(...options) {
  return new Promise((resolve, reject) => {
    storage.clear(options, (err) => {
      if (err) {
        reject()
      } else {
        resolve()
      }
    })
  })
}