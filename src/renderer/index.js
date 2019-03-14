import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import storage from 'electron-json-storage'
import uuidv4 from 'uuid/v4'

import App from './App'

// 初期化済みか確認して<App>を表示
storage.get('initialized', (error, TF) => {
    if (error) throw error
    if (!TF) { //初回時の処理
        storage.set('initialized', true, throwError)
        storage.set('parameters', [{
            id: '1',
            method: 'GET',
            url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
            body: '',
            regex: '\\d+:\\d+:\\d+'
          }], throwError)
        const uuid = uuidv4()
        storage.set('uuid', uuid, throwError)
    }
    ReactDOM.render(<App />, document.getElementById('root'))
})

const throwError = (err) => {throw err}