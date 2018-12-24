import SerialPort from 'serialport'
import EventEmitter from 'events'

export default
class SerialPortWrapper extends EventEmitter {
  constructor () {
    super()
    this.port = null
    
    SerialPort.list((err, ports) => {
      console.log('ports', ports)
      if (err) {
        console.warn(err.message)
        return
      }

      if (ports.length === 0) {
        console.log('No ports discovered')
      }
      this.emit('state', {
        ports: ports
      })
      if (ports.length > 0) {
        this.emit('state', {
          selected: ports[0].comName
        })
      }
    })

    setInterval(() => this.updatePortList(), 3000)
  }

  updatePortList () {
    SerialPort.list((err, ports) => {
      if (err) {
        console.log(err.message)
        return
      }

      if (ports.length === 0) {
        console.log('No ports discovered')
      }
      this.emit('state', { ports: ports })
    })
  }

  connectPort (comName) {
    if (this.port !== null && this.port.isOpen) {
      this.port.close(err => {
        console.warn(err)
      })
    }
    const p = new SerialPort(comName, {
      baudRate: 115200
    })

    let chars = ''
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
    this.emit('connected', p)
  }

  write(text) {
    if (this.port === null) console.warn('port is not connected.')
    else this.port.write(text)
  }
}
