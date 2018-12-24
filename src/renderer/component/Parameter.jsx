const React = require('react')

export default
class Parameter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
          name: '',
          method: 'GET',
          url: '',
          body: '',
          regex: '',
          disabled: true
      }
  
      this.handleChange = this.handleChange.bind(this)
      this.handleClick = this.handleClick.bind(this)
      this.stateRefresh = this.stateRefresh.bind(this)
    }
  
  render() {
      return (
      <div id='ParameterContainer'>
        <table id='ParameterList'>
          <thead>
            <tr>
              <th>name</th><th>method</th><th>URL</th><th>body</th><th>regex</th><th></th>
            </tr>
          </thead>
          <tbody>
          {this.props.parameters.map((e, i) => {
            return (
              <tr>
                <td>{e.name}</td>
                <td>{e.method}</td>
                <td>{e.url}</td>
                <td>{e.body}</td>
                <td>{e.regex}</td>
                <td><button name='remove' value={e.name} onClick={this.handleClick}>削除</button></td>
              </tr>
            )
          })}
          </tbody>
        </table>
        <div id='ParameterSelector'>
          name:<input name="name" value={this.state.name} onChange={this.handleChange} type="text" />
            <select name="method" value={this.state.method} onChange={this.handleChange}>
            <option>GET</option>
            <option>POST</option>
          </select>
          url:<input name="url" value={this.state.url} onChange={this.handleChange} type="text" />
          body:<input name="body" value={this.state.body} onChange={this.handleChange} disabled={this.state.disabled} type="text" />
          regex:<input name="regex" value={this.state.regex} onChange={this.handleChange} type="text" />
          <button name="parameter-set" onClick={this.handleClick}>確定</button>
        </div>
      </div>
      )
    }
  
  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
  
    if (name === 'method') {
      this.setState({
        [name]: value,
        body: '',
        disabled: value === 'GET'
      })
    } else {
      this.setState({
        [name]: value
      });
    }
  }
  
  handleClick(event) {
    const target = event.target
    const name = target.name
    let params = this.props.parameters
    if (name === "parameter-set") {
      const p = {
        'name': this.state.name,
        'method': this.state.method,
        'url': this.state.url,
        'body': this.state.body,
        'regex': this.state.regex
      }
      if (!params.find(e => e.name == p.name)) {
        params.push(p)
        this.props.changeState('parameters', params)
        this.stateRefresh()
      } else {
        console.log("Name column must be unique.")
      }
    } else if (name === 'remove') {
      const value = target.value
      this.props.changeState('parameters', params.filter(v => {return v.name !== value}))
    }
  }
  
    stateRefresh() {
      this.setState({
        name: '',
        method: 'GET',
        url: '',
        body: '',
        regex: ''
      })  
    }
  }