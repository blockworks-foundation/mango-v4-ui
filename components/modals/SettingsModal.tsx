import { useEffect, useMemo, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import RpcSettings from '@components/settings/RpcSettings'
import DisplaySettings from '@components/settings/DisplaySettings'
import AccountSettings from '@components/settings/AccountSettings'
import NotificationSettings from '@components/settings/NotificationSettings'
import HotKeysSettings from '@components/settings/HotKeysSettings'
import PreferredExplorerSettings from '@components/settings/PreferredExplorerSettings'
import { useViewport } from 'hooks/useViewport'
import { IconButton } from '@components/shared/Button'
import AnimationSettings from '@components/settings/AnimationSettings'
import SoundSettings from '@components/settings/SoundSettings'
import TelemetrySettings from '@components/settings/TelemetrySettings'
import AutoConnectSettings from '@components/settings/AutoConnectSettings'

enum SettingsCategories {
  NETWORK = 'settings:network',
  DISPLAY = 'settings:display',
  ACCOUNT = 'account',
  NOTIFICATIONS = 'settings:notifications',
  PREFERENCES = 'settings:preferences',
  HOTKEYS = 'settings:hot-keys',
}

const TABS = [
  SettingsCategories.ACCOUNT,
  SettingsCategories.NETWORK,
  SettingsCategories.DISPLAY,
  SettingsCategories.NOTIFICATIONS,
  SettingsCategories.PREFERENCES,
  SettingsCategories.HOTKEYS,
]

const SettingsModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { isDesktop } = useViewport()
  const [activeTab, setActiveTab] = useState<SettingsCategories | null>(
    isDesktop ? TABS[0] : null,
  )

  const tabsToShow = useMemo(() => {
    if (isDesktop) {
      return TABS
    } else return TABS.slice(0, -1)
  }, [isDesktop])

  // set an active tab is screen width is desktop and no tab is set
  useEffect(() => {
    if (!activeTab && isDesktop) {
      setActiveTab(TABS[0])
    }
  }, [activeTab, isDesktop])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      panelClassNames="overflow-y-auto hide-scroll"
    >
      <div className="mx-auto max-w-[1140px] px-6 py-8 md:py-12">
        <h2 className="mb-6">{t('settings')}</h2>
        <div className="grid grid-cols-12 md:gap-8">
          {isDesktop || !activeTab ? (
            <div className="col-span-12 space-y-2 md:col-span-3 2xl:col-span-4">
              {tabsToShow.map((tab) => (
                <TabButton
                  activeTab={activeTab}
                  key={tab}
                  setActiveTab={setActiveTab}
                  title={tab}
                />
              ))}
            </div>
          ) : null}
          {isDesktop || activeTab ? (
            <div className="col-span-12 md:col-span-9 2xl:col-span-8">
              <TabContent activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

export default SettingsModal

const TabContent = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: SettingsCategories | null
  setActiveTab: (tab: SettingsCategories | null) => void
}) => {
  const { NETWORK, DISPLAY, ACCOUNT, NOTIFICATIONS, HOTKEYS, PREFERENCES } =
    SettingsCategories
  switch (activeTab) {
    case NETWORK:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <RpcSettings />
        </>
      )
    case DISPLAY:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <DisplaySettings />
          <AnimationSettings />
        </>
      )
    case ACCOUNT:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <AccountSettings />
        </>
      )
    case NOTIFICATIONS:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <NotificationSettings />
        </>
      )
    case HOTKEYS:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <HotKeysSettings />
        </>
      )
    case PREFERENCES:
      return (
        <>
          <MobileCategoryHeading
            setActiveTab={setActiveTab}
            title={activeTab}
          />
          <AutoConnectSettings />
          <PreferredExplorerSettings />
          <SoundSettings />
          <TelemetrySettings />
        </>
      )
    default:
      return null
  }
}

const TabButton = ({
  activeTab,
  setActiveTab,
  title,
}: {
  activeTab: SettingsCategories | null
  setActiveTab: (tab: SettingsCategories) => void
  title: SettingsCategories
}) => {
  const { t } = useTranslation(['common', 'settings'])
  return (
    <button
      className={`flex w-full items-center justify-between rounded-md bg-th-bkg-2 p-3 focus:outline-none focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-3 ${
        activeTab === title ? 'bg-th-bkg-3 text-th-fgd-1' : 'text-th-fgd-3'
      }`}
      onClick={() => setActiveTab(title)}
    >
      <span>{t(title)}</span>
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  )
}

const MobileCategoryHeading = ({
  setActiveTab,
  title,
}: {
  setActiveTab: (tab: null) => void
  title: SettingsCategories
}) => {
  const { t } = useTranslation(['common', 'settings'])
  return (
    <div className="mb-2 flex items-center md:hidden">
      <IconButton
        className="shrink-0 text-th-fgd-3"
        hideBg
        size="medium"
        onClick={() => setActiveTab(null)}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </IconButton>
      <h2 className="text-base">{t(title)}</h2>
    </div>
  )
}
