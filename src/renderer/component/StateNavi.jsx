import React from 'react'
import PropTypes from 'prop-types'

export default
class StateNavi extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    return (
      <section class="hero is-primary">
        <nav className='hero-body level'>
          <div className='level-item has-text-centered'>
            <div>
              <p className='heading'>Device</p>
              <p className='title'>{this.props.port ? '接続' : '切断'}</p>
            </div>
          </div>
          <div className='level-item has-text-centered'>
            <div>
              <p className='heading'>Success</p>
              <p className='title'>{this.props.successCnt}</p>
            </div>
          </div>
          <div className='level-item has-text-centered'>
            <div>
              <p className='heading'>Failed</p>
              <p className='title'>{this.props.errorCnt}</p>
            </div>
          </div>
        </nav>
      </section>
    )
  }
}

StateNavi.propTypes = {
  port: PropTypes.object,
  successCnt: PropTypes.number.isRequired,
  errorCnt: PropTypes.number.isRequired
}
