import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import Change from '@components/shared/Change'
import SheenLoader from '@components/shared/SheenLoader'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { PerformanceDataItem } from 'types'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import { DAILY_MILLISECONDS } from 'utils/constants'

interface PnlChange {
  time: string
  pnlChange: number
}

interface PnlHistoryModalProps {
  pnlChangeToday: number
}

type ModalCombinedProps = PnlHistoryModalProps & ModalProps

const PnlHistoryModal = ({
  isOpen,
  onClose,
  pnlChangeToday,
}: ModalCombinedProps) => {
  const { t } = useTranslation('account')
  const { performanceData, performanceLoading: loading } =
    useAccountPerformanceData()

  const dailyValues: PnlChange[] = useMemo(() => {
    if (!performanceData || !performanceData.length) return []

    const dailyPnl = performanceData.filter((d: PerformanceDataItem) => {
      const startTime = new Date().getTime() - 30 * DAILY_MILLISECONDS
      const dataDate = new Date(d.time)
      const dataTime = dataDate.getTime()
      return dataTime >= startTime && dataDate.getHours() === 0
    })

    return dailyPnl.length
      ? dailyPnl
          .map((d: PerformanceDataItem, index: number) => {
            if (index < dailyPnl.length - 1) {
              const change = dailyPnl[index + 1].pnl - d.pnl
              return {
                time: d.time,
                pnlChange: change,
              }
            } else {
              return {
                time: performanceData[performanceData.length - 1].time,
                pnlChange: pnlChangeToday,
              }
            }
          })
          .reverse()
      : []
  }, [performanceData])

  const pnlThisWeek = useMemo(() => {
    if (dailyValues.length) {
      const saturdayIndex = dailyValues.findIndex((d) => {
        const day = new Date(d.time).getDay()
        return day === 6
      })
      if (saturdayIndex !== -1) {
        return dailyValues
          .slice(0, saturdayIndex)
          .reduce((a, c) => a + c.pnlChange, 0)
      } else {
        return dailyValues.reduce((a, c) => a + c.pnlChange, 0)
      }
    }
    return 0
  }, [dailyValues])

  const getLastSunday = (d: Date) => {
    return d.setDate(d.getDate() - d.getDay())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-96">
        <div className="flex h-full flex-col">
          <h2 className="mb-4 w-full text-center">{t('pnl-history')}</h2>
          {loading ? (
            <div className="space-y-1.5">
              {[...Array(4)].map((x, i) => (
                <SheenLoader className="flex flex-1" key={i}>
                  <div className="h-12 w-full bg-th-bkg-2" />
                </SheenLoader>
              ))}
            </div>
          ) : dailyValues?.length ? (
            <>
              <div className="thin-scroll overflow-auto pr-1">
                <div className="border-b border-th-bkg-3">
                  {dailyValues.map((v) => (
                    <div
                      className="flex items-center justify-between border-t border-th-bkg-3 p-3"
                      key={v.time + v.pnlChange}
                    >
                      <p>{dayjs(v.time).format('YYYY-MM-DD')}</p>
                      <Change change={v.pnlChange} prefix="$" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between rounded-md bg-th-bkg-2 p-3">
                <p>
                  {t('week-starting', {
                    week: dayjs(getLastSunday(new Date())).format('MM-DD'),
                  })}
                </p>
                <Change change={pnlThisWeek} prefix="$" />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center pb-12">
              <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-3" />
              <p>{t('no-pnl-history')}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PnlHistoryModal
