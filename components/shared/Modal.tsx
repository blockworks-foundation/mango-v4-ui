import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'

type ModalProps = {
  children: React.ReactNode
  disableOutsideClose?: boolean
  isOpen: boolean
  onClose: () => void
  hideClose?: boolean
}

function Modal({
  children,
  disableOutsideClose = false,
  isOpen,
  onClose,
  hideClose,
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50 overflow-y-auto"
    >
      <div
        className={`fixed inset-0 backdrop-blur-sm backdrop-brightness-75 ${
          disableOutsideClose ? 'pointer-events-none' : ''
        }`}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center px-4 text-center">
        <Dialog.Panel className="relative w-full max-w-md rounded-lg border border-th-bkg-3 bg-th-bkg-1 p-6">
          {!hideClose ? (
            <button
              onClick={onClose}
              className={`absolute right-4 top-4 z-50 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-active`}
            >
              <XMarkIcon className={`h-6 w-6`} />
            </button>
          ) : null}
          <div>{children}</div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default Modal
