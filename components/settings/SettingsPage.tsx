import { useViewport } from 'hooks/useViewport'
import AnimationSettings from './AnimationSettings'
import DisplaySettings from './DisplaySettings'
import HotKeysSettings from './HotKeysSettings'
import NotificationSettings from './NotificationSettings'
import PreferredExplorerSettings from './PreferredExplorerSettings'
import RpcSettings from './RpcSettings'
import SoundSettings from './SoundSettings'
import { breakpoints } from 'utils/theme'
import { motion } from 'framer-motion'

const SettingsPage = () => {
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.lg : false
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{opacity: 0, y: 10}}
      transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22
                  }} >
        <div className="grid grid-cols-12">
          <div className="col-span-12 border-b border-th-bkg-3 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
            <RpcSettings />
          </div>
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
    </motion.div>
  )
}

export default SettingsPage
