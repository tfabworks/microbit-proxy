import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron';
const dialog = require('electron').remote.dialog

const errorno = {
  1: 'id is empty.',
  2: 'id is invalid.',
  3: 'id is duplicated.',
  4: 'url is empty.',
  5: 'url is invalid.',
  6: 'regex is invalid'
}

export default
class Parameter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: '',
      method: 'GET',
      url: '',
      regex: '',
      status: {
        id: false,
        method: true,
        url: false,
        regex: true
      },
      className: {
        id: '',
        method: '',
        url: '',
        regex: ''
      }
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  render () {
    return (
      <div id='ParameterContainer'>
        <table className='table is-hostriped is-hoverable is-fullwidth'>
          <thead>
            <tr>
              <th>ID</th><th>method</th><th>URL</th><th>regex</th><th />
            </tr>
          </thead>
          <tbody>
            {this.props.parameters.map((e, i) => {
              return (
                <tr key={i}>
                  <td>{e.id}</td>
                  <td>{e.method}</td>
                  <td className='word-break-all'>{e.url}</td>
                  <td className='word-break-all'>{e.regex}</td>
                  <td><div className='control'><button className='button is-small' name='remove' value={e.id} onClick={this.handleClick}>削除</button></div></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className='field'>
            <tr>
              <td>
                <input className={'control input is-small ' + this.state.className.id} name='id' value={this.state.id} onChange={this.handleChange} type='text' />
                <p>'_' で始まる文字列は使用できません</p>
              </td>
              <td><select className='control select is-small' name='method' value={this.state.method} onChange={this.handleChange}>
                <option>GET</option>
                <option>POST</option>
              </select></td>
              <td>
                <input className={'control input is-small ' + this.state.className.url} name='url' value={this.state.url} onChange={this.handleChange} type='text' />
                <p>http(s)://~ で始まるアドレスを入力してください</p>
              </td>
              <td><input className='control input is-small' name='regex' value={this.state.regex} onChange={this.handleChange} type='text' /></td>
              <td><button className='control button is-small' name='parameter-set' onClick={this.handleClick}>確定</button></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  handleChange (event) {
    const target = event.target
    const value = target.value
    const name = target.name

    let status = false
    let className = ''
    switch (name) {
      case 'id':
        const idArr = this.props.parameters.map(i => i.id)
        if (/^[^_ ]/.test(value) && !idArr.includes(value)) {
          status = true
          className = 'is-success'
        } else {
          status = false
          className = 'is-danger'
        }
        break
      case 'method':
        status = true
        break
      case 'url':
        if (/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(value)) {
          status = true
          className = 'is-success'
        } else {
          status = false
          className = 'is-danger'
        }
        break
      case 'regex':
        status = true
        break
      default:
        console.warn('undeclared name')
        return
    }
    this.setState(prev => {
      const _status = Object.assign(prev.status, { [name]: status })
      const _className = Object.assign(prev.className, { [name]: className })
      return {
        [name]: value,
        status: _status,
        className: _className
      }
    })
  }

  handleClick (event) {
    const target = event.target
    const name = target.name
    let params = this.props.parameters
    const statuses = this.state.status
    if (name === 'parameter-set') {
      if (!(statuses.id && statuses.method && statuses.url && statuses.regex)) {
        dialog.showMessageBox({
          type: 'info',
          title: 'エラーだよ',
          message: 'hogehoge'
        })
        return
      }
      const p = {
        'id': this.state.id,
        'method': this.state.method,
        'url': this.state.url,
        'regex': this.state.regex
      }
      if (!params.find(e => e.id == p.id)) {
        this.stateRefresh()
        params.push(p)
        ipcRenderer.send('config:add', 'parameters', params)
      } else {
        console.log('Name column must be unique.')
      }
    } else if (name === 'remove') {
      const value = target.value
      ipcRenderer.send('config:remove', 'parameters', value)
    }
  }

  stateRefresh () {
    this.setState({
      id: '',
      method: 'GET',
      url: '',
      regex: '',
      status: {
        id: false,
        method: true,
        url: false,
        regex: true
      },
      className: {
        id: '',
        method: '',
        url: '',
        regex: ''
      }
    })
  }
}

Parameter.propTypes = {
  parameters: PropTypes.array.isRequired
}
