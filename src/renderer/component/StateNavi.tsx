import React from 'react'

interface IProps {
  port: any;
  successCnt: number;
  errorCnt: number;
}

export default
class StateNavi extends React.Component<IProps> {
  constructor (props: IProps) {
    super(props)
  }

  render () {
    return (
      <section className='hero is-primary'>
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
