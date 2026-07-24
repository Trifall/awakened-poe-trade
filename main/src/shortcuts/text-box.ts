import { uIOhook, UiohookKey as Key } from 'uiohook-napi'
import process from 'process'
import type { HostClipboard } from './HostClipboard'
import type { OverlayWindow } from '../windowing/OverlayWindow'
import { delay } from './utils'

const PLACEHOLDER_LAST = '@last'
const AUTO_CLEAR = [
  '#', // Global
  '%', // Party
  '@', // Whisper
  '$', // Trade
  '&', // Guild
  '/' // Command
]

export async function typeInChat (text: string, send: boolean, clipboard: HostClipboard) {
  clipboard.restoreShortly(async (clipboard) => {
    const modifiers = process.platform === 'darwin' ? [Key.Meta] : [Key.Ctrl]

    if (text.startsWith(PLACEHOLDER_LAST)) {
      text = text.slice(`${PLACEHOLDER_LAST} `.length)
      clipboard.writeText(text)
      await delay(10)
      uIOhook.keyTap(Key.Enter, modifiers)
    } else if (text.endsWith(PLACEHOLDER_LAST)) {
      text = text.slice(0, -PLACEHOLDER_LAST.length)
      clipboard.writeText(text)
      await delay(10)
      uIOhook.keyTap(Key.Enter, modifiers)
      await delay(10)
      uIOhook.keyTap(Key.Home)
      await delay(10)
      // press twice to focus input when using controller
      uIOhook.keyTap(Key.Home)
      await delay(10)
      uIOhook.keyTap(Key.Delete)
    } else {
      clipboard.writeText(text)
      await delay(10)
      uIOhook.keyTap(Key.Enter)
      if (!AUTO_CLEAR.includes(text[0])) {
        await delay(10)
        uIOhook.keyTap(Key.A, modifiers)
      }
    }

    await delay(30)

    uIOhook.keyTap(Key.V, modifiers)
    await delay(10)
    if (send) {
      uIOhook.keyTap(Key.Enter)
      await delay(10)
      // restore the last chat
      uIOhook.keyTap(Key.Enter)
      await delay(10)
      uIOhook.keyTap(Key.ArrowUp)
      await delay(10)
      uIOhook.keyTap(Key.ArrowUp)
      await delay(10)
      uIOhook.keyTap(Key.Escape)
      await delay(10)
    }
  })
}

export function stashSearch (
  text: string,
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  clipboard.restoreShortly(async (clipboard) => {
    overlay.assertGameActive()
    clipboard.writeText(text)

    if (process.platform === 'linux') {
      return (async () => {
        // XWayland/Wine needs focus and non-zero-duration key transitions
        await delay(20)

        uIOhook.keyToggle(Key.Ctrl, 'down')
        try {
          await delay(10)
          uIOhook.keyToggle(Key.F, 'down')
          await delay(10)
          uIOhook.keyToggle(Key.F, 'up')
          await delay(10)
        } finally {
          uIOhook.keyToggle(Key.Ctrl, 'up')
        }

        await delay(10)
        uIOhook.keyTap(Key.V, [Key.Ctrl])
        await delay(10)
        uIOhook.keyTap(Key.Enter)
      })()
    } else {
      uIOhook.keyTap(Key.F, [Key.Ctrl])
      uIOhook.keyTap(Key.V, [process.platform === 'darwin' ? Key.Meta : Key.Ctrl])
      uIOhook.keyTap(Key.Enter)
    }
  })
}
