import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { IconButton } from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import Loading from '@components/shared/Loading'
import { ExclamationCircleIcon, PencilIcon } from '@heroicons/react/20/solid'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import { startCase } from 'lodash'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import { notify } from 'utils/notifications'
import ProfileImage from './ProfileImage'

const EditProfileForm = ({
  onFinish,
  onEditProfileImage,
}: {
  onFinish: () => void
  onEditProfileImage: () => void
}) => {
  const { t } = useTranslation('profile')
  const profile = mangoStore((s) => s.profile.details)
  const { publicKey, signMessage } = useWallet()
  const [profileName, setProfileName] = useState(
    startCase(profile?.profile_name) || ''
  )
  const [inputErrors, setInputErrors] = useState({})
  const [loadUniquenessCheck, setLoadUniquenessCheck] = useState(false)
  const [loadUpdateProfile, setLoadUpdateProfile] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const actions = mangoStore((s) => s.actions)

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
      onFinish()
      return
    }
    await validateProfileName(name)
    if (!Object.keys(inputErrors).length) {
      setLoadUpdateProfile(true)
      try {
        if (!publicKey) throw new Error('Wallet not connected!')
        if (!signMessage)
          throw new Error('Wallet does not support message signing!')

        const messageString = JSON.stringify({
          profile_name: name,
          trader_category: profile?.trader_category,
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
      <div className="my-6 flex justify-center">
        <div className="relative ">
          <IconButton
            className="absolute -top-1 -right-1"
            size="small"
            onClick={onEditProfileImage}
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
    </>
  )
}

export default EditProfileForm
