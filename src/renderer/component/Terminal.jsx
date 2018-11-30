const React = require('react')

export default
class extends React.Component {
  constructor(props) {
    super(props)
    console.log(props.terminal)
  }
  render () {
    return (
      <div id='console'>
        <ol>
          <li><time>2018-11-22 08:43:44</time>hoge</li>
        </ol>
      </div>
    )
  }
}
