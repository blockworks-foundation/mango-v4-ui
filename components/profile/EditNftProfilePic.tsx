import { useState, useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Button, { LinkButton } from '../shared/Button'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { notify } from 'utils/notifications'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { ImgWithLoader } from '@components/ImgWithLoader'
import useProfileDetails from 'hooks/useProfileDetails'

const EditNftProfilePic = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation(['common', 'profile'])
  const { publicKey, signMessage } = useWallet()
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const nftsLoading = mangoStore((s) => s.wallet.nfts.loading)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const { refetch: refetchProfileDetails } = useProfileDetails()
  const { data: profile } = useProfileDetails()

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
        `${MANGO_DATA_API_URL}/user-data/profile-details`,
        requestOptions,
      )
      if (response.status === 200) {
        await refetchProfileDetails()
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
        `${MANGO_DATA_API_URL}/user-data/profile-details`,
        requestOptions,
      )
      if (response.status === 200) {
        await refetchProfileDetails()
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
            <LinkButton onClick={removeProfileImage}>
              {t('profile:remove')}
            </LinkButton>
          ) : null}
        </div>
      </div>
      {nfts.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-3">
            {nfts.map((n, i) => (
              <button
                className={`col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-2 py-3 sm:py-4 md:hover:bg-th-bkg-3 ${
                  selectedProfile === n.image
                    ? 'border-th-active'
                    : 'border-th-bkg-3'
                }`}
                key={n.image + i}
                onClick={() => setSelectedProfile(n.image)}
              >
                <ImgWithLoader
                  alt={n.name}
                  className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20"
                  src={n.image}
                />
              </button>
            ))}
          </div>
        </div>
      ) : nftsLoading ? (
        <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
          {[...Array(9)].map((x, i) => (
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
