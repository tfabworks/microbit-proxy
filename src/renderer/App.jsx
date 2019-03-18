import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import { LogTerminal } from './util'

import Parameter from './component/Parameter'
import StateNavi from './component/StateNavi'
import { FooterLogo } from './component/etc'
import Term from './component/Terminal'
import PortSelector from './component/PortSelector'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    this.term = LogTerminal()
    this.state = {
      port: null,
      ports: [],
      successCnt: 0,
      errorCnt: 0,
    }

   this._setIpcListener()
    ipcRenderer.send('ready')
  }

  render () {
    return (
      <div>
        <div id='overlay'>
          <div id='overlay-button'>
            <a href={'https://mbitc.net/my/?uuid=' + this.props.config.uuid} target='_blank'>
              <span className='icon'>
                <i className='fas fa-2x fa-plug' />
              </span>
            </a>
          </div>
        </div>
        <StateNavi port={this.state.port} successCnt={this.state.successCnt} errorCnt={this.state.errorCnt} />
        <div className='container'>
          <Parameter parameters={this.props.config.parameters} />
          <Term term={this.term} />
          <PortSelector port={this.state.port} ports={this.state.ports} />
          <FooterLogo />
        </div>
      </div>
    )
  }

  _setIpcListener() {
    ipcRenderer.on('serial:ports', (_, ports) => {
      this.setState({ ports: ports })
    })
    ipcRenderer.on('serial:connected', (_, port) => {
      this.term.clear()
      this.setState({ port: port })
      this.term.logging('Connected')
    })
    ipcRenderer.on('serial:close', () => {
      this.term.clear()
      this.setState({ port: null })
      this.term.write('Disconnected.')
    })
    ipcRenderer.on('serial:wrote', () => {
      this.setState(before => {
        return { successCnt: before.successCnt + 1 }
      })
    })
    ipcRenderer.on('logging:info', (ev, str) => {
      this.term.logging(str)
    })
    ipcRenderer.on('logging:warn', (ev, str) => {
      this.setState(before => {
        return { errorCnt: before.errorCnt + 1 }
      })
      this.term.logging(`Error: ${str}`)
    })
  }
}

App.propTypes = {
  config: PropTypes.object.isRequired
}
