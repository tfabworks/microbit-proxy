'use strict'
import EventEmitter from 'events'
import fetch from 'isomorphic-fetch'

class ParseError extends Error {
  constructor(msg) {
    super('Parse Error: ' + msg)
  }
}

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

  unsubscribe() {
    this.senders = []
  }

  configChanged(cfg) {
    this.config = cfg
  }
  
  async _handler(str) {
    console.debug(str)
    let received
    let txt
    let regex
    let req = {
      url: undefined,
      method: undefined,
      postjson: null,
    }

    try {
      received = JSONparse(str)
    } catch (e) {
      this.senders.forEach(sender => {
        sender.send('logging:error', e.message)
      })
      return
    }
    const keyArray = Object.keys(received)
    const check = ['t', 's', 'n', 'v'].map(k => { return keyArray.includes(k) }).every(tf => tf === true)
    if (!check) {
      this.senders.forEach(sender => {
        sender.send('logging:error', 'json format is invalid.')
      })
      return 
    }
    this.senders.forEach(sender => {
      sender.send('logging:info', `SerialNo:${received.s.toString()} ID: ${received.n} VALUE:${received.v.toString()}`)
    })

    if (received.n.startsWith('_')) {
      req.url = 'http://mbitc.net/api/'
      req.method = 'POST'
      req.postjson = {
        'uuid': this.config.uuid,
        'n': received.n,
        'v': received.v.toString()
      }
    } else {
      const found = this.config.parameters.find((el) => {
        return el.id == received.n
      })
      if (found === undefined) {
        this.senders.forEach(sender => {
          sender.send('logging:warn', `ID:${received.n} is not set.`)
        })
        return
      }
      req.url = found.url
      req.method = found.method
      req.postjson = (found.method === 'POST') ? received.v : undefined
      if (found.regex) regex = found.regex
    }

    txt = await fetch(req.url, {
      method: req.method,
      body: (req.method === 'POST')? JSON.stringify(req.postjson): null,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then( response => {
      if (!response.ok) {
        this.senders.forEach(sender => {
          sender.send('logging:warn', `http response error: ${response.statusText}`)
        })
        return new Promise.reject()
      }
      this.senders.forEach(sender => {
        sender.send('logging:info', response.status)
      })
      return response.text()
    }).catch(e => {
      this.senders.forEach(sender => {
        sender.send('logging:error', 'http error')
      })
      return new Error('http error')
    })

    if (regex) {
      const matches = (new RegExp(regex)).exec(txt)
      if (matches === null) {
        this.senders.forEach(sender => {
          sender.send("logging:warn", 'http response is not contains REGEX\'s text.')
        })
      }
      txt = matches.join('\r\n')
    }
  
    this.emit('out', txt + '\r\n')
    this.senders.forEach(sender => {
      sender.send('logging:info', txt)
    })
  }
}

function JSONparse(str) {
  switch(str) {
    case true:
    case false:
    case null:
      throw new SyntaxError('Unexpected token.')
      break;
    default:
      return JSON.parse(str)
  }
}