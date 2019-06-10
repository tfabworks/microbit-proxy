'use strict'

import EventEmitter from 'events'
import fetch from 'isomorphic-fetch'
import env from '../env'
import {Config} from '../config'

interface parsedText {
  t: string;
  s: string;
  n: string;
  v: string;
}

interface request {
  url: string;
  method: string;
  postjson?: {
    uuid: string;
    n: string;
    v: string;
  }
}

export default
class Handler extends EventEmitter {
  config: Config;
  senders: Sender[];

  constructor(config: Config) {
    super()
    this.config = config
    // log や successなどの状態をとれるリスナーをセットする
    this.senders = []
  }

  subscribe(sender: Sender) {
    this.senders.push(sender)
  }

  unsubscribe() {
    this.senders = []
  }

  handle(line: string) {
    this._handler(line)
  }

  async _handler(str: string) {
    let received: parsedText;
    let txt
    let req: request = {
      url: "",
      method: ""
    }

    try {
      received = JSON.parse(str)
    } catch (e) {
      this.loggingError(e.message)
      return
    }
    
    this.loggingInfo(`SerialNo:${received.s.toString()} ID: ${received.n} VALUE:${received.v.toString()}`)

    req.url = env["url:api"] + '/api'
    req.method = 'POST'
    req.postjson = {
      'uuid': this.config.uuid,
      'n': received.n,
      'v': received.v.toString()
    }
    
    txt = await fetch(req.url, {
      method: req.method,
      body: (req.method === 'POST')? JSON.stringify(req.postjson): null,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then( response => {
      if (!response.ok) {
        this.loggingWarn(`http response error: ${response.statusText}`)
        return Promise.reject()
      }
      this.loggingInfo(response.status.toString())
      return response.text()
    }).catch(e => {
      this.loggingError(e)
      return new Error('http error')
    })

    if ("string" === typeof(txt)) {
      this.loggingInfo(txt)
      this.emit('out', txt + '\r\n')
    }
  }

  loggingInfo(str: string) {
    this.senders.forEach(sender => {
      sender.send('logging:info', str)
    })
  }

  loggingWarn(str: string) {
    this.senders.forEach(sender => {
      sender.send('logging:warn', str)
    })
  }

  loggingError(str: string) {
    this.senders.forEach(sender => {
      sender.send('logging:error', str)
    })
  }
}
