import {Config} from '../config'

function matcher(conf) {
  expect(conf.uuid).toMatch('3b222f11-a33e-4f3e-b1ba-611aac8de5f9')
  expect(conf.parameters[0].id).toMatch('1')
  expect(conf.parameters[0].method).toMatch('GET')
  expect(conf.parameters[0].url).toMatch('https://ntp-a1.nict.go.jp/cgi-bin/time')
  expect(conf.parameters[0].body).toMatch('')
  expect(conf.parameters[0].regex).toMatch('\\d+:\\d+:\\d+')
}

describe('Config Constructor', () => {
  
  it('empty config', () => {
    const config = new Config()
    
    expect(config.uuid).toBeNull()
    expect(config.parameters).toHaveLength(0)
  })

  it('config constructor', () => {
    const config = new Config({
      uuid: '3b222f11-a33e-4f3e-b1ba-611aac8de5f9',
      parameters: [{
        id: '1',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }]
    })

    matcher(config)
  })
})

describe('', () => {
  const config = new Config()
  config.lateinit = jest.fn(() => {
    config.uuid = '3b222f11-a33e-4f3e-b1ba-611aac8de5f9'
    config.parameters = [{
      id: '1',
      method: 'GET',
      url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
      body: '',
      regex: '\\d+:\\d+:\\d+'
    }]
    config.emit('changed', config)
  })

  afterEach(() => {
    config.removeAllListeners('changed')
  })

  it ('config lateinit', () => {
    expect.assertions(12)
   
    config.on('changed', (conf) => {
      matcher(conf)
    })
    config.lateinit()
    matcher(config)
  })

  it('modify config', () => {
    config.modify = jest.fn((key, value) => {
      config[key] = value
      config.emit('changed', config)
    })
    config.lateinit()
    matcher(config)

    config.on('changed', (conf) => {
      expect(conf.uuid).toMatch('3b222f11-a33e-4f3e-b1ba-611aac8de5f9')
      expect(conf.parameters[0].id).toMatch('2')
      expect(conf.parameters[0].method).toMatch('GET')
      expect(conf.parameters[0].url).toMatch('https://ntp-a1.nict.go.jp/cgi-bin/time')
      expect(conf.parameters[0].body).toMatch('')
      expect(conf.parameters[0].regex).toMatch('\\d+:\\d+:\\d+')
    })

    config.modify('parameters', [{
        id: '2',
        method: 'GET',
        url: 'https://ntp-a1.nict.go.jp/cgi-bin/time',
        body: '',
        regex: '\\d+:\\d+:\\d+'
      }])
  })
})
