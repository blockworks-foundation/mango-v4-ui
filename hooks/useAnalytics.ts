import useMangoAccount from './useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { WHITE_LIST_API } from 'utils/constants'

export default function useFilledOrders() {
  const { mangoAccountAddress } = useMangoAccount()
  const { publicKey } = useWallet()

  const sendAnalytics = async (data: object, tag: string) => {
    if (publicKey?.toBase58() && tag && data && mangoAccountAddress) {
      const enchantedData = JSON.stringify({
        mangoAccountAddress: mangoAccountAddress,
        ...data,
      })

      await fetch(`${WHITE_LIST_API}analytics/add`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          data: enchantedData,
          tag: tag,
        }),
      })
    } else {
      console.log('Param missing for analytics', {
        publicKey,
        mangoAccountAddress,
        data,
        tag,
      })
    }
  }
  return {
    sendAnalytics,
  }
}
