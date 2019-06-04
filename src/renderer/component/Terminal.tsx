import React from 'react'

interface IProps {
  term: any;
}

export default
class Term extends React.Component<IProps> {
  term: any;
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
