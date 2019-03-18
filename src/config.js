import {getP} from './util/electron-json-storage-promise'

export async function getConfig() {
  return await Promise.all([
    getP('uuid'),
    getP('parameters')
  ])
  .then( arr => {
    console.log(arr[1])
    return {
      title: 'Microbit:Connect',
      uuid: arr[0],
      parameters: arr[1]
    }
  })
}

module.exports = getConfig