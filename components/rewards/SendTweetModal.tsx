import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import Button from '@components/shared/Button'
import { XIcon } from '@components/icons/XIcon'
import { MegaphoneIcon } from '@heroicons/react/20/solid'

const SendTweetModal = ({ isOpen, onClose }: ModalProps) => {
  const handleTwitterShare = () => {
    const shareText =
      'Another week, another round of @mangomarkets rewards unlocked! #mangorewards'
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}`
    window.open(twitterShareUrl, '_blank')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-th-bkg-3">
          <MegaphoneIcon className="h-6 w-6 -rotate-12" />
        </div>
        <h2 className="mb-2 text-center">Share your win on X</h2>
        <p className="text-center text-base">
          Include the hashtag #mangorewards for the chance to earn bonus
          rewards.
        </p>
        <Button
          className="mt-6 flex w-full items-center justify-center"
          onClick={handleTwitterShare}
          size="large"
        >
          <XIcon className="mr-1.5 h-5 w-5" />
          <span>Send It</span>
        </Button>
      </>
    </Modal>
  )
}

export default SendTweetModal
