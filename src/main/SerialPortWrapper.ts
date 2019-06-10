import SerialPort from 'serialport'
import _ from 'lodash'
import { ipcMain, WebContents } from 'electron'
import Handler from './handler'
import {Config} from '../config'


// SerialPortをWrapしたクラス
export default
class SerialPortWrapper {
  senders: any;
  handler: Handler;
  port: any;
  ports: any;

  constructor (config: Config) {
    this.senders = []
    this.port = null
    this.ports = []
    this.handler = new Handler(config)
    this.handler.subscribe({
      send: function(type: string, msg: string) {
        if (type === 'logging:error')
          console.error(msg)
      }
    })
    this._updatePortList()
    this.portListListen()
    ipcMain.on('serial:connect', (ev: any, comName: string) => {
      if (this.port === null) {
        this.connectPort(comName)
      }
    })
    ipcMain.on('serial:write', (ev: any, line: string) => {
      this.write(line)
    })
    this.handler.on('out', (str) => {
      this.write(str)
      this.senders.forEach((sender: any) => {
        sender.send('serial:wrote', str)
      })
    })
  }

  // ひとつのシリアルポートラッパーに対して複数のListenerを登録できる
  subscribe (sender: WebContents) {
    this.handler.subscribe(sender)
    sender.send('serial:ports', this.ports)
    this.senders.push(sender)
  }

  unsubscribe() {
    this.senders = []
    this.handler.unsubscribe()
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
        this.senders.forEach((sender: Sender) => {
          sender.send('serial:ports', ports)
        })
      }
      this.ports = ports
    })
  }

  connectPort (comName: string) {
    if (this.port !== null && this.port.isOpen) {
      this.port.close((err: Error) => {
        if (err) console.warn(err)
      })
    }
    const p = new SerialPort(comName, {
      baudRate: 115200
    })
    p.on('open', () => {
      this.senders.forEach((sender: Sender) => {
        sender.send('serial:connected', p)
      })
    })
    let chars = ''

    p.on('readable', () => {
      let char = p.read()
      console.log("word:\t" + JSON.stringify(char && char.toString()))
      char = char && char.toString()
      chars += char

      if (this.endsWith(chars, '\r\n')) {
        let line = chars.trim()
        console.log("line:\t" + JSON.stringify(line))
        this.handler.handle(line)
        chars = ''
      }
    })
    p.on('close', () => {
      this.senders.forEach((sender: Sender) => {
        sender.send('serial:close')
      })
      this.port = null
    })
    this.port = p
    // this.emit('connected', p)
  }

  write (text: string) {
    if (this.port === null)
      console.warn('port is not connected.')
    else
     this.port.write(text)
  }

  endsWith(str: string, match: string) {
    return str.slice(-match.length) === match
  }
}
