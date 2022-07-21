import { Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import { ModalProps } from '../../types/modal'
import { PROFILE_CATEGORIES } from '../../utils/profile'
import Input from '../forms/Input'
import Label from '../forms/Label'
import Select from '../forms/Select'
import Button, { LinkButton } from '../shared/Button'
import InlineNotification from '../shared/InlineNotification'
import Modal from '../shared/Modal'
import useLocalStorageState from '../../hooks/useLocalStorageState'

export const SKIP_ACCOUNT_SETUP_KEY = 'skipAccountSetup'

const UserSetupModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation()
  const [profileName, setProfileName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [profileCategory, setProfileCategory] = useState('')
  const [showAccountSetup, setShowAccountSetup] = useState(false)
  const [, setSkipAccountSetup] = useLocalStorageState(SKIP_ACCOUNT_SETUP_KEY)

  const handleSaveProfile = () => {
    // save profile details to db...

    setShowAccountSetup(true)
  }

  const handleUserSetup = () => {
    // create account
  }

  const handleSkipAccountSetup = () => {
    setSkipAccountSetup(true)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <>
        <div className="pb-4">
          <h2 className="mb-1">Create Profile</h2>
          <p>
            This is your Mango Identity and is used on our leaderboard and chat
          </p>
        </div>
        <div className="pb-4">
          <Label text="Profile Name" />
          <Input
            type="text"
            placeholder="e.g. Bill Hwang"
            value={profileName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setProfileName(e.target.value)
            }
          />
        </div>
        <div className="pb-6">
          <Label text="Profile Category" />
          <Select
            value={profileCategory}
            onChange={(cat: string) => setProfileCategory(cat)}
            className="w-full"
          >
            {PROFILE_CATEGORIES.map((cat) => (
              <Select.Option key={cat} value={cat}>
                {cat}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Button onClick={handleSaveProfile} size="large">
            Save Profile
          </Button>
          <LinkButton onClick={() => setShowAccountSetup(true)}>
            I'll do this later
          </LinkButton>
        </div>
      </>
      <Transition
        appear={true}
        className="thin-scroll absolute top-0 left-0 z-20 h-full w-full bg-th-bkg-1 p-6"
        show={showAccountSetup}
        enter="transition-all ease-in duration-500"
        enterFrom="transform translate-x-full"
        enterTo="transform translate-x-0"
        leave="transition-all ease-out duration-500"
        leaveFrom="transform translate-x-0"
        leaveTo="transform translate-x-full"
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="pb-4">
              <h2 className="mb-1">Account Setup</h2>
              <p>You need a Mango Account to get started</p>
            </div>
            <div className="pb-4">
              {/* Not sure if we need to name the first account or if every users first account should have the same name "Main Account" or something similar */}
              <Label text="Account Name" />
              <Input
                type="text"
                placeholder="e.g. Degen Account"
                value={accountName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAccountName(e.target.value)
                }
              />
            </div>
            <InlineNotification type="info" desc={t('insufficient-sol')} />
          </div>
          <div className="flex items-center justify-between">
            <Button onClick={handleUserSetup} size="large">
              Let's Go
            </Button>
            <LinkButton onClick={() => handleSkipAccountSetup()}>
              I'll do this later
            </LinkButton>
          </div>
        </div>
      </Transition>
    </Modal>
  )
}

export default UserSetupModal
