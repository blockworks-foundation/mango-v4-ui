import { useState } from 'react'
import HotKeysDrawer from './HotKeysDrawer'
import KeyboardIcon from '@components/icons/KeyboardIcon'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'react-i18next'

const HotKeysDrawerButton = () => {
  const { t } = useTranslation('settings')
  const [showDraw, setShowDraw] = useState(false)

  const toggleModal = () => {
    setShowDraw(!showDraw)
  }

  return (
    <>
      <Tooltip content={t('settings:hot-keys')}>
        <button
          className="hidden text-th-fgd-3 focus-visible:bg-th-bkg-3 md:flex md:h-12 md:w-12 md:items-center md:justify-center md:border-x md:border-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={() => toggleModal()}
        >
          <KeyboardIcon className="h-6 w-6" />
          <span className="sr-only">Hot Keys</span>
        </button>
      </Tooltip>
      <HotKeysDrawer isOpen={showDraw} onClose={toggleModal} />
    </>
  )
}

export default HotKeysDrawerButton
