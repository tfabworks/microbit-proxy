import SerialPort from 'serialport'
import React from 'react'
import fetch from 'isomorphic-fetch'
import { tuple } from 'immutable-tuple'
import Terminal from './component/Terminal'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    
    this.state = {
      ports: [],
      port: null,
      selected: '',
      terminal: {
        lines: []
      }
    }

    this.updatePortList()
    setInterval(this.updatePortList, 3000)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)

    if (process.env.STAGE === 'dev') {
      this._debug()
    }
  }

  render () {
    return (
      <div id='container'>
        <div id='conn-selector'>
          <form >
            <select name='com-port' value={this.state.selected} onChange={this.handleChange}>
              {this.state.ports.map( (p,i) => {
                return <option key={p.comName} value={p.comName}>{p.comName}</option>
              })}
            </select>
            <input type="button" value="Connect" onClick={this.handleSubmit}></input>
          </form>
        </div>
        <Terminal terminal={this.state.terminal}/>
      </div>
    )
  }

  handleChange(e) {
    this.setState({selected: e.target.value})
  }

  handleSubmit(e) {
    this.connectPort(this.state.selected)
  }

  updatePortList() {
    SerialPort.list((err, ports) => {
      console.log('ports', ports)
      if (err) {
        console.log(err.message)
        return
      }

      if (ports.length === 0) {
        console.log('No ports discovered')
      }
      this.setState({ports: ports})
    })
  }

  connectPort(comName) {
    if (this.state.port !== null) {
      this.state.port.close(err => {
        console.log(err)
      })
      this.consoleLog('Disonnected.')
    }
    const p = new SerialPort(comName, {
      baudRate: 115200
    })

    let chars = ''
    p.on('readable', () => {
      const char = p.read().toString()

      if (char === '\r\n') {
        let line = chars.trim()
        this.consoleLog(`Serial, Recieve: ${line}`)
        this._serialHandler(line)
        chars = ''
      }
      chars += char
    })

    this.setState({ port: p })
    this.consoleLog('Connected.')
  }

  consoleLog(str) {
    this.setState(state => {
      state.terminal.lines.push(tuple((new Date()).toISOString(), str))
      return state
    })
  }

  async _serialHandler(str) {
    if (str === 'GET') {
      this.setState( {serialState: str} )
    } else if (/^POST:\d+$/.test(str)) {
      this.setState({serialState: str})
    } else if (/^https?:\/\//.test(str)) {
      
      if (this.state.serialState === 'GET') {
        this.consoleLog('HTTP, Request')
        const resp = await fetch(str)
        this.consoleLog(`HTTP, Response,${resp.status}`)
        this.consoleLog(await resp.text())
      } else if (this.state.serialState === 'POST') {
        this.setState({ serialState: str })
      }
            
    }  else if (/^{.*}$/.test(str)) { //JSON
      this.setState({ serialState: null })
      this.consoleLog('HTTP, Request')
      const resp = await fetch(str, {
        method: 'POST',
        body: str,
        timeout: 5000
      })
      this.consoleLog(`HTTP, Response,${resp.status}`)
      this.consoleLog(await resp.text())
    } else {
      // TODO: error message on terminal
      console.log("Unknown message.")
    }
    
  }

  _debug () {
    setInterval(() => {
      this.state.terminal.lines.forEach((v, i) => {
        console.log(`${i}: ${v[0]},${v[1]}`)
      })
    }, 3000)
  }
}
