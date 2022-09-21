import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import { useWallet } from '@solana/wallet-adapter-react'
import Button, { IconButton } from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import {
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { startCase } from 'lodash'
import Label from '@components/forms/Label'
import Input from '@components/forms/Input'
import Select from '@components/forms/Select'
import ProfileImage from '@components/shared/ProfileImage'
import EditNftProfilePic from '@components/EditNftProfilePic'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import Loading from '@components/shared/Loading'
import InlineNotification from '@components/shared/InlineNotification'
import { EnterBottomExitBottom } from '@components/shared/Transitions'

const TRADER_CATEGORIES = [
  'day-trader',
  'degen',
  'discretionary',
  'market-maker',
  'swing-trader',
  'trader',
  'yolo',
]

const EditProfileModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'profile'])
  const profile = mangoStore((s) => s.profile.details)
  const { publicKey, signMessage } = useWallet()
  const [profileName, setProfileName] = useState(
    startCase(profile?.profile_name) || ''
  )
  const [traderCategory, setTraderCategory] = useState(
    profile?.trader_category || TRADER_CATEGORIES[5]
  )
  const [inputErrors, setInputErrors] = useState({})
  const [loadUniquenessCheck, setLoadUniquenessCheck] = useState(false)
  const [loadUpdateProfile, setLoadUpdateProfile] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const actions = mangoStore((s) => s.actions)
  const [showEditProfilePic, setShowEditProfilePic] = useState(false)

  const validateProfileName = async (name: string) => {
    const re = /^([a-zA-Z0-9]+\s)*[a-zA-Z0-9]+$/
    if (!re.test(name)) {
      setInputErrors({
        ...inputErrors,
        regex: t('profile:invalid-characters'),
      })
    }
    if (name.length > 29) {
      setInputErrors({
        ...inputErrors,
        length: t('profile:length-error'),
      })
    }
    try {
      setLoadUniquenessCheck(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v4/user-data/check-profile-name-unique?profile-name=${name.toLowerCase()}`
      )
      const uniquenessCheck = await response.json()

      if (response.status === 200 && !uniquenessCheck) {
        setInputErrors({
          ...inputErrors,
          uniqueness: t('profile:uniqueness-fail'),
        })
      }
    } catch {
      setInputErrors({
        ...inputErrors,
        api: t('profile:uniqueness-api-fail'),
      })
    } finally {
      setLoadUniquenessCheck(false)
    }
  }

  const onChangeNameInput = (name: string) => {
    setProfileName(name)
    setInputErrors({})
  }

  const saveProfile = async () => {
    setUpdateError('')
    const name = profileName.toLowerCase()
    if (profile?.profile_name === name) {
      onClose()
      return
    }
    await validateProfileName(name)
    if (Object.keys(inputErrors).length) {
      setLoadUpdateProfile(true)
      try {
        if (!publicKey) throw new Error('Wallet not connected!')
        if (!signMessage)
          throw new Error('Wallet does not support message signing!')

        const messageString = JSON.stringify({
          profile_name: name,
          trader_category: traderCategory,
          profile_image_url: profile?.profile_image_url,
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
          setLoadUpdateProfile(false)
          await actions.fetchProfileDetails(publicKey.toString())
          onClose()
          notify({
            type: 'success',
            title: t('profile:profile-update-success'),
          })
        }
      } catch {
        setLoadUpdateProfile(false)
        setUpdateError(t('profile:profile-update-fail'))
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <h2 className="text-center">{t('profile:edit-profile')}</h2>
        {updateError ? (
          <div className="py-3">
            <InlineNotification type="error" desc={updateError} />
          </div>
        ) : null}
        <div className="my-6 flex justify-center">
          <div className="relative ">
            <IconButton
              className="absolute -top-1 -right-1"
              size="small"
              onClick={() => setShowEditProfilePic(true)}
            >
              <PencilIcon className="h-4 w-4" />
            </IconButton>
            <ProfileImage imageSize="80" placeholderSize="48" isOwnerProfile />
          </div>
        </div>
        <div className="pb-6">
          <Label text={t('profile:profile-name')} />
          <Input
            type="text"
            error={Object.keys(inputErrors).length}
            value={profileName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChangeNameInput(e.target.value)
            }
          />
          {Object.keys(inputErrors).length ? (
            <div className="mt-1.5 flex items-center space-x-1">
              <ExclamationCircleIcon className="h-4 w-4 text-th-red" />
              <p className="mb-0 text-xs text-th-red">
                {Object.values(inputErrors).toString()}
              </p>
            </div>
          ) : null}
        </div>
        {/* <div className="pb-6">
            <Label text={t('profile:trader-category')} />
            <Select
              value={t(`profile:${traderCategory}`)}
              onChange={(cat) => setTraderCategory(cat)}
              className="w-full"
            >
              {TRADER_CATEGORIES.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  <div className="flex w-full items-center justify-between">
                    {t(`profile:${cat}`)}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div> */}
        <Button
          className="flex w-full items-center justify-center"
          disabled={
            !!Object.keys(inputErrors).length ||
            loadUniquenessCheck ||
            !profileName
          }
          onClick={saveProfile}
          size="large"
        >
          {loadUniquenessCheck || loadUpdateProfile ? (
            <Loading />
          ) : (
            t('profile:save-profile')
          )}
        </Button>
        <EnterBottomExitBottom
          className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6"
          show={showEditProfilePic}
        >
          <EditNftProfilePic onClose={() => setShowEditProfilePic(false)} />
        </EnterBottomExitBottom>
      </>
    </Modal>
  )
}

export default EditProfileModal
