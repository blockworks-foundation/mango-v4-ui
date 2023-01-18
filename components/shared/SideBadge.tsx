import React, { FunctionComponent } from 'react'
import { useTranslation } from 'next-i18next'
import { PerpOrderSide } from '@blockworks-foundation/mango-v4'

type SideBadgeProps = {
  side: string | PerpOrderSide
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  const { t } = useTranslation('common')

  const isBid =
    typeof side === 'string' ? ['buy', 'long'].includes(side) : 'bid' in side

  return (
    <div
      className={`inline-block rounded uppercase ${
        isBid
          ? 'text-th-up md:border md:border-th-up'
          : 'text-th-down md:border md:border-th-down'
      }
       uppercase md:-my-0.5 md:px-1.5 md:py-0.5 md:text-xs`}
    >
      {typeof side === 'string' ? t(side) : 'bid' in side ? 'Long' : 'Short'}
    </div>
  )
}

export default SideBadge
