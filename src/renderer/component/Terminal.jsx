import React from 'react'
import PropTypes from 'prop-types'
import {ipcRenderer} from 'electron'

export default
class Term extends React.Component {
  render () {
    return (
        <div id='TerminalContainer' />
    )
  }

  componentDidMount () {
    this.props.term.open(document.getElementById('TerminalContainer'))
    this.props.term.fit()
    this.props.term.write('microbit-proxy $ ')
  }
}

Term.propTypes = {
  term: PropTypes.func.isRequired
}
