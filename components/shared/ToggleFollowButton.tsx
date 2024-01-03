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
import useFollowedAccounts from 'hooks/useFollowedAccounts'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { FollowedAccountApi } from '@components/explore/FollowedAccounts'
import Loading from './Loading'

const toggleFollowAccount = async (
  type: string,
  mangoAccountPk: string,
  publicKey: PublicKey | null,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  refetch: <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
  ) => Promise<QueryObserverResult>,
  setLoading: (loading: boolean) => void,
) => {
  try {
    if (!publicKey) throw new Error('Wallet not connected!')
    if (!signMessage) throw new Error('Wallet does not support message signing')

    setLoading(true)
    const messageObject = {
      mango_account: mangoAccountPk,
      action: type,
    }

    const messageString = JSON.stringify(messageObject)
    const message = new TextEncoder().encode(messageString)
    const signature = await signMessage(message)

    const isPost = type === 'insert'
    const method = isPost ? 'POST' : 'DELETE'

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
    }
  } catch {
    notify({ type: 'error', title: 'Failed to follow account' })
  } finally {
    setLoading(false)
  }
}

const ToggleFollowButton = ({
  accountPk,
  showText,
}: {
  accountPk: string
  showText?: boolean
}) => {
  const { t } = useTranslation('account')
  const { publicKey, signMessage } = useWallet()
  const { data: followedAccounts, refetch: refetchFollowedAccounts } =
    useFollowedAccounts()
  const [loading, setLoading] = useState(false)

  const [isFollowed, type] = useMemo(() => {
    if (!followedAccounts || !followedAccounts.length) return [false, 'insert']
    const followed = followedAccounts.find(
      (acc: FollowedAccountApi) => acc.mango_account === accountPk,
    )
    if (followed) {
      return [true, 'delete']
    } else return [false, 'insert']
  }, [accountPk, followedAccounts])

  const disabled =
    !accountPk ||
    loading ||
    !publicKey ||
    !signMessage ||
    (!isFollowed && followedAccounts && followedAccounts?.length >= 10)

  return (
    <Tooltip
      content={
        !publicKey
          ? t('account:tooltip-connect-to-follow')
          : !isFollowed && followedAccounts && followedAccounts?.length >= 10
          ? t('account:tooltip-follow-max-reached')
          : showText
          ? ''
          : isFollowed
          ? t('account:tooltip-unfollow-account')
          : t('account:tooltip-follow-account')
      }
    >
      <button
        className="flex items-center focus:outline-none disabled:opacity-50 md:hover:text-th-fgd-3"
        disabled={disabled}
        onClick={() =>
          toggleFollowAccount(
            type,
            accountPk,
            publicKey,
            signMessage!,
            refetchFollowedAccounts,
            setLoading,
          )
        }
      >
        {loading ? (
          <Loading />
        ) : isFollowed ? (
          <FilledStarIcon className="h-5 w-5 text-th-active" />
        ) : (
          <StarIcon className="h-5 w-5 text-th-fgd-3" />
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
