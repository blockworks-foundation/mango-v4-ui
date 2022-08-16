import { useState, useEffect } from 'react'
import mangoStore from '../../store/state'
import { useWallet } from '@solana/wallet-adapter-react'
import { PhotographIcon } from '@heroicons/react/solid'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import Button, { LinkButton } from '../shared/Button'
import { ModalProps } from '../../types/modal'
import useLocalStorageState from '../../hooks/useLocalStorageState'

const ImgWithLoader = (props: any) => {
  const [isLoading, setIsLoading] = useState(true)
  return (
    <div className="relative">
      {isLoading && (
        <PhotographIcon className="absolute left-1/2 top-1/2 z-10 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 animate-pulse text-th-fgd-4" />
      )}
      <img {...props} onLoad={() => setIsLoading(false)} alt="" />
    </div>
  )
}

const NftProfilePicModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const connection = mangoStore((s) => s.connection)
  const { publicKey, wallet } = useWallet()
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const nftsLoading = mangoStore((s) => s.wallet.nfts.loading)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const actions = mangoStore((s) => s.actions)

  // update this to save the image url to our user db
  const [profileImageUrl, setProfileImageUrl] =
    useLocalStorageState('profileImageUrl')

  useEffect(() => {
    if (publicKey) {
      actions.fetchNfts(connection, publicKey)
    }
  }, [publicKey, actions, connection])

  useEffect(() => {
    if (profileImageUrl) {
      setSelectedProfile(profileImageUrl)
    }
  }, [profileImageUrl])

  const handleSaveProfilePic = () => {
    if (!publicKey || !selectedProfile || !wallet) {
      return
    }
    setProfileImageUrl(selectedProfile)
  }

  const handleRemoveProfilePic = async () => {
    if (!publicKey || !wallet) {
      return
    }
    setProfileImageUrl('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-3 flex w-full flex-col items-center sm:mt-3 sm:flex-row sm:justify-between">
        <h2>{t('edit-profile-image')}</h2>
        <div className="mt-3 flex items-center space-x-4 sm:mt-0">
          <Button
            disabled={!selectedProfile}
            onClick={() => handleSaveProfilePic()}
          >
            {t('save')}
          </Button>
          {profileImageUrl ? (
            <LinkButton
              className="text-xs"
              onClick={() => handleRemoveProfilePic()}
            >
              {t('remove')}
            </LinkButton>
          ) : null}
        </div>
      </div>
      {nfts.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
            {nfts.map((n) => {
              return (
                <button
                  className={`default-transitions col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-3 py-3 sm:py-4 md:hover:bg-th-bkg-4 ${
                    selectedProfile === n.image
                      ? 'border-th-primary'
                      : 'border-th-bkg-3'
                  }`}
                  key={n.address}
                  onClick={() => setSelectedProfile(n.image)}
                >
                  <ImgWithLoader
                    className="h-16 w-16 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
                    src={n.image}
                  />
                </button>
              )
            })}
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
        <p className="text-center">{t('no-nfts')}</p>
      )}
    </Modal>
  )
}

export default NftProfilePicModal
