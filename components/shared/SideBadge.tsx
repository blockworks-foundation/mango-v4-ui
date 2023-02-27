import React, { FunctionComponent } from 'react'

type SideBadgeProps = {
  isPerp?: boolean
  side: string
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side, isPerp }) => {
  if (side !== 'buy' && side !== 'sell') {
    return <div className="text-th-fgd-3">Unknown</div>
  }

  const isBid = side === 'buy'

  return (
    <div
      className={`inline-block rounded uppercase ${
        isBid
          ? 'text-th-up md:border md:border-th-up'
          : 'text-th-down md:border md:border-th-down'
      }
       uppercase md:-my-0.5 md:px-1.5 md:py-0.5 md:text-xs`}
    >
      {isPerp ? (isBid ? 'long' : 'short') : side}
    </div>
  )
}

export default SideBadge
