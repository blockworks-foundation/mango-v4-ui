import Checkbox from '@components/forms/Checkbox'
import MangoDateRangePicker from '@components/forms/DateRangePicker'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import MultiSelectDropdown from '@components/forms/MultiSelectDropdown'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore, { LiquidationFeedItem } from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { EXPLORERS } from 'pages/settings'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import ActivityFeedTable from './ActivityFeedTable'

interface Filters {
  deposit: boolean
  liquidate_token_with_token: boolean
  withdraw: boolean
}

interface AdvancedFilters {
  symbol: string[]
  'start-date': string
  'end-date': string
  'usd-lower': string
  'usd-upper': string
}

const DEFAULT_FILTERS = {
  deposit: true,
  liquidate_token_with_token: true,
  withdraw: true,
}

const DEFAULT_ADVANCED_FILTERS = {
  symbol: [],
  'start-date': '',
  'end-date': '',
  'usd-lower': '',
  'usd-upper': '',
}

const DEFAULT_PARAMS = ['deposit', 'liquidate_token_with_token', 'withdraw']

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] = useState(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS
  )
  const [params, setParams] = useState<string[]>(DEFAULT_PARAMS)

  const handleShowActivityDetails = (activity: any) => {
    setShowActivityDetail(activity)
  }

  const updateFilters = (e: ChangeEvent<HTMLInputElement>, filter: string) => {
    setFilters({ ...filters, [filter]: e.target.checked })

    let newParams: string[] = DEFAULT_PARAMS

    if (params.includes(filter)) {
      newParams = params.filter((p) => p !== filter)
    } else {
      newParams = [...params, filter]
    }
    setParams(newParams)
  }

  const advancedParamsString = useMemo(() => {
    let advancedParams: string = ''
    Object.entries(advancedFilters).map((entry) => {
      if (entry[1].length) {
        advancedParams = advancedParams + `&${entry[0]}=${entry[1]}`
      }
    })
    return advancedParams
  }, [advancedFilters])

  const queryParams = useMemo(() => {
    return params.length === 3
      ? advancedParamsString
      : `&activity-type=${params.toString()}${advancedParamsString}`
  }, [advancedParamsString, params])

  return !showActivityDetail ? (
    <>
      <ActivityFilters
        filters={filters}
        setFilters={setFilters}
        updateFilters={updateFilters}
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
  updateFilters,
  params,
  advancedFilters,
  setAdvancedFilters,
}: {
  filters: Filters
  setFilters: (x: Filters) => void
  updateFilters: (e: ChangeEvent<HTMLInputElement>, filter: string) => void
  params: string
  advancedFilters: AdvancedFilters
  setAdvancedFilters: (x: AdvancedFilters) => void
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const actions = mangoStore((s) => s.actions)
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const { connected } = useWallet()
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] =
    useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.lg : false
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
      setFilters(DEFAULT_FILTERS)
    }
  }, [actions])

  const handleUpdateModalResults = () => {
    handleUpdateResults()
    setShowAdvancedFiltersModal(false)
  }

  const handleUpdateMobileResults = () => {
    handleUpdateResults()
    setShowMobileFilters(false)
  }

  return connected ? (
    !isMobile ? (
      <>
        <div className="flex items-center justify-between border-b border-th-bkg-3 bg-th-bkg-2 pl-6">
          <h3 className="flex items-center whitespace-nowrap pr-6 text-sm">
            {t('activity:filter-results')}
          </h3>
          <ActivityTypeFiltersForm
            filters={filters}
            updateFilters={updateFilters}
          />
          <div className="flex h-12 items-center justify-between border-l border-th-bkg-4 p-6">
            <LinkButton
              className="whitespace-nowrap text-sm"
              onClick={() => setShowAdvancedFiltersModal(true)}
            >
              {t('activity:advanced-filters')}
            </LinkButton>
            {hasFilters ? (
              <Tooltip content={t('activity:reset-filters')}>
                <IconButton
                  className={`ml-4 ${loadActivityFeed ? 'animate-spin' : ''}`}
                  onClick={() => handleResetFilters()}
                  size="small"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            ) : null}
          </div>
          <Button className="h-12 rounded-none" onClick={handleUpdateResults}>
            {t('activity:update')}
          </Button>
        </div>
        {showAdvancedFiltersModal ? (
          <Modal
            isOpen={showAdvancedFiltersModal}
            onClose={() => setShowAdvancedFiltersModal(false)}
          >
            <h2 className="mb-2 text-center">
              {t('activity:advanced-filters')}
            </h2>
            <AdvancedFiltersForm
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
            />
            <Button
              className="w-full"
              size="large"
              onClick={handleUpdateModalResults}
            >
              {t('activity:update')}
            </Button>
          </Modal>
        ) : null}
      </>
    ) : (
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
            className={`default-transition w-full border-b border-th-bkg-3 bg-th-bkg-2 px-6 py-4 hover:bg-th-bkg-3`}
          >
            <Disclosure.Button
              className={`flex h-full w-full items-center justify-between rounded-none`}
            >
              <span className="font-bold text-th-fgd-1">
                {t('activity:filter-results')}
              </span>

              <ChevronDownIcon
                className={`${
                  showMobileFilters ? 'rotate-180' : 'rotate-360'
                } h-6 w-6 flex-shrink-0`}
              />
            </Disclosure.Button>
          </div>
        </div>
        <Transition
          appear={true}
          show={showMobileFilters}
          enter="transition-all ease-in duration-300"
          enterFrom="opacity-100 max-h-0"
          enterTo="opacity-100 max-h-full"
          leave="transition-all ease-out duration-300"
          leaveFrom="opacity-100 max-h-full"
          leaveTo="opacity-0 max-h-0"
        >
          <Disclosure.Panel className="bg-th-bkg-2 px-6 pb-6">
            <div className="py-4">
              <Label text={t('activity:activity-type')} />
              <ActivityTypeFiltersForm
                filters={filters}
                updateFilters={updateFilters}
              />
            </div>
            <AdvancedFiltersForm
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
            />
            <Button
              className="w-full"
              size="large"
              onClick={handleUpdateMobileResults}
            >
              {t('activity:update')}
            </Button>
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    )
  ) : null
}

