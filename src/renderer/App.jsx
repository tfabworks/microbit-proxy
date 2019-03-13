import React from 'react'
import fetch from 'isomorphic-fetch'
import storage from 'electron-json-storage'
import SerialPortWrapper from './SerialPortWrapper'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

import Parameter from './component/Parameter'
import StateNavi from './component/StateNavi'
import {FooterLogo} from './component/etc'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    Terminal.applyAddon(fit)
    this.term = new Terminal()
    this.state = {
      port: null,
      ports: [],
      selected: '',
      successCnt: 0,
      errorCnt: 0,
      parameters: [{
        id: '1',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }]
    }
    storage.get('parameters', (error, data) => {
      if (error) throw error
      if (data.name) {
        this.setState({
          parameters: data
        })
      }
    })
    this.serial = new SerialPortWrapper()

    this.serial.on('ports', ports => {
      if (ports.length !== 0) { this.setState({selected: ports[0].comName}) }
      this.setState({ports: ports})
    })
    this.serial.on('connected', port => {
      this.term.clear()
      this.setState({port: port})
      this.terminalOut('Connected')
    })
    this.serial.on('receive', txt => {
      this.handler(txt)
    })
    this.serial.on('close', () => {
      this.term.clear()
      this.setState({port: null})
      this.term.write('Disconnected.')
    })

    this.handleClick = this.handleClick.bind(this)
    this.changeState = this.changeState.bind(this)
    this.terminalOut = this.terminalOut.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handler = this.handler.bind(this)
  }

  componentDidMount () {
    this.term.open(document.getElementById('TerminalContainer'))
    this.term.fit()
    this.term.write('microbit-proxy $ ')
  }

  render () {
    return (
      <div className='container'>
        <StateNavi port={this.state.port} successCnt={this.state.successCnt} errorCnt={this.state.errorCnt}/>
        <Parameter parameters={this.state.parameters} changeState={this.changeState} />
        <div id='ConnectionSelector' />
        <div id='TerminalSection'>
          <div id='TerminalContainer' />
          <form className='field' id='Connection'>
            <div className='control'>
              <select className='select' name='com-port' value={this.state.selected} onChange={this.handleChange}>
                {this.state.ports.map((p, i) => {
                  return <option key={i} value={p.comName}>{p.comName}</option>
                })}
              </select>
              <input className='button' type='button' value='Connect' onClick={this.handleClick} />
            </div>
          </form>
        </div>
        <FooterLogo />
      </div>
    )
  }

  handleChange (e) {
    const name = e.target.name
    const value = e.target.value
    switch (name) {
      case 'com-port':
        this.setState({ selected: value })
        break
      default:
        console.log(e)
    }
  }

  handleClick (e) {
    this.serial.connectPort(this.state.selected)
  }

  changeState (name, value) {
    this.setState({
      [name]: value
    })
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
    this.terminalOut(`SerialNo:${received.s.toString()} ID: ${received.n} VALUE:${received.v.toString()}`)
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
    this.serial.write(send + '\r\n')
    this.terminalOut(send)

    this.setState(before => {
      return {successCnt: before.successCnt + 1}
    })
  }

  terminalOut (str) {
    const d = new Date()
    const dateStr = d.toLocaleDateString('ja-JP')
    const timeStr = d.toLocaleTimeString('ja-JP')
    this.term.writeln(`${dateStr} ${timeStr} ${str}`)
  }

  _error (str) {
    this.setState(before => {
      return { errorCnt: before.errorCnt + 1 }
    })
    this.terminalOut(`Error: ${str}`)
  }
}
