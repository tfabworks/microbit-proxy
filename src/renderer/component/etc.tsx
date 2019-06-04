import React from 'react'
import env from '../../env'

export function VersionComponent() {
  return <p>{env.version}</p>
}
