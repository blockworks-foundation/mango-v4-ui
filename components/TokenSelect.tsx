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
        className="-ml-3 flex h-full items-center rounded-full py-2 px-4 hover:cursor-pointer hover:shadow-lg hover:drop-shadow-lg hover:backdrop-brightness-125"
      >
        <div className="mr-3 flex min-w-[24px] items-center">
          <Image
            alt=""
            width="30"
            height="30"
            src={`/icons/${token.toLowerCase()}.svg`}
          />
        </div>
        <div className="text-xl text-th-fgd-2">{token}</div>
        <ChevronDownIcon className="ml-1.5 h-5 w-5 text-th-fgd-3" />
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
