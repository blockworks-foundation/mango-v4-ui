import useMangoAccount from './useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { WHITE_LIST_API } from 'utils/constants'
import useMangoGroup from './useMangoGroup'
import { useCallback, useMemo } from 'react'

export default function useAnalytics() {
  const { group } = useMangoGroup()
  const { mangoAccountAddress, mangoAccount } = useMangoAccount()
  const { publicKey } = useWallet()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ignoredMints = [
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    'So11111111111111111111111111111111111111112',
    'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    '7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn',
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
  ]
  const banks = useMemo(() => {
    return group && mangoAccount
      ? [...group.banksMapByMint.values()].filter(
          (x) =>
            x.length &&
            x[0] &&
            x[0].collateralFeePerDay > 0 &&
            !ignoredMints.includes(x[0].mint.toBase58()) &&
            mangoAccount.getTokenBalanceUi(x[0]) * x[0].uiPrice > 10000,
        )
      : []
  }, [group, ignoredMints, mangoAccount])

  const sendAnalytics = useCallback(
    async (data: object, tag: string) => {
      if (
        publicKey?.toBase58() &&
        tag &&
        data &&
        mangoAccountAddress &&
        banks.length
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
    [banks, mangoAccountAddress, publicKey],
  )

  return {
    sendAnalytics,
  }
}
