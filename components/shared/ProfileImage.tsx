import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getProfilePicture } from '@solflare-wallet/pfp'
import { useEffect, useState } from 'react'
import mangoStore from '../../store/mangoStore'
import ProfileIcon from '../icons/ProfileIcon'

const ProfileImage = ({
  imageSize,
  placeholderSize,
  publicKey,
}: {
  imageSize: string
  placeholderSize: string
  publicKey?: string
}) => {
  const pfp = mangoStore((s) => s.wallet.profilePic)
  const loadPfp = mangoStore((s) => s.wallet.loadProfilePic)
  // const loadingTransaction = mangoStore(
  //   (s) => s.wallet.nfts.loadingTransaction
  // )
  const connection = mangoStore((s) => s.connection)
  const [unownedPfp, setUnownedPfp] = useState<any>(null)
  const [loadUnownedPfp, setLoadUnownedPfp] = useState<boolean>(false)
  const { connected } = useWallet()

  useEffect(() => {
    if (publicKey) {
      setLoadUnownedPfp(true)
      const getProfilePic = async () => {
        const pfp = await getProfilePicture(
          connection,
          new PublicKey(publicKey)
        )
        setUnownedPfp(pfp)
        setLoadUnownedPfp(false)
      }
      getProfilePic()
    }
  }, [publicKey, connection])

  const isLoading = (connected && loadPfp && !publicKey) || loadUnownedPfp

  return pfp?.isAvailable || unownedPfp?.isAvailable ? (
    <img
      alt=""
      src={publicKey ? unownedPfp?.url : pfp?.url}
      className={`default-transition rounded-full`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    />
  ) : (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full ${
        isLoading ? 'animate-pulse bg-th-bkg-4' : 'bg-th-bkg-4'
      }`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    >
      <div
        style={{
          width: `${placeholderSize}px`,
          height: `${placeholderSize}px`,
        }}
      >
        <ProfileIcon className={`h-full w-full text-th-fgd-3`} />
      </div>
    </div>
  )
}

export default ProfileImage
