import SerialPort from 'serialport'
import _ from 'lodash'
import {ipcMain} from 'electron'

// SerialPortをWrapしたクラス
export default
class SerialPortWrapper {
  constructor () {
    this.senders = []
    this.port = null
    this.ports = []
    this._updatePortList()
    this.portListListen()
    ipcMain.on('serial:connect', (ev, comName) => {
      this.connectPort(comName)
    })
    ipcMain.on('serial:write', (ev, line) => {
      this.write(line)
    })
  }

  // ひとつのシリアルポートラッパーに対して複数のListenerを登録できる
  append(sender) {
    sender.send('serial:ports', this.ports)
    this.senders.push(sender)
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
      setInterval(() => {
        const j = JSON.stringify({
          t: Date.now(),
          s: Math.floor(Math.random() * Math.floor(99999)),
          n: '1',
          v: Math.floor(Math.random() * Math.floor(99999999))
        })
        this.senders.forEach(sender => {
          sender.send('serial:receive', j)
        })
      }, 3000)
    }

    p.on('readable', () => {
      const char = p.read().toString()
      if (char === '\r\n') {
        let line = chars.trim()
        this.serial.send('serial:receive', line)
        chars = ''
      }
      chars += char
    })
    p.on('close', () => {
      this.senders.forEach(sender => {
        sender.send('serial:close')
      })
    })
    this.port = p
    // this.emit('connected', p)
  }

  write (text) {
    if (this.port === null) { console.warn('port is not connected.') } else { this.port.write(text) }
  }
}