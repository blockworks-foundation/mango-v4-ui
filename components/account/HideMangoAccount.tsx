import {
  toggleMangoAccountHidden,
  useMangoAccountHidden,
} from 'hooks/useMangoAccountHidden'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import Switch from '@components/forms/Switch'
import { useState } from 'react'
import Loading from '@components/shared/Loading'

const HideMangoAccount = () => {
  const { publicKey, signMessage } = useWallet()
  const { mangoAccountPk } = useMangoAccount()
  const { accountHidden, refetch } = useMangoAccountHidden()
  const [signingForHide, setSigningForHide] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between border-t border-th-bkg-3 p-4">
        <p className="">Hide Mango Account From Search</p>
        {signingForHide ? (
          <Loading />
        ) : (
          <Switch
            checked={accountHidden ?? false}
            onChange={async () => {
              if (!publicKey) throw new Error('Wallet not connected!')
              if (!mangoAccountPk) throw new Error('MangoAccount not found!')
              if (!signMessage)
                throw new Error('Wallet does not support message signing!')
              setSigningForHide(true)
              await toggleMangoAccountHidden(
                mangoAccountPk,
                publicKey,
                !(accountHidden ?? false),
                signMessage,
              )
              setSigningForHide(false)
              refetch()
            }}
          />
        )}
      </div>
    </>
  )
}

export default HideMangoAccount
