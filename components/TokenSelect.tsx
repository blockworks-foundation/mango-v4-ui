import { ChevronDownIcon } from '@heroicons/react/solid'
import Image from 'next/image'
import { useState } from 'react'
import mangoStore from '../store/state'
import SelectTokenModal from './swap/SelectTokenModal'

type TokenSelectProps = {
  token: string
  onChange: (x: string) => void
}

const TokenSelect = ({ token, onChange }: TokenSelectProps) => {
  const [showTokenSelectModal, setShowTokenSelectModal] = useState(false)
  const group = mangoStore((s) => s.group)

  const handleTokenSelect = (sym: string) => {
    setShowTokenSelectModal(false)
    onChange(sym)
  }

  if (!group) return null

  return (
    <>
      <div
        onClick={() => setShowTokenSelectModal(true)}
        className="flex h-full items-center py-2 text-th-fgd-2 hover:cursor-pointer hover:text-th-fgd-1"
        role="button"
      >
        <div className="mr-3 flex min-w-[24px] items-center">
          <Image
            alt=""
            width="24"
            height="24"
            src={`/icons/${token.toLowerCase()}.svg`}
          />
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="text-xl font-bold">{token}</div>
          <ChevronDownIcon className="h-6 w-6" />
        </div>
      </div>
      {showTokenSelectModal ? (
        <SelectTokenModal
          isOpen={showTokenSelectModal}
          onClose={() => setShowTokenSelectModal(false)}
          onTokenSelect={handleTokenSelect}
        />
      ) : null}
    </>
  )
}

export default TokenSelect
