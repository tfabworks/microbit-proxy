import React from 'react'
import fetch from 'isomorphic-fetch'
import storage from 'electron-json-storage';
import SerialPortWrapper from './SerialPortWrapper'
import Parameter from './component/Parameter'
import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    Terminal.applyAddon(fit);
    this.term = new Terminal()
    this.state = {
      ports: [],
      selected: '',
      parameters: [{
        name: 'jikoku',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }]
    }
    storage.get('parameters', (error, data) => {
      if (error) throw error;
      console.log(data)
      if (data.name) {
        this.setState({
          parameters: data
        })
      }
    });
    this.serial = new SerialPortWrapper()

    this.serial.on('state', state => {
      this.setState(before => {
        return Object.assign(before, state)
      })
    })
    this.serial.on('connected', port => {
      this.term.clear()
      this.terminalOut("Connected")
    })
    this.serial.on('receive', txt => {
      this.handler(txt)
    })
    this.serial.on('close', () => {
      this.term.clear()
      this.term.write("Disconnected.")
    })

    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.changeState = this.changeState.bind(this)
    this.terminalOut = this.terminalOut.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handler = this.handler.bind(this)

    if (process.env.STAGE === 'dev') {
      this._debug()
    }
  }
  componentDidMount() {
    this.term.open(document.getElementById('TerminalContainer'))
    this.term.fit();
    this.term.write('microbit-proxy $ ')
  }

  render () {
    return (
      <div id='container'>
        <Parameter parameters={this.state.parameters} changeState={this.changeState} />
        <div id='ConnectionSelector'>
          <form>
            <select name='com-port' value={this.state.selected} onChange={this.handleChange}>
              {this.state.ports.map((p, i) => {
                return <option key={i} value={p.comName}>{p.comName}</option>
              })}
            </select>
            <input name="connect" type='button' value='Connect' onClick={this.handleClick} />
          </form>
        </div>
        <div id="TerminalContainer"></div>
        <a href="https://tfabworks.com/">
          <img id='FooterLogo' src="./static/logo.png"></img>
        </a>
      </div>
    )
  }

  handleChange(e) {
    const name = e.target.name
    const value = e.target.value
    switch (name) {
      case 'com-port':
        this.setState({ selected: value })
        break;
      default:
        console.log(e)
    }
  }

  handleClick(e) {
    this.serial.connectPort(this.state.selected)
  }

  changeState(name, value) {
    this.setState({
      [name]: value
    })
  }

  async handler(str) {
    const t = str.split(':')
    const key = t[0]
    const serialNumber = t[1]
    console.log(key)
    console.log(serialNumber)
    this.terminalOut(`${serialNumber}, Serial, Recieve: ${str}`)
    console.log(this.state.parameters)
    const param = this.state.parameters.find(e => { return e.name == key })
    console.log(param)
    if (param) {
      if (param.method === "GET") {
        console.log("GET")
        this.terminalOut(`${serialNumber}, HTTP, Request: GET, ${param.url}`)
        const resp = await fetch(param.url)
        this.terminalOut(`${serialNumber}, HTTP, Response: ${resp.status}`)
        this.serial.write("\r\n")
        this.serial.write(`${serialNumber}\r\n`)
        this.terminalOut(`${serialNumber}, Serial, Send: ${serialNumber}`)
        let txt = await resp.text()
        console.log(txt)
        if (param.regex) txt = txt.match(new RegExp(param.regex))
        console.log(param.regex)
        console.log(txt)
        this.serial.write(`${txt}\r\n`)
        this.terminalOut(`${serialNumber}, Serial, Send: ${txt}`)
      } else if (param.method === "POST") {
        console.log("POST")
        this.terminalOut(`${serialNumber}, HTTP, Request: POST, ${param.url}`)
        const resp = await fetch(param.url, {
          method: 'POST',
          body: param.body,
          timeout: 5000
        })
        this.terminalOut(`${serialNumber}, HTTP, Response: ${resp.status}`)
        this.serial.write("\r\n")
        this.serial.write(`${serialNumber}\r\n`)
        this.terminalOut(`${serialNumber}, Serial, Send, ${serialNumber}`)
        let txt = await resp.text()
        if (param.regex) txt = txt.match(param.regex)
        this.serial.write(`${txt}\r\n`)
        this.terminalOut(`${serialNumber}, Serial, Send, ${txt}`)
      } else {
        console.warn("Error: undefined http method.")
      }
    } else {
      this.terminalOut("Request parameter is not defined.")
    }
  }

  terminalOut(str) {
    this.term.writeln(str)
  }
  
  _debug () {
    setInterval(() => {
      console.log(this.state)
    }, 3000)
  }
}
