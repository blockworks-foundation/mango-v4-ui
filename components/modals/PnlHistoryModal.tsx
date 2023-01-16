import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore, { PerformanceDataItem } from '@store/mangoStore'
// import { useTranslation } from 'next-i18next'
import { useEffect, useMemo } from 'react'
import BounceLoader from '../shared/BounceLoader'
import useMangoAccount from 'hooks/useMangoAccount'
import dayjs from 'dayjs'
import Change from '@components/shared/Change'

interface PnlHistoryModalProps {
  pnlChangeToday: number
}

type ModalCombinedProps = PnlHistoryModalProps & ModalProps

const PnlHistoryModal = ({
  isOpen,
  onClose,
  pnlChangeToday,
}: ModalCombinedProps) => {
  //   const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore.getState().actions
  const loading = mangoStore((s) => s.mangoAccount.performance.loading)
  const performanceData = mangoStore((s) => s.mangoAccount.performance.data)

  useEffect(() => {
    if (mangoAccountAddress) {
      actions.fetchAccountPerformance(mangoAccountAddress, 30)
    }
  }, [actions, mangoAccountAddress])

  const dailyValues = useMemo(() => {
    if (!performanceData.length) return []

    const dailyPnl = performanceData.filter((d: PerformanceDataItem) => {
      const date = new Date(d.time)
      return date.getHours() === 0
    })

    return dailyPnl.length
      ? dailyPnl
          .map((d: PerformanceDataItem, index: number) => {
            if (index < dailyPnl.length - 1) {
              return {
                time: d.time,
                pnlChange: dailyPnl[index + 1].pnl - d.pnl,
              }
            }
          })
          .slice(0, -1)
          .concat({
            time: performanceData[performanceData.length - 1].time,
            pnlChange: pnlChangeToday,
          })
          .reverse()
      : []
  }, [performanceData])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-96">
        {loading ? (
          <BounceLoader />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <h2 className="mb-4">Daily PnL</h2>
            {dailyValues?.length ? (
              <div className="thin-scroll overflow-auto pr-1">
                <div className="border-b border-th-bkg-3">
                  {dailyValues.map((v: any) => (
                    <div
                      className="flex items-center justify-between border-t border-th-bkg-3 px-2 py-3"
                      key={v.time + v.pnlChange}
                    >
                      <p>{dayjs(v.time).format('YYYY-MM-DD')}</p>
                      <Change change={v.pnlChange} prefix="$" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No daily history</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default PnlHistoryModal
