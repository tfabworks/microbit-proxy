import SerialPort from 'serialport'
import _ from 'lodash'
import { ipcMain } from 'electron'
import Handler from './handler'

// SerialPortをWrapしたクラス
export default
class SerialPortWrapper {
  constructor (config) {
    this.senders = []
    this.port = null
    this.ports = []
    this.handler = new Handler(config)
    this.handler.subscribe({
      send: function(type, msg) {
        if (type === 'logging:error')
          console.error(msg)
      }
    })
    this._updatePortList()
    this.portListListen()
    ipcMain.on('serial:connect', (ev, comName) => {
      if (this.port === null) { this.connectPort(comName) }
    })
    ipcMain.on('serial:write', (ev, line) => {
      this.write(line)
    })
    this.handler.on('out', (str) => {
      this.write(str)
      this.senders.forEach(sender => {
        sender.send('serial:wrote', str)
      })
    })
  }

  // ひとつのシリアルポートラッパーに対して複数のListenerを登録できる
  subscribe (sender) {
    this.handler.subscribe(sender)
    sender.send('serial:ports', this.ports)
    this.senders.push(sender)
  }

  unsubscribe() {
    this.senders = []
    this.handler.unsubscribe()
  }

  configChanged(cfg) {
    this.handler.configChanged(cfg)
  }

  portListListen () {
    setTimeout(() => {
      this._updatePortList()
      this.portListListen()
    }, 3000)
  }

  _updatePortList () {
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
        this.senders.forEach(sender => {
          sender.send('serial:ports', ports)
        })
      }
      this.ports = ports
    })
  }

  connectPort (comName) {
    let intervalCleanFlag
    if (this.port !== null && this.port.isOpen) {
      this.port.close(err => {
        if (err) console.warn(err)
      })
    }
    const p = new SerialPort(comName, {
      baudRate: 115200
    })
    p.on('open', () => {
      this.senders.forEach(sender => {
        sender.send('serial:connected', p)
      })
    })
    let chars = ''
    if (process.env.NODE_ENV === 'dev') {
      intervalCleanFlag = setInterval(() => {
        const j = JSON.stringify({
          t: Date.now(),
          s: Math.floor(Math.random() * Math.floor(99999)),
          n: '1',
          v: Math.floor(Math.random() * Math.floor(99999999))
        })
        this.senders.forEach(sender => {
          this.handler.emit('handle', j)
        })
      }, 3000)
    }

    p.on('readable', () => {
      const char = p.read().toString()
      if (char === '\r\n') {
        let line = chars.trim()
        this.handler.emit('handle', line)
        chars = ''
      }
      chars += char
    })
    p.on('close', () => {
      this.senders.forEach(sender => {
        sender.send('serial:close')
      })
      this.port = null
      if (process.env.NODE_ENV === 'dev') { clearInterval(intervalCleanFlag) }
    })
    this.port = p
    // this.emit('connected', p)
  }

  write (text) {
    if (this.port === null) { console.warn('port is not connected.') } else { this.port.write(text) }
  }
}
