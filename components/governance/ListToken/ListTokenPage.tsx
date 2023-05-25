import dynamic from 'next/dynamic'
import GovernancePageWrapper from '../GovernancePageWrapper'
import { useState } from 'react'
import Button from '@components/shared/Button'
import ListMarket from '../ListMarket/ListMarket'

const ListToken = dynamic(() => import('./ListToken'))

enum LIST_OPTIONS {
  MARKET,
  TOKEN,
}

const ListTokenPage = () => {
  const [listOptions, setListOption] = useState<LIST_OPTIONS | null>(null)

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 pb-20 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        <Button onClick={() => setListOption(LIST_OPTIONS.MARKET)}>
          List Market
        </Button>
        <Button onClick={() => setListOption(LIST_OPTIONS.TOKEN)}>
          List Token
        </Button>
        {listOptions === LIST_OPTIONS.MARKET && <ListMarket></ListMarket>}
        {listOptions === LIST_OPTIONS.TOKEN && <ListToken></ListToken>}
      </GovernancePageWrapper>
    </div>
  )
}
export default ListTokenPage
