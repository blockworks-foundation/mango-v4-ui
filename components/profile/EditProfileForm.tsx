import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { IconButton } from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import Loading from '@components/shared/Loading'
import {
  ExclamationCircleIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/20/solid'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { useWallet } from '@solana/wallet-adapter-react'
import startCase from 'lodash/startCase'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { notify } from 'utils/notifications'
import ProfileImage from './ProfileImage'
import useProfileDetails from 'hooks/useProfileDetails'

const EditProfileForm = ({
  onFinish,
  onEditProfileImage,
  onboarding = false,
}: {
  onFinish: () => void
  onEditProfileImage: () => void
  onboarding?: boolean
}) => {
  const { t } = useTranslation(['profile', 'onboarding'])
  const { data: profile, refetch: refetchProfileDetails } = useProfileDetails()
  const { publicKey, signMessage } = useWallet()
  const [profileName, setProfileName] = useState(
    startCase(profile?.profile_name) || '',
  )
  const [inputError, setInputError] = useState('')
  const [loadUniquenessCheck, setLoadUniquenessCheck] = useState(false)
  const [loadUpdateProfile, setLoadUpdateProfile] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const validateProfileNameUniqueness = async (name: string) => {
    try {
      setLoadUniquenessCheck(true)
      const response = await fetch(
        `${MANGO_DATA_API_URL}/user-data/check-profile-name-unique?profile-name=${name}`,
      )
      const uniquenessCheck = await response.json()

      if (uniquenessCheck) {
        return true
      } else {
        setInputError(t('profile:uniqueness-fail'))
        return false
      }
    } catch {
      setInputError(t('profile:uniqueness-api-fail'))
      return false
    } finally {
      setLoadUniquenessCheck(false)
    }
  }

  const onChangeNameInput = (name: string) => {
    setProfileName(name)
    const re = /^[a-zA-Z0-9 ]*$/gm
    if (!re.test(name)) {
      setInputError(t('profile:invalid-characters'))
    } else {
      setInputError('')
    }
  }

  const saveProfile = async () => {
    setUpdateError('')
    const name = profileName.trim().toLowerCase()
    if (profile?.profile_name === name) {
      onFinish()
      return
    }
    const isUnique = await validateProfileNameUniqueness(name)
    if (!inputError && isUnique) {
      setLoadUpdateProfile(true)
      try {
        if (!publicKey) throw new Error('Wallet not connected!')
        if (!signMessage)
          throw new Error('Wallet does not support message signing!')

        const messageString = JSON.stringify({
          profile_name: name,
          trader_category: profile?.trader_category,
          profile_image_url: profile?.profile_image_url || '',
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
          setLoadUpdateProfile(false)
          await refetchProfileDetails()
          onFinish()
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
    <>
      {updateError ? (
        <div className="py-3">
          <InlineNotification type="error" desc={updateError} />
        </div>
      ) : null}
      {!profile ? (
        <div className="py-3">
          <InlineNotification
            type="error"
            desc={t('profile:profile-api-error')}
          />
        </div>
      ) : null}
      <div className="my-6 flex justify-center">
        <div className="relative ">
          <IconButton
            className="absolute -right-2 -top-2 bg-th-button md:hover:bg-th-button-hover"
            size="small"
            onClick={onEditProfileImage}
            disabled={!profile}
          >
            {profile?.profile_image_url ? (
              <PencilIcon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </IconButton>
          <ProfileImage imageSize="80" placeholderSize="48" isOwnerProfile />
        </div>
      </div>
      <div className={onboarding ? 'pb-10' : 'pb-6'}>
        <Label text={t('profile:profile-name')} />
        <Input
          type="text"
          hasError={!!inputError.length}
          value={profileName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChangeNameInput(e.target.value)
          }
          maxLength={20}
        />
        {inputError ? (
          <div className="mt-1.5 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
            <p className="mb-0 text-xs text-th-down">{inputError}</p>
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
        className={`flex ${
          onboarding ? 'w-44' : 'w-full'
        } items-center justify-center`}
        disabled={
          !!Object.keys(inputError).length ||
          loadUniquenessCheck ||
          !profileName ||
          !profile
        }
        onClick={saveProfile}
        size="large"
      >
        {loadUniquenessCheck || loadUpdateProfile ? (
          <Loading />
        ) : onboarding ? (
          t('onboarding:save-finish')
        ) : (
          t('profile:save-profile')
        )}
      </Button>
    </>
  )
}

export default EditProfileForm
