/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  SetStateAction,
  Dispatch,
} from 'react'

interface LocalStorageListenersType {
  [key: string]: Array<Dispatch<SetStateAction<string>>>
}

const localStorageListeners: LocalStorageListenersType = {}

function useLocalStorageStringState(
  key: string,
  defaultState: string,
): [string | undefined, (newState: string) => void] {
  const state =
    typeof window !== 'undefined'
      ? localStorage.getItem(key) || defaultState
      : defaultState || ''

  const [, notify] = useState(key + '\n' + state)

  useEffect(() => {
    if (!localStorageListeners[key]) {
      localStorageListeners[key] = []
    }
    localStorageListeners[key].push(notify)
    return () => {
      localStorageListeners[key] = localStorageListeners[key].filter(
        (listener) => listener !== notify,
      )
      if (localStorageListeners[key].length === 0) {
        delete localStorageListeners[key]
      }
    }
  }, [key])

  const setState = useCallback<(newState: string | null) => void>(
    (newState) => {
      if (!localStorageListeners[key]) {
        localStorageListeners[key] = []
      }

      if (newState === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, newState)
      }
      localStorageListeners[key].forEach((listener) =>
        listener(key + '\n' + newState),
      )
    },
    [key],
  )

  return [state, setState]
}

export default function useLocalStorageState<T = any>(
  key: string,
  defaultState?: string | number | object | undefined | null | boolean,
): [T, (newState: string | number | object | null | boolean) => void] {
  const [stringState, setStringState] = useLocalStorageStringState(
    key,
    JSON.stringify(defaultState),
  )

  const setState = useCallback(
    (newState: string | number | object | null | boolean) => {
      setStringState(JSON.stringify(newState))
    },
    [setStringState],
  )

  const state: T = useMemo(() => {
    if (stringState) {
      try {
        return JSON.parse(stringState)
      } catch (e) {
        console.log('Error parsing JSON from localStorage', e)
        return stringState
      }
    }
  }, [stringState])

  return [state, setState]
}
