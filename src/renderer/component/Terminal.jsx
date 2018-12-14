const React = require('react')

export default
class extends React.Component {
  render () {
    return (
      <div id='console'>
        <ol>
          {this.props.terminal.lines.slice(-20).map((e, i) => {
            return <li key={i}><time>{e[0]}</time>{e[1]}</li>
          })}
        </ol>
      </div>
    )
  }
}
