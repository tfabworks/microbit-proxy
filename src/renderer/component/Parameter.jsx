const React = require('react')

export default
class Parameter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
          id: '',
          method: 'GET',
          url: '',
          regex: '',
      }
  
      this.handleChange = this.handleChange.bind(this)
      this.handleClick = this.handleClick.bind(this)
      this.stateRefresh = this.stateRefresh.bind(this)
    }
  
  render() {
      return (
      <div id='ParameterContainer'>
        <table className='table'>
          <thead>
            <tr>
              <th>ID</th><th>method</th><th>URL</th><th>regex</th><th></th>
            </tr>
          </thead>
          <tbody>
          {this.props.parameters.map((e, i) => {
            return (
              <tr>
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
                <td><input className='control input is-small' name="id" value={this.state.id} onChange={this.handleChange} type="text" /></td>
                <td><select className='control select is-small' name="method" value={this.state.method} onChange={this.handleChange}>
                  <option>GET</option>
                  <option>POST</option>
                </select></td>
                <td><input className='control input is-small' name="url" value={this.state.url} onChange={this.handleChange} type="text" /></td>
                <td><input className='control input is-small' name="regex" value={this.state.regex} onChange={this.handleChange} type="text" /></td>
                <td><button className='control button is-small' name="parameter-set" onClick={this.handleClick}>確定</button></td>
              </tr>
            </tfoot>  
        </table>
      </div>
      )
    }
  
  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
  
    this.setState({
      [name]: value
    });
  }
  
  handleClick(event) {
    const target = event.target
    const name = target.name
    let params = this.props.parameters
    if (name === "parameter-set") {
      const p = {
        'id': this.state.id,
        'method': this.state.method,
        'url': this.state.url,
        'regex': this.state.regex
      }
      if (!params.find(e => e.id == p.id)) {
        params.push(p)
        this.props.changeState('parameters', params)
        this.stateRefresh()
      } else {
        console.log("Name column must be unique.")
      }
    } else if (name === 'remove') {
      const value = target.value
      this.props.changeState('parameters', params.filter(v => {return v.id !== value}))
    }
  }
  
    stateRefresh() {
      this.setState({
        id: '',
        method: 'GET',
        url: '',
        regex: ''
      })  
    }
  }