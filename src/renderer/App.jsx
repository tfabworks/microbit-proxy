import SerialPort from 'serialport'
import React from 'react'
import { tuple } from 'immutable-tuple'
import Terminal from './component/Terminal'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    
    this.state = {
      port: new SerialPort('/dev/tty.usbmodem14302', {
        baudRate: 115200
      }),
      terminal: {
        lines: []
      }
    }

    let chars = ''
    this.state.port.on('readable', () => {
      const char = this.state.port.read().toString()

      if (char === '\r\n') {
        this.setState(state => {
          let tmp = state.terminal
          tmp.lines.push(tuple((new Date()).toISOString(), chars.trim()))
          return { terminal: tmp}
        })
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
              <option value='1'>COM1</option>
              <option value='2'>COM2</option>
              <option value='3'>COM3</option>
              <option value='4'>COM4</option>
            </select>
          </form>
          <button type='submit'>接続</button>
        </div>
        <Terminal terminal={this.state.terminal}/>
      </div>
    )
  }

  _debug () {
    SerialPort.list((err, ports) => {
      console.log('ports', ports)
      if (err) {
        console.log(err.message)
        return
      }

      if (ports.length === 0) {
        console.log('No ports discovered')
      }
    })

    setInterval(() => {
      this.state.terminal.lines.forEach((v, i) => {
        console.log(`${i}: ${v[0]},${v[1]}`)
      })
    }, 3000)
  }
}
