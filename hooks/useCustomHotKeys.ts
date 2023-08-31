import { HotKey } from '@components/settings/HotKeysSettings'
import { useHotkeys } from 'react-hotkeys-hook'

export const useCustomHotkeys = (
  hotkeys: HotKey[],
  handleHotkeyAction: (hotkey: HotKey) => void,
) => {
  hotkeys.forEach((hotkey: HotKey) => {
    const { keySequence } = hotkey

    useHotkeys(
      keySequence,
      (event) => {
        event.preventDefault()
        handleHotkeyAction(hotkey)
      },
      {
        keydown: true,
      },
    )
  })
}
