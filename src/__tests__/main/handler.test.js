'use strict'

import {Config} from '../../config'
import Handler from '../../main/handler'


describe('handle unsupported input', () => {
  const config = new Config({})
  const handler = new Handler(config)
  let sender = {
      send: function(type, msg) {
        expect(type).toMatch('logging:error')
        expect(msg).toMatch(/Unexpected/)
      }
    }
    handler.subscribe(sender)

  it('received undefined, null and various type of unmeaning data type.', () => {
    handler.emit('handle', undefined)
    handler.emit('handle', null)
    handler.emit('handle', true)
    handler.emit('handle', false)
    handler.emit('handle', {})
    handler.emit('handle', [])
  })

  it('handling unstructured string', () => {
    handler.emit('handle', '')
    handler.emit('handle', 'abc')
    handler.emit('handle', 'hogefuga')
    handler.emit('handle', '{hogefuga')
    handler.emit('handle', '{hogefuga}')
    handler.emit('handle', 'hoge: fuga: []')
  })

  it('unsupported json string.', () => {
    sender = {
      send: function(type, msg) {
        expect(type).toMatch('logging:error')
        expect(msg).toMatch('json format is invalid.')
      }
    }
    handler.unsubscribe()
    handler.subscribe(sender)

    handler.emit('handle', JSON.stringify({}))
    handler.emit('handle', JSON.stringify({hoge: true}))
    handler.emit('handle', JSON.stringify({
      t: undefined,
      s: undefined,
      n: undefined
    }))
  })
})

describe('regular pattern', () => {
  const config = new Config({
    title: 'Microbit:Connect',
    uuid: '',
    parameters: [{
      id: '1',
      method: 'GET',
      url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
      body: '',
      regex: '\\d+:\\d+:\\d+'
    }]
  })

  const handler = new Handler(config)

  afterEach( () => {
    handler.unsubscribe()
    handler.removeAllListeners('out')
  })

  it('received registered ID', done => {
    expect.assertions(1)
    handler.on('out', msg => {
      expect(msg).toMatch(/\d{2}:\d{2}:\d{2}/)
      done()
    })
    handler.emit('handle', JSON.stringify({
      "t": '',
      "s": '',
      "n": '1',
      "v": ''
    }))
  })

  it('received unregistered ID', () => {
    expect.assertions(2)
    const sender = {
      send: function(type, msg) {
        switch(type) {
          case 'logging:info':
            expect(msg).toMatch('Serial')
            break;
          case 'logging:warn':
            expect(msg).toMatch(/ID:unknown is not set\./)
            break
          default:
            throw new Error('Unhandled sender type: ' + type)
        }
      }
    }
    handler.subscribe(sender)
    handler.emit('handle', JSON.stringify({
      t: '',
      s: '',
      n: 'unknown',
      v: ''
    }))
  })

  it('received special ID: _ID', done => {
    const sender = {
      send: function(type, msg) {
        switch(type) {
          case 'logging:info':
            expect(msg).toMatch('SerialNo: ID: _sp1 VALUE:')
            break
          case 'logging:warn':
            expect(msg).toMatch('warn')
            break
          case 'logging:error':
            expect(msg).toMatch('error')
            break
          default:
            throw new Error('Unhandled sender type: ' + type)
        }
      }
    }

    handler.subscribe(sender)
    handler.on('out', msg => {
      expect(msg).toMatch('out')
      done()
    })
    handler.emit('handle', JSON.stringify({
      t: '',
      s: '',
      n: '_sp1',
      v: ''
    }))
  })
})
