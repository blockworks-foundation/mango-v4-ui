import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import EditNftProfilePic from '@components/profile/EditNftProfilePic'
import { EnterBottomExitBottom } from '@components/shared/Transitions'
import EditProfileForm from '@components/profile/EditProfileForm'

const EditProfileModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'profile'])
  const [showEditProfilePic, setShowEditProfilePic] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <h2 className="text-center">{t('profile:edit-profile')}</h2>
        <EditProfileForm
          onFinish={onClose}
          onEditProfileImage={() => setShowEditProfilePic(true)}
        />
        <EnterBottomExitBottom
          className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
          show={showEditProfilePic}
        >
          <EditNftProfilePic onClose={() => setShowEditProfilePic(false)} />
        </EnterBottomExitBottom>
      </>
    </Modal>
  )
}

export default EditProfileModal
