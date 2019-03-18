import EventEmitter from 'events'
import fetch from 'isomorphic-fetch'

export default
class Handler extends EventEmitter {
  constructor(config) {
    super()
    this.config = config
    // log や successなどの状態をとれるリスナーをセットする
    this.senders = []
    
    this.on('handle', this._handler)
  }

  subscribe(sender) {
    this.senders.push(sender)
  }

  configChanged(cfg) {
    this.config = cfg
  }
  
  async _handler(str) {
    console.log(str)
    let received
    try {
      received = JSON.parse(str)
    } catch (e) {
      this.senders.forEach(sender => {
        sender.send('logging:warn', e.message)
      })
      return
    }
    this.senders.forEach(sender => {
      sender.send('logging:info', `SerialNo:${received.s.toString()} ID: ${received.n} VALUE:${received.v.toString()}`)
    })
    const found = this.config.parameters.find((el) => {
      return el.id == received.n
    })
    if (found === undefined) {
      this.senders.forEach(sender => {
        sender.send('logging:warn', `ID:${received.n} is not set.`)
      })
      return
    }
  
    const status = await fetch(found.url, {
      method: found.method,
      body: (found.method === 'POST') ? received.v : undefined
    }).then(response => {
      if (!response.ok) {
        this.senders.forEach(sender => {
          sender.send('logging:warn', `http response error: ${response.statusText}`)
        })
        return new Promise.resolve(new Error())
      }
      return response.text()
    })
    if (status instanceof Error) { return }
    let txt
    if (found.regex) {
      const matches = (new RegExp(found.regex)).exec(status)
      if (matches === null) { 
        this.senders.forEach(sender => {
          sender.send("logging:warn", 'http response is not contains REGEX\'s text.')
        })
      }
      txt = matches.join('\r\n')
    } else {
      txt = status
    }
  
    const send = txt
    this.emit('out', send + '\r\n')
    this.senders.forEach(sender => {
      sender.send(send)
    })
  }
}