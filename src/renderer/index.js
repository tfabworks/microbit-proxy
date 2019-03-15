import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import {getP,setP} from '../util/electron-json-storage-promise'
import storage from 'electron-json-storage'
import uuidv4 from 'uuid/v4'

import App from './App'

getP('initialized')
.then(data => { // 初期化されてるかチェック
    if (!checkEmptyObject(data)) {
        return Promise.all([
            setP('initialized', true, throwError),
            setP('parameters', {
                id: '1',
                method: 'GET',
                url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
                body: '',
                regex: '\\d+:\\d+:\\d+'
            }),
            setP('uuid', uuidv4())
        ])
    } else {
        return Promise.resolve()
    }
})
.then( _ => { // configをとってくる
    return Promise.all([
        getP('uuid'),
        getP('parameters')
    ])
})
.then( arr => {
    console.log(arr[1])
    const config = {
        uuid: arr[0]
    }
    ReactDOM.render(<App config={config} />, document.getElementById('root'))
})

const throwError = (err) => {throw err}

function checkEmptyObject(obj) {
    if (typeof obj === 'object') {
        return (Object.keys(obj).length)? true : false
    }
    else
        return (obj)? true : false
}