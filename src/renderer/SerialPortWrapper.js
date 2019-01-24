import SerialPort from 'serialport'
import EventEmitter from 'events'
import _ from 'lodash'

export default
class SerialPortWrapper extends EventEmitter {
  constructor () {
    super()
    this.port = null
    this.ports = []
    this._updatePortList()
    this.portListListen();
  }
  
  portListListen() {
    setTimeout( () => {
      this._updatePortList()
      this.portListListen();
    }, 3000)
  }

  _updatePortList() {
    return SerialPort.list((err, ports) => {
      if (err) {
        console.warn(err.message)
        return
      }
      
      if (ports.length === 0) {
        console.log('No ports discovered')
      }
      const wa = _.unionWith(this.ports, ports, _.isEqual) // A または B 少なくとも片方は真 (論理和)
      const seki = _.intersectionWith(this.ports, ports, _.isEqual) // A かつ B 両方が真 (論理積)
      const ho = _.differenceWith(wa, seki, _.isEqual) // A または B のいずれかである
      if (ho.length !== 0) {
        this.emit('ports', ports)
      }
      this.ports = ports 
    })
  }

  connectPort (comName) {
    if (this.port !== null && this.port.isOpen) {
      this.port.close(err => {
        if (err) console.warn(err)
      })
    }
    const p = new SerialPort(comName, {
      baudRate: 115200
    })
    p.on('open', () => {
      this.emit('connected', p)
    })
    let chars = ''
    if (process.env.NODE_ENV === 'dev') {
      setInterval(() => {
        const j = JSON.stringify({
          t: Date.now(),
          s: Math.floor(Math.random() * Math.floor(99999)),
          n: '1',
          v: Math.floor(Math.random() * Math.floor(99999999))
        })
        this.emit('receive', j)
      }, 3000)
    }

    p.on('readable', () => {
      const char = p.read().toString()
      if (char === '\r\n') {
        let line = chars.trim()
        this.emit('receive', line)
        chars = ''
      }
      chars += char
    })
    p.on('close', () => {
      this.emit('close')
    })
    this.port = p
    // this.emit('connected', p)
  }

  write(text) {
    if (this.port === null)
      console.warn('port is not connected.')
    else
      this.port.write(text)
  }
}
