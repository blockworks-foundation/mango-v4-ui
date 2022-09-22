import { useState } from 'react'
import Orderbook from './Orderbook'
import RecentTrades from './RecentTrades'

const OrderbookAndTrades = () => {
  const [activeTab, setActiveTab] = useState('book')
  return (
    <div className="hide-scroll h-full">
      <div className="grid h-[49px] select-none grid-cols-2 items-center justify-between border-b border-th-bkg-3 text-base">
        <div
          onClick={() => setActiveTab('book')}
          className={`flex h-12 items-center justify-center px-4 text-sm font-bold hover:cursor-pointer ${
            activeTab === 'book'
              ? 'bg-th-bkg-2 text-th-primary'
              : 'text-th-fgd-4 hover:text-th-fgd-2'
          }`}
        >
          Book
        </div>
        <div
          onClick={() => setActiveTab('trades')}
          className={`flex h-12 items-center justify-center px-4 text-sm font-bold hover:cursor-pointer ${
            activeTab === 'trades'
              ? 'bg-th-bkg-2 text-th-primary'
              : 'text-th-fgd-4 hover:text-th-fgd-2'
          }`}
          id="trade-step-five"
        >
          Trades
        </div>
      </div>
      <div className={`h-full ${activeTab === 'book' ? 'visible' : 'hidden'}`}>
        <Orderbook />
      </div>
      <div
        className={`h-full ${activeTab === 'trades' ? 'visible' : 'hidden'}`}
      >
        <RecentTrades />
      </div>
    </div>
  )
}

export default OrderbookAndTrades
