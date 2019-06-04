import React from 'react'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'

interface IProps {
  port: any;
  ports: any;
}
interface IState {
  selected: any;
}

export default
class PortSelector extends React.Component<IProps, IState> {
  comName: string;
  port: string|undefined;
  ports: any;

  constructor (props: any) {
    super(props)
    this.comName = ''
    this.state = {
      selected: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  render () {
    this.comName = this.state.selected || this.props.port && this.props.port.comName || (this.props.ports.length > 0 ? this.props.ports[0].comName : '')
    return (
      <form className='field' id='Connection'>
        <div className='control'>
          <select className='select' name='com-port' value={this.comName} onChange={this.handleChange}>
            {this.props.ports.map((p:any, i:number) => {
              return <option key={i} value={p.comName}>{p.comName}</option>
            })}
          </select>
          <input className='button' type='button' value='Connect' onClick={this.handleClick} />
        </div>
      </form>)
  }

  handleClick (e: any) {
    if (this.comName)
      ipcRenderer.send('serial:connect', this.comName)
  }

  handleChange (e: any) {
    this.setState({ 'selected': e.target.value })
  }
}
