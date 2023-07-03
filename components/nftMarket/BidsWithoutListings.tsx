import Button from '@components/shared/Button'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import MyBidsModal from './MyBidsModal'

const BidsWithoutListings = () => {
  const { t } = useTranslation(['nftMarket'])
  const [myBidsModal, setMyBidsModal] = useState(false)

  return (
    <div className="flex flex-col">
      <div className="mr-5 flex space-x-4 p-4">
        <Button onClick={() => setMyBidsModal(true)}>{t('my-bids')}</Button>
        {myBidsModal && (
          <MyBidsModal
            isOpen={myBidsModal}
            onClose={() => setMyBidsModal(false)}
          ></MyBidsModal>
        )}
      </div>
    </div>
  )
}

export default BidsWithoutListings
