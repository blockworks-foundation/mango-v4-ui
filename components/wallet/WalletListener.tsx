import { useEffect } from 'react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { Wallet as AnchorWallet } from '@project-serum/anchor'
import { notify } from '../../utils/notifications'

export const handleWalletConnect = (wallet: Wallet) => {
  if (!wallet) {
    return
  }
  const actions = mangoStore.getState().actions

  wallet?.adapter
    ?.connect()
    .then(async () => {
      await actions.connectMangoClientWithWallet(wallet)
      onConnectFetchWalletData(wallet)
    })
    .catch((e) => {
      if (e.name.includes('WalletLoadError')) {
        notify({
          title: `${wallet.adapter.name} Error`,
          type: 'error',
          description: `Please install ${wallet.adapter.name} and then reload this page.`,
        })
      }
    })
}

const onConnectFetchWalletData = async (wallet: Wallet) => {
  if (!wallet) return
  const actions = mangoStore.getState().actions
  const set = mangoStore.getState().set
  const mangoAccounts = mangoStore.getState().mangoAccounts.accounts
  await actions.fetchMangoAccounts(wallet.adapter as unknown as AnchorWallet)

  if (mangoAccounts.length) {
    actions.fetchMangoAccount(
      wallet.adapter as unknown as AnchorWallet,
      mangoAccounts[0].accountNum
    )
  } else {
    set((s) => {
      s.mangoAccount.loading = false
    })
  }

  actions.fetchProfilePicture(wallet.adapter as unknown as AnchorWallet)
  actions.fetchWalletTokens(wallet.adapter as unknown as AnchorWallet)
}

const WalletListener = () => {
  const { disconnecting } = useWallet()

  useEffect(() => {
    const setStore = mangoStore.getState().set
    if (disconnecting) {
      setStore((state) => {
        state.mangoAccount.current = undefined
      })
    }
  }, [disconnecting])

  return null
}

export default WalletListener
