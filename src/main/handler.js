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
      const postjson = {
        'uuid': this.config.uuid,
        'n': received.n,
        'v': received.v.toString()
      }
      await fetch('https://mbitc.net/api/', {
        method: 'POST',
        body: postjson
      }).then( response => {
        if (!response.ok) {
          this.senders.forEach( sender => {
            sender.send('logging:warn', `http response error: ${response.statusText}`)
          })
          return
        } else {
          this.senders.forEach(sender => {
            sender.send('logging:info', response.status)
          })
        }
        return Promise.resolve()
      }).catch(e => {
        this.senders.forEach(sender => {
          sender.send('logging:error', 'http error')
        })
        throw new Error('http error')
      })
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
    
      const respText = await fetch(found.url, {
        method: found.method,
        body: (found.method === 'POST') ? received.v : undefined
      }).then(response => {
        if (!response.ok) {
          this.senders.forEach(sender => {
            sender.send('logging:warn', `http response error: ${response.statusText}`)
          })
          return new Promise.reject()
        }
        return response.text()
      }).catch(e => {
        this.senders.forEach(sender => {
          sender.send('logging:error', 'http error')
        })
        throw new Error('http error')
      })

      if (found.regex) {
        const matches = (new RegExp(found.regex)).exec(respText)
        if (matches === null) { 
          this.senders.forEach(sender => {
            sender.send("logging:warn", 'http response is not contains REGEX\'s text.')
          })
        }
        txt = matches.join('\r\n')
      } else {
        txt = respText
      }
    }
  
    const send = txt
    this.emit('out', send + '\r\n')
    this.senders.forEach(sender => {
      sender.send(send)
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