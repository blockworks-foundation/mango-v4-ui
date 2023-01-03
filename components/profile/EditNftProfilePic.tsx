import { useState, useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Button, { LinkButton } from '../shared/Button'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { notify } from 'utils/notifications'

const ImgWithLoader = (props: any) => {
  const [isLoading, setIsLoading] = useState(true)
  return (
    <div className="relative">
      {isLoading && (
        <PhotoIcon className="absolute left-1/2 top-1/2 z-10 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 animate-pulse text-th-fgd-4" />
      )}
      <img {...props} onLoad={() => setIsLoading(false)} alt="" />
    </div>
  )
}

const EditNftProfilePic = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation(['common', 'profile'])
  const { publicKey, signMessage } = useWallet()
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const nftsLoading = mangoStore((s) => s.wallet.nfts.loading)
  const connection = mangoStore((s) => s.connection)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const actions = mangoStore.getState().actions
  const profile = mangoStore((s) => s.profile.details)

  useEffect(() => {
    if (publicKey) {
      actions.fetchNfts(connection, publicKey)
    }
  }, [publicKey])

  useEffect(() => {
    if (profile?.profile_image_url) {
      setSelectedProfile(profile.profile_image_url)
    }
  }, [profile])

  const saveProfileImage = async () => {
    const name = profile?.profile_name.toLowerCase()
    const traderCategory = profile?.trader_category
    try {
      if (!publicKey) throw new Error('Wallet not connected!')
      if (!signMessage)
        throw new Error('Wallet does not support message signing!')

      const messageString = JSON.stringify({
        profile_name: name,
        trader_category: traderCategory,
        profile_image_url: selectedProfile,
      })
      const message = new TextEncoder().encode(messageString)
      const signature = await signMessage(message)

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_pk: publicKey.toString(),
          message: messageString,
          signature: bs58.encode(signature),
        }),
      }
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v4/user-data/profile-details',
        requestOptions
      )
      if (response.status === 200) {
        await actions.fetchProfileDetails(publicKey.toString())
        notify({
          type: 'success',
          title: t('profile:profile-pic-success'),
        })
      }
    } catch {
      notify({
        type: 'success',
        title: t('profile:profile:profile-pic-failure'),
      })
    } finally {
      onClose()
    }
  }

  const removeProfileImage = async () => {
    const name = profile?.profile_name.toLowerCase()
    const traderCategory = profile?.trader_category
    try {
      if (!publicKey) throw new Error('Wallet not connected!')
      if (!signMessage)
        throw new Error('Wallet does not support message signing!')

      const messageString = JSON.stringify({
        profile_name: name,
        trader_category: traderCategory,
        profile_image_url: '',
      })
      const message = new TextEncoder().encode(messageString)
      const signature = await signMessage(message)

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_pk: publicKey.toString(),
          message: messageString,
          signature: bs58.encode(signature),
        }),
      }
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v4/user-data/profile-details',
        requestOptions
      )
      if (response.status === 200) {
        await actions.fetchProfileDetails(publicKey.toString())
        notify({
          type: 'success',
          title: t('profile:profile-pic-remove-success'),
        })
      }
    } catch {
      notify({
        type: 'success',
        title: t('profile:profile-pic-remove-failure'),
      })
    } finally {
      onClose()
    }
  }

  return (
    <>
      <div className="mb-3 flex w-full flex-col items-center sm:mt-3 sm:flex-row sm:justify-between">
        <button
          onClick={onClose}
          className={`absolute left-2 top-3 z-40 text-th-fgd-4 focus:outline-none md:hover:text-th-active`}
        >
          <ArrowLeftIcon className={`h-5 w-5`} />
        </button>
        <h2>{t('profile:choose-profile')}</h2>
        <div className="mt-3 flex items-center space-x-4 sm:mt-0">
          <Button disabled={!selectedProfile} onClick={saveProfileImage}>
            {t('save')}
          </Button>
          {profile?.profile_image_url ? (
            <LinkButton className="text-sm" onClick={removeProfileImage}>
              {t('profile:remove')}
            </LinkButton>
          ) : null}
        </div>
      </div>
      {nfts.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-3">
            {nfts.map((n) => (
              <button
                className={`default-transition col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-2 py-3 sm:py-4 md:hover:bg-th-bkg-3 ${
                  selectedProfile === n.image
                    ? 'border-th-active'
                    : 'border-th-bkg-3'
                }`}
                key={n.image}
                onClick={() => setSelectedProfile(n.image)}
              >
                <ImgWithLoader
                  className="h-16 w-16 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
                  src={n.image}
                />
              </button>
            ))}
          </div>
        </div>
      ) : nftsLoading ? (
        <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
          {[...Array(9)].map((i) => (
            <div
              className="col-span-1 h-[90px] animate-pulse rounded-md bg-th-bkg-3 sm:h-28"
              key={i}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center">
          <p>{t('profile:no-nfts')}</p>
        </div>
      )}
    </>
  )
}

export default EditNftProfilePic
