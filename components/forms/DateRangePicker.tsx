import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { enUS } from 'date-fns/locale'
import { DateChangeCallBack, DateRangePicker } from 'react-nice-dates'
import Label from './Label'

const MangoDateRangePicker = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  startDate: Date | undefined
  setStartDate: DateChangeCallBack | undefined
  endDate: Date | undefined
  setEndDate: DateChangeCallBack | undefined
}) => {
  const { t } = useTranslation('common')

  return (
    <DateRangePicker
      startDate={startDate!}
      endDate={endDate!}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      minimumDate={new Date('January 01, 2020 00:00:00')}
      maximumDate={new Date()}
      minimumLength={1}
      format="dd MMM yyyy"
      locale={enUS}
    >
      {({ startDateInputProps, endDateInputProps }) => (
        <div className="date-range flex items-end">
          <div className="w-full">
            <Label text={t('date-from')} />
            <input
              className="h-12 w-full rounded-md border border-th-input-border bg-th-input-bkg px-3 text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover"
              {...startDateInputProps}
              placeholder="Start Date"
            />
          </div>
          <div className="flex h-12 items-center justify-center">
            <ChevronRightIcon className="mx-1 h-5 w-5 shrink-0 text-th-fgd-3" />
          </div>
          <div className="w-full">
            <Label text={t('date-to')} />
            <input
              className="h-12 w-full rounded-md border border-th-input-border bg-th-input-bkg px-3 text-th-fgd-1 focus:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover"
              {...endDateInputProps}
              placeholder="End Date"
            />
          </div>
        </div>
      )}
    </DateRangePicker>
  )
}

export default MangoDateRangePicker
