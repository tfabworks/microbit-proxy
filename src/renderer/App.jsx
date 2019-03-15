import React from 'react'
import fetch from 'isomorphic-fetch'
import storage from 'electron-json-storage'
import {ipcRenderer} from 'electron'

import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
class LogTerminal extends Terminal {
  constructor() {
    super()
  }
  logging (str) {
    const d = new Date()
    const dateStr = d.toLocaleDateString('ja-JP')
    const timeStr = d.toLocaleTimeString('ja-JP')
    this.writeln(`${dateStr} ${timeStr} ${str}`)
  }
}
LogTerminal.applyAddon(fit)

import Parameter from './component/Parameter'
import StateNavi from './component/StateNavi'
import {FooterLogo, PortSelector} from './component/etc'
import Term from './component/Terminal'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    this.term = new LogTerminal()
    this.state = {
      port: null,
      ports: [],
      successCnt: 0,
      errorCnt: 0,
      parameters: []
    }
    storage.get('parameters', (error, data) => {
      if (error) throw error
      if (data) {
        this.setState({
          parameters: data
        })
      }
    })
    ipcRenderer.on('serial:ports', (_, ports) => {
      this.setState({ports: ports})
    })
    ipcRenderer.on('serial:connected', (_, port) => {
      this.term.clear()
      this.setState({port: port})
      this.term.logging('Connected')
    })
    ipcRenderer.on('serial:receive', (_, txt) => {
      this.handler(txt)
    })
    ipcRenderer.on('serial:close', () => {
      this.term.clear()
      this.setState({port: null})
      this.term.write('Disconnected.')
    })
    ipcRenderer.send('ready')
    this.updateParameters = this.updateParameters.bind(this)
  }

  render () {
    return (
      <div className='container'>
        <StateNavi port={this.state.port} successCnt={this.state.successCnt} errorCnt={this.state.errorCnt}/>
        <Parameter parameters={this.state.parameters} updateParameters={this.updateParameters} />
        <Term term={this.term} />
        <PortSelector port={this.state.port} ports={this.state.ports}/>
        <FooterLogo />
      </div>
    )
  }

  updateParameters(params) {
    storage.set('parameters', params)
    this.setState({parameters: params})
  }

  async handler (str) {
    console.log(str)
    let received
    try {
      received = JSON.parse(str)
    } catch (e) {
      console.warn(e.message)
      this._error('json string is broken.')
      return
    }
    this.term.logging(`SerialNo:${received.s.toString()} ID: ${received.n} VALUE:${received.v.toString()}`)
    const found = this.state.parameters.find((el) => {
      return el.id == received.n
    })
    if (found === undefined) {
      console.warn(`ID:${received.n} is not set.`)
      this._error(`ID:${received.n} is not set.`)
    }

    const status = await fetch(found.url, {
      method: found.method,
      body: (found.method === 'POST') ? received.v : undefined
    }).then(response => {
      if (!response.ok) {
        this._error(`http response error: ${response.statusText}`)
        return new Promise.resolve(new Error())
      }
      return response.text()
    })
    if (status instanceof Error) { return }
    let txt
    if (found.regex) {
      const matches = (new RegExp(found.regex)).exec(status)
      if (matches === null) { this._error('http response is not contains REGEX\'s text.') }
      txt = matches.join('\r\n')
    } else {
      txt = status
    }

    const send = txt
    ipcRenderer.send('serial:write', send + '\r\n')
    this.term.logging(send)

    this.setState(before => {
      return {successCnt: before.successCnt + 1}
    })
  }

  
  _error (str) {
    this.setState(before => {
      return { errorCnt: before.errorCnt + 1 }
    })
    this.term.logging(`Error: ${str}`)
  }
}