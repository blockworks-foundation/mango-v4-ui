import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { PublicKey } from '@solana/web3.js'
import {
  QueryObserverResult,
  RefetchOptions,
  RefetchQueryFilters,
} from '@tanstack/react-query'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { notify } from 'utils/notifications'
import { StarIcon as FilledStarIcon } from '@heroicons/react/20/solid'
import { StarIcon } from '@heroicons/react/24/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import useFollowedAccounts from 'hooks/useFollowedAccounts'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'

const toggleFollowAccount = async (
  type: 'insert' | 'delete',
  mangoAccountPk: string,
  publicKey: PublicKey | null,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  refetch: <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
  ) => Promise<QueryObserverResult>,
) => {
  try {
    if (!publicKey) throw new Error('Wallet not connected!')
    if (!signMessage) throw new Error('Wallet does not support message signing')

    const messageObject = {
      mango_account: mangoAccountPk,
      action: type,
    }

    const messageString = JSON.stringify(messageObject)
    const message = new TextEncoder().encode(messageString)
    const signature = await signMessage(message)

    const method = type === 'insert' ? 'POST' : 'DELETE'

    const requestOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_pk: publicKey.toString(),
        message: messageString,
        signature: bs58.encode(signature),
      }),
    }
    const response = await fetch(
      `${MANGO_DATA_API_URL}/user-data/following`,
      requestOptions,
    )
    if (response.status === 200) {
      await refetch()
      notify({ type: 'success', title: 'Account followed' })
    }
  } catch {
    notify({ type: 'error', title: 'Failed to follow account' })
  }
}

const ToggleFollowButton = ({
  isFollowed,
  showText,
}: {
  isFollowed: boolean
  showText?: boolean
}) => {
  const { t } = useTranslation('account')
  const { publicKey, signMessage } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const { refetch: refetchFollowedAccounts } = useFollowedAccounts()
  const type = isFollowed ? 'delete' : 'insert'
  return (
    <Tooltip
      content={
        showText
          ? ''
          : isFollowed
          ? t('account:tooltip-unfollow-account')
          : t('account:tooltip-follow-account')
      }
    >
      <button
        className="flex items-center focus:outline-none md:hover:text-th-fgd-3"
        disabled={!mangoAccountAddress || !publicKey || !signMessage}
        onClick={() =>
          toggleFollowAccount(
            type,
            mangoAccountAddress,
            publicKey,
            signMessage!,
            refetchFollowedAccounts,
          )
        }
      >
        {isFollowed ? (
          <FilledStarIcon className="h-5 w-5 text-th-active" />
        ) : (
          <StarIcon className="h-4 w-4 text-th-fgd-3" />
        )}
        {showText ? (
          <span className="ml-1.5">
            {isFollowed ? t('unfollow') : t('follow')}
          </span>
        ) : null}
      </button>
    </Tooltip>
  )
}

export default ToggleFollowButton
