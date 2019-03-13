import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import storage from 'electron-json-storage'

import App from './App'

// 初期化済みか確認して<App>を表示
storage.get('initialized', (error, TF) => {
    if (error) throw error
    if (!TF) {
        storage.set('initialized', true, throwError)
        storage.set('parameters', [{
            id: '1',
            method: 'GET',
            url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
            body: '',
            regex: '\\d+:\\d+:\\d+'
          }], throwError)
    }
    ReactDOM.render(<App />, document.getElementById('root'))
})

const throwError = (err) => {throw err}