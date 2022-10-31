import React, { FunctionComponent } from 'react'
import { useTranslation } from 'next-i18next'
import { PerpOrderSide } from '@blockworks-foundation/mango-v4'

type SideBadgeProps = {
  side: string | PerpOrderSide
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  const { t } = useTranslation('common')
  console.log(side, typeof side, side instanceof PerpOrderSide)

  return (
    <div
      className={`inline-block rounded uppercase ${
        side === 'buy' || side === PerpOrderSide.bid
          ? 'border border-th-green text-th-green'
          : 'border border-th-red text-th-red'
      }
       -my-0.5 px-1.5 py-0.5 text-xs uppercase`}
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
