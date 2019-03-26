// System の環境変数
// configとの違いはユーザーが明示的に設定できるか否か

import {app, remote} from 'electron'
const package_json = require('../package.json')

const locale = (app)? app.getLocale() : remote.app.getLocale()

module.exports = {
  "title": "Micro:bit-Connect",
  "version": package_json.version,
  "isWin": (process.platform === 'win32'),
  "stage": process.env.NODE_ENV,
  "locale": supportLocale(locale)
}

function supportLocale(localeStr) {
  let locale
  switch(localeStr) {
    case 'ja':
      locale = localeStr
      break;
    case 'en':
    case 'en-AU':
    case 'en-CA':
    case 'en-GB':
    case 'en-NZ':
    case 'en-US':
    case 'en-ZA':
      locale = 'en'
      break;
    default:
      locale = 'en'
  }
  return locale
}