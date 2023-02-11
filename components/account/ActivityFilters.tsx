import MangoDateRangePicker from '@components/forms/DateRangePicker'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import MultiSelectDropdown from '@components/forms/MultiSelectDropdown'
import Button, { IconButton } from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure } from '@headlessui/react'
import {
  AdjustmentsVerticalIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'

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

const ActivityFilters = () => {
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS
  )
  const [params, setParams] = useState<string[]>(DEFAULT_PARAMS)
  const { t } = useTranslation(['common', 'activity'])
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const [showFilters, setShowFilters] = useState(false)
  const [hasFilters, setHasFilters] = useState(false)

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

  useEffect(() => {
    const set = mangoStore.getState().set
    if (queryParams.length) {
      set((state) => {
        state.activityFeed.queryParams = queryParams
      })
    } else {
      set((state) => {
        state.activityFeed.queryParams = ''
      })
    }
  }, [queryParams])

  const handleUpdateResults = useCallback(() => {
    const set = mangoStore.getState().set
    if (queryParams) {
      setHasFilters(true)
    } else {
      setHasFilters(false)
    }
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    if (mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress, 0, queryParams)
    }
  }, [actions, queryParams, mangoAccountAddress])

  const handleResetFilters = useCallback(async () => {
    const set = mangoStore.getState().set
    setHasFilters(false)
    setShowFilters(false)
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    if (mangoAccountAddress) {
      await actions.fetchActivityFeed(mangoAccountAddress)
      setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)
      setParams(DEFAULT_PARAMS)
    }
  }, [actions, mangoAccountAddress])

  const handleUpdateMobileResults = () => {
    handleUpdateResults()
    setShowFilters(false)
  }

  return mangoAccountAddress ? (
    <Disclosure>
      <div className="flex items-center">
        {hasFilters ? (
          <Tooltip content={t('activity:reset-filters')}>
            <IconButton
              className={`${loadActivityFeed ? 'animate-spin' : ''}`}
              onClick={() => handleResetFilters()}
              size="small"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
        ) : null}
        <div
          onClick={() => setShowFilters(!showFilters)}
          role="button"
          className={`default-transition mr-4 ml-3 rounded-md border border-th-button px-2 py-1.5 md:mr-6 md:hover:border-th-button-hover`}
        >
          <Disclosure.Button className="flex h-full w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <AdjustmentsVerticalIcon className="hidden h-5 w-5 text-th-fgd-4 sm:block" />
              <span className="text-sm font-medium text-th-fgd-1">
                {t('activity:filter-results')}
              </span>
            </div>
            <ChevronDownIcon
              className={`${
                showFilters ? 'rotate-180' : 'rotate-360'
              } ml-1.5 h-5 w-5 flex-shrink-0`}
            />
          </Disclosure.Button>
        </div>
      </div>
      {showFilters ? (
        <Disclosure.Panel
          className="absolute top-14 z-10 w-full border-t border-th-bkg-3 bg-th-bkg-2 px-6 pb-6 shadow-md"
          static
        >
          <FiltersForm
            advancedFilters={advancedFilters}
            setAdvancedFilters={setAdvancedFilters}
            filters={params}
            setFilters={setParams}
          />
          <Button
            className="w-full md:w-auto"
            size="large"
            onClick={handleUpdateMobileResults}
          >
            {t('activity:update')}
          </Button>
        </Disclosure.Panel>
      ) : null}
    </Disclosure>
  ) : null
}

export default ActivityFilters

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
        <div className="col-span-2 mb-4 lg:col-span-1 lg:mb-0">
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
