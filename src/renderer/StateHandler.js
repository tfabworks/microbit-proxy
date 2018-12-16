import fetch from 'isomorphic-fetch'

export default
class StateHandler {
  constructor (terminal, serial) {
    this.terminal = terminal
    this.serial = serial
    this.state = {
      url: null,
      method: null,
      sequense: null
    }
  }

  async handle (str) {
    if (/^GET:?[0-9]*$/.test(str)) {
      const match = str.match(/[0-9]+/)
      this.state = {
        method: 'GET',
        sequense: (match !== null) ? match[0] : null,
        url: null
      }
      this.consoleLog(`Serial, Recieve: ${str}`)
    } else if (/^POST:\d+$/.test(str)) {
      const match = str.match(/\d+/)
      if (match === null) { throw new Error('sequense number is none.') }
      this.state = {
        method: 'POST',
        sequense: (match !== null) ? match[0] : null
      }
      this.consoleLog(`Serial, Recieve: ${str}`)
    } else if (/^https?:\/\//.test(str)) {
      this.consoleLog(`Serial, Recieve: ${str}`)
      if (this.state.method === 'GET') {
        this.consoleLog('HTTP, Request')
        const resp = await fetch(str)
        this.consoleLog(`HTTP, Response,${resp.status}`)
        if (this.state.sequense !== null) {
          this.consoleLog(`Serial, Send, ${this.state.sequense}`)
          this.serial.write(this.state.sequense + '\r\n')
        }
        if (resp.ok) {
          const txt = (await resp.text())
          this.consoleLog(`Serial, Send, ${txt}`)
          this.serial.write(txt + '\r\n')
        }
        this.state = {
          url: null,
          method: null,
          sequense: null
        }
      } else if (this.state.method === 'POST') {
        this.state.url = str
      } else {
        console.warn('unhandle message.')
      }
    } else if (/^{.*}$/.test(str)) { // JSON
      this.consoleLog(`Serial, Recieve: ${str}`)
      const sequense = this.state.sequense
      const resp = await fetch(this.state.url, {
        method: 'POST',
        body: str,
        timeout: 5000
      })
      this.consoleLog(`HTTP, Response,${resp.status}`)
      if (this.state.sequense !== null) {
        this.consoleLog(`Serial, Send, ${sequense}`)
        this.serial.write(sequense + '\r\n')
      }
      if (resp.ok) {
        const txt = await resp.text()
        this.consoleLog(`Serial, Send, ${txt}`)
        this.serial.write(txt + '\r\n')
      }
      this.state = {
        url: null,
        method: null,
        sequense: null
      }
    } else {
      // TODO: error message on terminal
      console.warn('Unknown message.')
    }
  }

  consoleLog (str) {
    let line
    if (this.state.sequense !== null) { line = `${this.state.sequense}, ${str}` } else { line = str }
    this.terminal.emit('line', line)
  }
}
