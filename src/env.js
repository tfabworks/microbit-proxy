// System の環境変数
// configとの違いはユーザーが明示的に設定できるか否か

import {app} from 'electron'

module.exports = {
  "title": "Micro:bit-Connect",
  "isWin": (process.platform === 'win32'),
  "stage": process.env.NODE_ENV,
  "locale": supportLocale(app.getLocale())
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