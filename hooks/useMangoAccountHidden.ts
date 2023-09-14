import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'
import useMangoAccount from './useMangoAccount'

const fetchMangoAccountHidden = async (mangoAccountAddress: string) => {
  try {
    const hideResponse = await fetch(
      `${MANGO_DATA_API_URL}/user-data/account-hidden?mango-account=${mangoAccountAddress}`,
    )
    const res = await hideResponse.json()
    return res?.hidden ?? false
  } catch (e) {
    console.error('Failed to fetch mango account privacy', e)
  }
}

export function useMangoAccountHidden() {
  const { mangoAccountAddress } = useMangoAccount()

  const {
    data: accountHidden,
    isLoading: loadingAccountHidden,
    refetch,
  } = useQuery(
    ['account-hidden', mangoAccountAddress],
    () => fetchMangoAccountHidden(mangoAccountAddress),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  return {
    accountHidden,
    loadingAccountHidden,
    refetch,
  }
}

export const toggleMangoAccountHidden = async (
  mangoAccountPk: PublicKey,
  walletPk: PublicKey,
  hidden: boolean,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) => {
  try {
    let messageObject = {
      mango_account_pk: mangoAccountPk.toString(),
      wallet_pk: walletPk.toString(),
      hidden: hidden,
    }
    const messageString = JSON.stringify(messageObject)
    const message = new TextEncoder().encode(messageString)
    const signature = await signMessage(message)
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_pk: walletPk.toString(),
        message: messageString,
        signature: bs58.encode(signature),
      }),
    }
    return fetch(
      `${MANGO_DATA_API_URL}/user-data/account-hidden`,
      requestOptions,
    )
  } catch (e) {
    console.error('Failed to toggle mango account privacy', e)
  }
}
