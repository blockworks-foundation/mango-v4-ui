import MangoDateRangePicker from '@components/forms/DateRangePicker'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import MultiSelectDropdown from '@components/forms/MultiSelectDropdown'
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import Button, { IconButton } from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure } from '@headlessui/react'
import {
  AdjustmentsVerticalIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import mangoStore, { LiquidationFeedItem } from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import ActivityFeedTable from './ActivityFeedTable'

interface AdvancedFilters {
  symbol: string[]
  'start-date': string
  'end-date': string
  'usd-lower': string
  'usd-upper': string
}

const DEFAULT_ADVANCED_FILTERS = {
  symbol: [],
  'start-date': '',
  'end-date': '',
  'usd-lower': '',
  'usd-upper': '',
}

const DEFAULT_PARAMS = [
  'deposit',
  'perp_trade',
  'liquidate_token_with_token',
  'openbook_trade',
  'swap',
  'withdraw',
]

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const actions = mangoStore.getState().actions
  const { mangoAccount } = useMangoAccount()
  const [showActivityDetail, setShowActivityDetail] = useState(null)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS
  )
  const [params, setParams] = useState<string[]>(DEFAULT_PARAMS)

  useEffect(() => {
    if (mangoAccount) {
      const pubKey = mangoAccount.publicKey.toString()
      actions.fetchActivityFeed(pubKey)
    }
  }, [actions, mangoAccount])

  const handleShowActivityDetails = (activity: any) => {
    setShowActivityDetail(activity)
  }

  const advancedParamsString = useMemo(() => {
    let advancedParams = ''
    Object.entries(advancedFilters).map((entry) => {
      if (entry[1].length) {
        advancedParams = advancedParams + `&${entry[0]}=${entry[1]}`
      }
    })
    return advancedParams
  }, [advancedFilters])

  const queryParams = useMemo(() => {
    return !params.length || params.length === 6
      ? advancedParamsString
      : `&activity-type=${params.toString()}${advancedParamsString}`
  }, [advancedParamsString, params])

  return !showActivityDetail ? (
    <>
      <ActivityFilters
        filters={params}
        setFilters={setParams}
        params={queryParams}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
      />
      <ActivityFeedTable
        activityFeed={activityFeed}
        handleShowActivityDetails={handleShowActivityDetails}
        params={queryParams}
      />
    </>
  ) : (
    <ActivityDetails
      activity={showActivityDetail}
      setShowActivityDetail={setShowActivityDetail}
    />
  )
}

export default ActivityFeed

const ActivityFilters = ({
  filters,
  setFilters,
  params,
  advancedFilters,
  setAdvancedFilters,
}: {
  filters: string[]
  setFilters: (x: string[]) => void
  params: string
  advancedFilters: AdvancedFilters
  setAdvancedFilters: (x: AdvancedFilters) => void
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const actions = mangoStore.getState().actions
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const { mangoAccount } = useMangoAccount()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [hasFilters, setHasFilters] = useState(false)

  const handleUpdateResults = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const set = mangoStore.getState().set
    if (params) {
      setHasFilters(true)
    } else {
      setHasFilters(false)
    }
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    if (mangoAccount) {
      actions.fetchActivityFeed(mangoAccount.publicKey.toString(), 0, params)
    }
  }, [actions, params])

  const handleResetFilters = useCallback(async () => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const set = mangoStore.getState().set
    setHasFilters(false)
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    if (mangoAccount) {
      await actions.fetchActivityFeed(mangoAccount.publicKey.toString())
      setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)
      setFilters(DEFAULT_PARAMS)
    }
  }, [actions])

  const handleUpdateMobileResults = () => {
    handleUpdateResults()
    setShowMobileFilters(false)
  }

  return mangoAccount ? (
    <Disclosure>
      <div className="relative">
        {hasFilters ? (
          <div className="absolute right-14 top-3">
            <Tooltip content={t('activity:reset-filters')}>
              <IconButton
                className={`${loadActivityFeed ? 'animate-spin' : ''}`}
                onClick={() => handleResetFilters()}
                size="small"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </IconButton>
            </Tooltip>
          </div>
        ) : null}
        <div
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          role="button"
          className={`default-transition h-12 w-full bg-th-bkg-2 px-4 hover:bg-th-bkg-3 md:px-6`}
        >
          <Disclosure.Button
            className={`flex h-full w-full items-center justify-between rounded-none`}
          >
            <div className="flex items-center space-x-2">
              <AdjustmentsVerticalIcon className="h-5 w-5 text-th-fgd-4" />
              <span className="font-bold text-th-fgd-1">
                {t('activity:filter-results')}
              </span>
            </div>
            <ChevronDownIcon
              className={`${
                showMobileFilters ? 'rotate-180' : 'rotate-360'
              } h-6 w-6 flex-shrink-0`}
            />
          </Disclosure.Button>
        </div>
      </div>
      <Disclosure.Panel className="bg-th-bkg-2 px-6 pb-6">
        <FiltersForm
          advancedFilters={advancedFilters}
          setAdvancedFilters={setAdvancedFilters}
          filters={filters}
          setFilters={setFilters}
        />
        <Button
          className="w-full md:w-auto"
          size="large"
          onClick={handleUpdateMobileResults}
        >
          {t('activity:update')}
        </Button>
      </Disclosure.Panel>
    </Disclosure>
  ) : null
}

interface FiltersFormProps {
  advancedFilters: any
  setAdvancedFilters: (x: any) => void
  filters: string[]
  setFilters: (x: string[]) => void
}

