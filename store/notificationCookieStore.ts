import produce from 'immer'
import Cookies from 'js-cookie'
import create from 'zustand'

type INotificationCookieStore = {
  currentToken: string
  set: (x: (x: INotificationCookieStore) => void) => void
  updateCookie: (wallet?: string) => void
  removeCookie: (wallet: string) => void
  setCookie: (wallet: string, token: string) => void
}

const NotificationCookieStore = create<INotificationCookieStore>(
  (set, get) => ({
    currentToken: '',
    set: (fn) => set(produce(fn)),
    updateCookie: async (wallet?: string) => {
      const set = get().set
      const token = wallet ? getWalletToken(wallet) : ''
      set((state) => {
        state.currentToken = token
      })
    },
    removeCookie: async (wallet: string) => {
      const set = get().set
      if (getWalletToken(wallet)) {
        removeWalletToken(wallet)
        set((state) => {
          state.currentToken = ''
        })
      }
    },
    setCookie: async (wallet: string, token: string) => {
      const set = get().set
      setWalletToken(wallet, token)
      set((state) => {
        state.currentToken = token
      })
    },
  })
)

export default NotificationCookieStore

const cookieName = 'authToken-'

const getWalletToken = (wallet: string) => {
  const token = Cookies.get(`${cookieName}${wallet}`)
  return token || ''
}

const removeWalletToken = (wallet: string) => {
  Cookies.remove(`${cookieName}${wallet}`)
}

const setWalletToken = (wallet: string, token: string) => {
  Cookies.set(`${cookieName}${wallet}`, token, {
    secure: false,
    sameSite: 'strict',
    expires: 90,
  })
}
