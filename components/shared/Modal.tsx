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
      className="relative z-40 overflow-y-auto"
    >
      <div
        className={`fixed inset-0 backdrop-brightness-50 ${
          disableOutsideClose ? 'pointer-events-none' : ''
        }`}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center text-center sm:justify-center sm:px-4">
        <Dialog.Panel className="relative h-full w-full bg-th-bkg-1 p-4 pt-6 sm:h-auto sm:max-w-md sm:rounded-lg sm:border sm:border-th-bkg-3 sm:p-6">
          {!hideClose ? (
            <button
              onClick={onClose}
              className={`absolute right-4 top-4 z-40 text-th-fgd-4 focus:outline-none sm:right-2 sm:top-2 md:hover:text-th-active`}
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