const FiltersForm = ({
  advancedFilters,
  setAdvancedFilters,
  filters,
  setFilters,
}: FiltersFormProps) => {
  const { t } = useTranslation(['common', 'activity'])
  const { group } = useMangoGroup()
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [valueFrom, setValueFrom] = useState(advancedFilters['usd-lower'] || '')
  const [valueTo, setValueTo] = useState(advancedFilters['usd-upper'] || '')

  const symbols = useMemo(() => {
    if (!group) return []
    return Array.from(group.banksMapByName, ([key]) => key)
  }, [group])

  useEffect(() => {
    if (advancedFilters['start-date']) {
      setDateFrom(new Date(advancedFilters['start-date']))
    }
    if (advancedFilters['end-date']) {
      setDateTo(new Date(advancedFilters['end-date']))
    }
  }, [])

  const toggleTypeOption = (option: string) => {
    if (filters.includes(option)) {
      setFilters(filters.filter((opt) => opt !== option))
    } else {
      setFilters(filters.concat(option))
    }
  }

  const toggleSymbolOption = (option: string) => {
    setAdvancedFilters((prevSelected: any) => {
      const newSelections = prevSelected.symbol ? [...prevSelected.symbol] : []
      if (newSelections.includes(option)) {
        return {
          ...prevSelected,
          symbol: newSelections.filter((item) => item !== option),
        }
      } else {
        newSelections.push(option)
        return { ...prevSelected, symbol: newSelections }
      }
    })
  }

  useEffect(() => {
    if (dateFrom && dateTo) {
      setAdvancedFilters({
        ...advancedFilters,
        'start-date': dayjs(dateFrom).set('hour', 0).toISOString(),
        'end-date': dayjs(dateTo)
          .set('hour', 23)
          .set('minute', 59)
          .toISOString(),
      })
    } else {
      setAdvancedFilters({
        ...advancedFilters,
        'start-date': '',
        'end-date': '',
      })
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    if (valueFrom && valueTo) {
      setAdvancedFilters({
        ...advancedFilters,
        'usd-lower': Math.floor(valueFrom),
        'usd-upper': Math.ceil(valueTo),
      })
    } else {
      setAdvancedFilters({
        ...advancedFilters,
        'usd-lower': '',
        'usd-upper': '',
      })
    }
  }, [valueFrom, valueTo])

  return (
    <>
      <div className="grid grid-cols-2 gap-x-8 pt-4">
        <div className="col-span-2 lg:col-span-1">
          <Label text={t('activity:activity-type')} />
          <MultiSelectDropdown
            options={DEFAULT_PARAMS}
            selected={filters}
            toggleOption={toggleTypeOption}
          />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <Label text={t('tokens')} />
          <MultiSelectDropdown
            options={symbols}
            selected={advancedFilters.symbol || []}
            toggleOption={toggleSymbolOption}
          />
        </div>
      </div>
      <div className="my-4 w-full">
        <MangoDateRangePicker
          startDate={dateFrom}
          setStartDate={setDateFrom}
          endDate={dateTo}
          setEndDate={setDateTo}
        />
      </div>
      <div className="flex items-end pb-6">
        <div className="w-full">
          <Label text={t('activity:value-from')} />
          <Input
            type="number"
            placeholder="0.00"
            value={valueFrom}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setValueFrom(e.target.value)
            }
          />
        </div>
        <div className="flex h-12 items-center justify-center">
          <ChevronRightIcon className="mx-1 h-5 w-5 flex-shrink-0 text-th-fgd-3" />
        </div>
        <div className="w-full">
          <Label text={t('activity:value-to')} />
          <Input
            type="number"
            placeholder="0.00"
            value={valueTo || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setValueTo(e.target.value)
            }
          />
        </div>
      </div>
    </>
  )
}

const ActivityDetails = ({
  activity,
  setShowActivityDetail,
}: {
  activity: LiquidationFeedItem
  setShowActivityDetail: (x: any) => void
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { block_datetime, activity_type } = activity
  const {
    asset_amount,
    asset_price,
    asset_symbol,
    liab_amount,
    liab_price,
    liab_symbol,
    signature,
  } = activity.activity_details
  return (
    <div>
      <div className="flex items-center p-6">
        <IconButton
          className="mr-4"
          onClick={() => setShowActivityDetail(null)}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <h2 className="text-lg">{t('activity:liquidation-details')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('date')}</p>
          <p className="text-th-fgd-1">
            {dayjs(block_datetime).format('ddd D MMM')}
          </p>
          <p className="text-xs text-th-fgd-3">
            {dayjs(block_datetime).format('h:mma')}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:liquidation-type')}</p>
          <p className="text-th-fgd-1">
            {activity_type === 'liquidate_token_with_token'
              ? t('spot')
              : t('perp')}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatDecimal(asset_amount)}{' '}
            <span className="font-body tracking-wider">{asset_symbol}</span>
            <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
            {formatFixedDecimals(asset_price, true)}
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            {formatFixedDecimals(asset_price * asset_amount, true)}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatDecimal(liab_amount)}{' '}
            <span className="font-body tracking-wider">{liab_symbol}</span>
            <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
            {formatFixedDecimals(liab_price, true)}
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            {formatFixedDecimals(liab_price * liab_amount, true)}
          </p>
        </div>
      </div>
      <div className="col-span-3 mt-8 flex justify-center border-y border-th-bkg-3 py-3">
        <a
          className="default-transition flex items-center text-th-fgd-2 hover:text-th-fgd-3"
          href={`${preferredExplorer.url}${signature}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            alt=""
            width="20"
            height="20"
            src={`/explorer-logos/${preferredExplorer.name}.png`}
          />
          <span className="ml-2 text-base">{t('view-transaction')}</span>
        </a>
      </div>
    </div>
  )
}
