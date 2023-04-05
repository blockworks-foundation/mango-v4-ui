import React, { FunctionComponent } from 'react'

type SideBadgeProps = {
  side: string
}

const SideBadge: FunctionComponent<SideBadgeProps> = ({ side }) => {
  if (side !== 'buy' && side !== 'sell') {
    return <span>Unknown</span>
  }

  const isBid = side === 'buy'

  return (
    <span
      className={`inline-block rounded uppercase ${
        isBid
          ? 'text-th-up md:border md:border-th-up'
          : 'text-th-down md:border md:border-th-down'
      }
       uppercase md:-my-0.5 md:px-1.5 md:py-0.5 md:text-xs`}
    >
      {isBid ? 'Buy' : 'Sell'}
    </span>
  )
}

export default SideBadge
