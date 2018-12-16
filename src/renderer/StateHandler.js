import fetch from 'isomorphic-fetch'

export default
class StateHandler {
  constructor(terminal, serial) {
    this.terminal = terminal
    this.serial = serial
    this.state = {
      url: null,
      method: null,
      sequense: null
    }
  }

  async handle(str) {
    if (/^GET:?[0-9]*$/.test(str)) {
      const match = str.match(/[0-9]+/)
      this.state = {
        method: 'GET',
        sequense: (match !== null) ? match[0] : null,
        url: null
      }
    } else if (/^POST:\d+$/.test(str)) {
      const match = str.match(/\d+/)
      if (match === null)
        throw new Error('sequense number is none.')
      this.state = {
        method: 'POST',
        sequense: match[0]
      }
    } else if (/^https?:\/\//.test(str)) {
      if (this.state.method === 'GET') {
        this.terminal.emit('line', 'HTTP, Request')
        const resp = await fetch(str)
        this.terminal.emit('line', `HTTP, Response,${resp.status}`)
        const txt = (await resp.text())
        console.log(`txt: ${txt}`)
        this.serial.write(txt + '\r\n')
        this.terminal.emit('line', `Serial, Send, ${txt}`)
      } else if (this.state.method === 'POST') {
        console.log("inner POST")
        this.state.url = str
      } else {
        console.warn("unhandle message.")
      }
    } else if (/^{.*}$/.test(str)) { // JSON
      const sequense = this.state.sequense
      const resp = await fetch(this.state.url, {
        method: 'POST',
        body: str,
        timeout: 5000
      })
      this.terminal.emit('line', `HTTP, Response,${resp.status}`)
      this.terminal.emit('line', `${sequense}, Serial, Send, ${sequense}`)
      this.serial.write(sequense + '\r\n')
      if (resp.ok) {
        const txt = await resp.text()
        this.terminal.emit('line', `${sequense}, Serial, Send, ${txt}`)
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
}