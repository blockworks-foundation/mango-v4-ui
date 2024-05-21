import useMangoAccount from './useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { WHITE_LIST_API } from 'utils/constants'
import useMangoGroup from './useMangoGroup'
import { PublicKey } from '@metaplex-foundation/js'
import { useCallback } from 'react'

export default function useAnalytics() {
  const { group } = useMangoGroup()
  const { mangoAccountAddress, mangoAccount } = useMangoAccount()
  const { publicKey } = useWallet()
  const analyticsTokenBank = group?.getFirstBankByMint(
    new PublicKey('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
  )
  const val =
    mangoAccount && analyticsTokenBank
      ? mangoAccount.getTokenBalanceUi(analyticsTokenBank) *
        analyticsTokenBank.uiPrice
      : 0
  const sendAnalytics = useCallback(
    async (data: object, tag: string) => {
      if (
        publicKey?.toBase58() &&
        tag &&
        data &&
        mangoAccountAddress &&
        val >= 10000
      ) {
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
      }
    },
    [val, mangoAccountAddress, publicKey],
  )

  return {
    sendAnalytics,
  }
}
