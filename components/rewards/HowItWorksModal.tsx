import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'

const HowItWorksModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-center">How it Works</h2>
      <div className="space-y-5">
        <div className="flex flex-col items-center">
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3">
            <span className="font-display text-base text-th-active">1</span>
          </div>
          <h3 className="text-base">Earning Tickets</h3>
          <p className="text-center">
            Trade and swap on Mango to earn tickets to the weekly draws. The
            more tickets you have the better your chance of winning a prize.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3">
            <span className="font-display text-base text-th-active">2</span>
          </div>
          <h3 className="text-base">Weekly Draw</h3>
          <p className="text-center">
            At midnight UTC every Sunday winners are randomly drawn for each
            weekly prize. The most valuable prizes are drawn first.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3">
            <span className="font-display text-base text-th-active">3</span>
          </div>
          <h3 className="text-base">Jackpot Draw</h3>
          <p className="text-center">
            There is also a jackpot draw to determine if the jackpot can be won
            or not. If it can there is a second draw to determine the jackpot
            winner.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3">
            <span className="font-display text-base text-th-active">4</span>
          </div>
          <h3 className="text-base">Claiming Prizes</h3>
          <p className="text-center">
            After the draws you&apos;ll be able to find out if your a winner by
            returning to this page when the claim is ready. Prizes can be
            claimed for 48 hours. Unclaimed prizes will be rolled into the
            jackpot.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default HowItWorksModal
