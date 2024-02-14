import { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import Tooltip from './Tooltip'
import { IconButton } from './Button'
import { ArrowPathIcon } from '@heroicons/react/20/solid'

const ManualRefresh = ({
  classNames,
  hideBg = false,
  size,
}: {
  classNames?: string
  hideBg?: boolean
  size?: 'small' | 'medium' | 'large'
}) => {
  const { t } = useTranslation('common')
  const [spin, setSpin] = useState(false)
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()

  const handleRefreshData = async () => {
    setSpin(true)
    await actions.fetchGroup()
    if (mangoAccountAddress) {
      await actions.reloadMangoAccount()
      actions.fetchOpenOrders()
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (spin) {
      timer = setTimeout(() => setSpin(false), 5000)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [spin])

  return (
    <div className={`${classNames} rounded-full`}>
      <Tooltip content={t('refresh-data')} className="py-1 text-xs">
        <div id="account-refresh">
          <IconButton
            hideBg={hideBg}
            onClick={handleRefreshData}
            disabled={spin}
            size={size}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${spin ? 'animate-spin' : null}`}
            />
          </IconButton>
        </div>
      </Tooltip>
    </div>
  )
}

export default ManualRefresh
