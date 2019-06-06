import React from 'react'
import PropTypes from 'prop-types'
import { ToastContainer, toast } from 'react-toastify';
import { ipcRenderer } from 'electron'
import QRcode from 'qrcode'

import StateNavi from './component/StateNavi'
import { VersionComponent } from './component/etc'
import PortSelector from './component/PortSelector'

export default
class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      port: null,
      ports: [],
      successCnt: 0,
      errorCnt: 0,
    }
    this.qrref = React.createRef()

   this._setIpcListener()
    ipcRenderer.send('ready')
  }

  render () {
    return (
      <div>
        <ToastContainer />
        <div id='overlay'>
          <div id='overlay-button'>
            <a href={this.generateUuidUrl()} target='_blank'>
              <span className='icon'>
                <i className='fas fa-2x fa-plug' />
              </span>
            </a>
          </div>
        </div>
        <StateNavi port={this.state.port} successCnt={this.state.successCnt} errorCnt={this.state.errorCnt} />
        <div className='container'>
          <a href={this.generateUuidUrl()} target='_blank'>
            <canvas id="qrcode" ref={this.qrref}/>
          </a>
          <PortSelector port={this.state.port} ports={this.state.ports} />
          <VersionComponent />
        </div>
      </div>
    )
  }

  componentDidMount() {
    console.log(this.qrref.current)
    const canvas = this.qrref.current;
    QRcode.toCanvas(canvas, this.generateUuidUrl(), {
      scale: 7
    }, (err) => {
      if (err) console.error(err)
    })
  }
  notify(msg, options, type="default") {
    switch(type) {
      case 'success':
      case 'info':
      case 'warn':
      case 'error':
        toast[type](msg, options)
        break
      case 'default':
      default:
        toast(msg, options)
    }
  }

  _setIpcListener() {
    ipcRenderer.on('serial:ports', (_, ports) => {
      this.setState({ ports: ports })
    })
    ipcRenderer.on('serial:connected', (_, port) => {
      this.setState({ port: port })
    })
    ipcRenderer.on('serial:close', () => {
      this.setState({ port: null })
    })
    ipcRenderer.on('serial:wrote', () => {
      this.setState(before => {
        return { successCnt: before.successCnt + 1 }
      })
    })
    ipcRenderer.on('notify', (_, msg, type='default') => {
      console.log(msg)
      this.notify(msg, {
        position: "top-right",
        hideProgressBar: true,
        pauseOnHover: true,
        closeOnClick: true,
        draggable: false
      }, 'info')
    })
    ipcRenderer.on('logging:warn', (ev, str) => {
      this.setState(before => {
        return { errorCnt: before.errorCnt + 1 }
      })
    })
  }
  generateUuidUrl() {
    return 'https://mbitc.net/my/?uuid=' + this.props.config.uuid
  }
}

App.propTypes = {
  config: PropTypes.object.isRequired
}
