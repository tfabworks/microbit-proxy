// System の環境変数
// configとの違いはユーザーが明示的に設定できるか否か

import {app} from 'electron'

module.exports = {
  "title": "Micro:bit-Connect",
  "isWin": (process.platform === 'win32'),
  "stage": process.env.NODE_ENV,
  "locale": app.getLocale()
}