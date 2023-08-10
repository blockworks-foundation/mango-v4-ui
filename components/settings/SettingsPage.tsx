import { useViewport } from 'hooks/useViewport'
import AnimationSettings from './AnimationSettings'
import DisplaySettings from './DisplaySettings'
import HotKeysSettings from './HotKeysSettings'
import NotificationSettings from './NotificationSettings'
import PreferredExplorerSettings from './PreferredExplorerSettings'
import RpcSettings from './RpcSettings'
import SoundSettings from './SoundSettings'
import { breakpoints } from 'utils/theme'
import AccountSettings from './AccountSettings'
import useMangoAccount from 'hooks/useMangoAccount'
import useUnownedAccount from 'hooks/useUnownedAccount'

const SettingsPage = () => {
  const { width } = useViewport()
  const { mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const isMobile = width ? width < breakpoints.lg : false
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 border-b border-th-bkg-3 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <RpcSettings />
      </div>
      {mangoAccountAddress && !isUnownedAccount ? (
        <div className="col-span-12 border-b border-th-bkg-3 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
          <AccountSettings />
        </div>
      ) : null}
      <div className="col-span-12 border-b border-th-bkg-3 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <DisplaySettings />
      </div>
      <div className="col-span-12 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <NotificationSettings />
      </div>
      {!isMobile ? (
        <div className="col-span-12 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
          <HotKeysSettings />
        </div>
      ) : null}
      <div className="col-span-12 border-b border-th-bkg-3 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <AnimationSettings />
      </div>
      <div className="col-span-12 border-b border-th-bkg-3 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <SoundSettings />
      </div>
      <div className="col-span-12 pt-8 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
        <PreferredExplorerSettings />
      </div>
    </div>
  )
}

export default SettingsPage
