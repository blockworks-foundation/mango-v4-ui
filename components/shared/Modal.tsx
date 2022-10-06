import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'

type ModalProps = {
  title?: string
  children: React.ReactNode
  disableOutsideClose?: boolean
  isOpen: boolean
  onClose: () => void
  hideClose?: boolean
}

function Modal({
  title = '',
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
      className="fixed inset-0 z-30 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay
          className={`fixed inset-0 backdrop-blur-sm backdrop-brightness-75 ${
            disableOutsideClose ? 'pointer-events-none' : ''
          }`}
        />
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>
        <div className="my-8 inline-block w-full max-w-md transform rounded-lg border border-th-bkg-3 bg-th-bkg-1 p-6 text-left align-middle shadow-xl">
          {!hideClose ? (
            <button
              onClick={onClose}
              className={`absolute right-4 top-4 z-50 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-primary`}
            >
              <XMarkIcon className={`h-6 w-6`} />
            </button>
          ) : null}
          <Dialog.Title>{title}</Dialog.Title>

          {children}
        </div>
      </div>
    </Dialog>
  )
}

export default Modal
