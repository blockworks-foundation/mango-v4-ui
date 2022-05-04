import { useState, useRef } from 'react'
import { Dialog } from '@headlessui/react'

type ModalProps = {
  title?: string
  children: React.ReactNode
  isOpen: boolean
  onClose: (x: boolean) => void
}

function Modal({ title = '', children, isOpen, onClose }: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>
        <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title>{title}</Dialog.Title>

          {children}
        </div>
      </div>
    </Dialog>
  )
}

export default Modal
