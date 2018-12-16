import React from 'react'
import { tuple } from 'immutable-tuple'
import Terminal from './component/Terminal'
import EventEmitter from 'events'
import StateHandler from './StateHandler'
import SerialPortWrapper from './SerialPortWrapper'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    this.terminal = new EventEmitter()
    this.terminal.on('line', str => {
      this.setState(state => {
        state.terminal.lines.push(tuple((new Date()).toISOString(), str))
        return state
      })
    })
    this.handler = null
    this.serial = new SerialPortWrapper(this.terminal)

    this.serial.on('state', state => {
      this.setState(before => {
        return Object.assign(before, state)
      })
    })
    this.serial.on('connected', port => {
      this.handler = new StateHandler(this.terminal, port)
    })
    this.serial.on('receive', txt => {
      if (this.handler !== null) { this.handler.handle(txt) }
    })

    this.state = {
      ports: [],
      selected: '',
      terminal: {
        lines: []
      }
    }

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
              {this.state.ports.map((p, i) => {
                return <option key={i} value={p.comName}>{p.comName}</option>
              })}
            </select>
            <input type='button' value='Connect' onClick={this.handleSubmit} />
          </form>
        </div>
        <Terminal terminal={this.state.terminal} />
      </div>
    )
  }

  handleChange (e) {
    this.setState({ selected: e.target.value })
  }

  handleSubmit (e) {
    this.serial.connectPort(this.state.selected)
  }

  _debug () {
    setInterval(() => {
      this.state.terminal.lines.forEach((v, i) => {
        console.log(`${i}: ${v[0]},${v[1]}`)
      })
      console.log(this.state)
    }, 3000)
  }
}
