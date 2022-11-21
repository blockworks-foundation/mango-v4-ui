import React, { FunctionComponent } from 'react'
import { useTranslation } from 'next-i18next'
import { PerpOrderSide } from '@blockworks-foundation/mango-v4'

type SideBadgeProps = {
  side: string | PerpOrderSide
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  const { t } = useTranslation('common')

  return (
    <div
      className={`inline-block rounded uppercase ${
        side === 'buy' || side === 'long' || side === PerpOrderSide.bid
          ? 'border border-th-green text-th-green'
          : 'border border-th-red text-th-red'
      }
       -my-0.5 px-1 text-xs uppercase md:px-1.5 md:py-0.5`}
    >
      {typeof side === 'string'
        ? t(side)
        : side === PerpOrderSide.bid
        ? 'Buy'
        : 'Sell'}
    </div>
  )
}

export default SideBadge
