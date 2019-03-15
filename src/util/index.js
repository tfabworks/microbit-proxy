import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'

class _LogTerminal extends Terminal {
  constructor () {
    super()
  }
  logging (str) {
    const d = new Date()
    const dateStr = d.toLocaleDateString('ja-JP')
    const timeStr = d.toLocaleTimeString('ja-JP')
    this.writeln(`${dateStr} ${timeStr} ${str}`)
  }
}

export function LogTerminal () {
  _LogTerminal.applyAddon(fit)
  return new _LogTerminal()
}
