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
      port: new SerialPort('/dev/tty.usbmodem14302', {
        baudRate: 115200
      }),
      terminal: {
        lines: []
      }
    }

    SerialPort.list((err, ports) => {
      console.log('ports', ports)
      this.setState({ports: ports})
      if (err) {
        console.log(err.message)
        return
      }

      if (ports.length === 0) {
        console.log('No ports discovered')
      }
    })

    let chars = ''
    this.state.port.on('readable', () => {
      const char = this.state.port.read().toString()

      if (char === '\r\n') {
        let line = chars.trim()
        this.consoleLog(`Serial, Recieve: ${line}`)
        this._serialHandler(line)
        chars = ''
      }
      chars += char
    })

    if (process.env.STAGE !== 'prod') {
      this._debug()
    }
  }

  render () {
    return (
      <div id='container'>
        <div id='conn-selector'>
          <form>
            <select name='com-port'>
              {this.state.ports.map( (p,i) => {
                return <option key={i} value={p.comName}>{p.comName}</option>
              })}
            </select>
          </form>
          <button type='submit'>接続</button>
        </div>
        <Terminal terminal={this.state.terminal}/>
      </div>
    )
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
      this.setState({ serialState: null })
      this.consoleLog('HTTP, Request')
      const resp = await fetch(str)
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