const ActivityTypeFiltersForm = ({
  filters,
  updateFilters,
}: {
  filters: Filters
  updateFilters: (e: ChangeEvent<HTMLInputElement>, filter: string) => void
}) => {
  const { t } = useTranslation('activity')
  return (
    <div className="flex w-full flex-col space-y-2 md:flex-row md:space-y-0">
      <div className="flex h-8 flex-1 items-center lg:h-12 lg:border-l lg:border-th-bkg-4 lg:p-4">
        <Checkbox
          checked={filters.deposit}
          onChange={(e) => updateFilters(e, 'deposit')}
        >
          <span className="text-sm">{t('deposits')}</span>
        </Checkbox>
      </div>
      <div className="flex h-8 flex-1 items-center lg:h-12 lg:border-l lg:border-th-bkg-4 lg:p-4">
        <Checkbox
          checked={filters.withdraw}
          onChange={(e) => updateFilters(e, 'withdraw')}
        >
          <span className="text-sm">{t('withdrawals')}</span>
        </Checkbox>
      </div>
      <div className="flex h-8 flex-1 items-center lg:h-12 lg:border-l lg:border-th-bkg-4 lg:p-4">
        <Checkbox
          checked={filters.liquidate_token_with_token}
          onChange={(e) => updateFilters(e, 'liquidate_token_with_token')}
        >
          <span className="text-sm">{t('liquidations')}</span>
        </Checkbox>
      </div>
    </div>
  )
}

interface AdvancedFiltersFormProps {
  advancedFilters: any
  setAdvancedFilters: (x: any) => void
}

const AdvancedFiltersForm = ({
  advancedFilters,
  setAdvancedFilters,
}: AdvancedFiltersFormProps) => {
  const { t } = useTranslation(['common', 'activity'])
  const group = mangoStore((s) => s.group)
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [valueFrom, setValueFrom] = useState(advancedFilters['usd-lower'] || '')
  const [valueTo, setValueTo] = useState(advancedFilters['usd-upper'] || '')

  const symbols = useMemo(() => {
    if (!group) return []
    return Array.from(group.banksMapByName, ([key, value]) => key)
  }, [group])

  useEffect(() => {
    if (advancedFilters['start-date']) {
      setDateFrom(new Date(advancedFilters['start-date']))
    }
    if (advancedFilters['end-date']) {
      setDateTo(new Date(advancedFilters['end-date']))
    }
  }, [])

  const toggleOption = (option: string) => {
    setAdvancedFilters((prevSelected: any) => {
      const newSelections = prevSelected.symbol ? [...prevSelected.symbol] : []
      if (newSelections.includes(option)) {
        return {
          ...prevSelected,
          symbol: newSelections.filter((item) => item != option),
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
        'start-date':
          dayjs(dateFrom).set('hour', 0).format('YYYY-MM-DDTHH:mm:ss.000') +
          'Z',
        'end-date':
          dayjs(dateTo)
            .set('hour', 23)
            .set('minute', 59)
            .format('YYYY-MM-DDTHH:mm:ss.000') + 'Z',
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
        'usd-lower': valueFrom,
        'usd-upper': valueTo,
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
      <Label text={t('tokens')} />
      <MultiSelectDropdown
        options={symbols}
        selected={advancedFilters.symbol || []}
        toggleOption={toggleOption}
      />
      <div className="my-4 w-full">
        <MangoDateRangePicker
          startDate={dateFrom}
          setStartDate={setDateFrom}
          endDate={dateTo}
          setEndDate={setDateTo}
        />
      </div>
      <div className="flex items-center space-x-2 pb-6">
        <div className="w-1/2">
          <Label text={t('activity:value-from')} />
          <Input
            type="text"
            placeholder="0.00"
            value={valueFrom}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setValueFrom(e.target.value)
            }
          />
        </div>
        <div className="w-1/2">
          <Label text={t('activity:value-to')} />
          <Input
            type="text"
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
  const { block_datetime } = activity
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
      <div className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-3">
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
          <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatDecimal(asset_amount)}{' '}
            <span className="font-body tracking-wide">{asset_symbol}</span>
            <span className="ml-2 font-body tracking-wide text-th-fgd-3">
              at
            </span>{' '}
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
            <span className="font-body tracking-wide">{liab_symbol}</span>
            <span className="ml-2 font-body tracking-wide text-th-fgd-3">
              at
            </span>{' '}
            {formatFixedDecimals(liab_price, true)}
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            {formatFixedDecimals(liab_price * liab_amount, true)}
          </p>
        </div>
      </div>
      <div className="col-span-3 mt-8 flex justify-center border-y border-th-bkg-3 py-3">
        <a
          className="default-transition flex items-center text-th-fgd-1 hover:text-th-fgd-3"
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
          <span className="ml-2 text-base">{`View on ${t(
            `settings:${preferredExplorer.name}`
          )}`}</span>
        </a>
      </div>
    </div>
  )
}
