/* eslint-disable @typescript-eslint/no-explicit-any */
import { HotKey } from '@components/settings/HotKeysSettings'
import { useHotkeys } from 'react-hotkeys-hook'
import useLocalStorageState from './useLocalStorageState'
import { HOT_KEYS_KEY } from 'utils/constants'
import { useCallback } from 'react'

export const useCustomHotkeys = (
  handleHotkeyAction: (hotkey: HotKey) => void,
) => {
  const [hotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])

  const handleHotkey = useCallback(
    (keyboardEvent: any) => {
      const pressedKeySequence = [
        keyboardEvent.ctrlKey ? 'ctrl' : '',
        keyboardEvent.shiftKey ? 'shift' : '',
        keyboardEvent.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+')

      const matchedHotkey = hotKeys.find(
        (hotkey: HotKey) => hotkey.keySequence === pressedKeySequence,
      )

      if (matchedHotkey) {
        handleHotkeyAction(matchedHotkey)
      }
    },
    [hotKeys, handleHotkeyAction],
  )

  useHotkeys('*', handleHotkey)
}
