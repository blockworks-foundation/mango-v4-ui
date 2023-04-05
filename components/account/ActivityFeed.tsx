import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import ActivityFeedTable from './ActivityFeedTable'
import {
  LiquidationActivity,
  PerpTradeActivity,
  isLiquidationFeedItem,
} from 'types'
import LiquidationDetails from './LiquidationDetails'
import PerpTradeDetails from './PerpTradeDetails'

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] = useState<
    LiquidationActivity | PerpTradeActivity
  >()
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleShowActivityDetails = (
    activity: LiquidationActivity | PerpTradeActivity
  ) => {
    setShowActivityDetail(activity)
    setScrollPosition(window.scrollY)
  }

  useEffect(() => {
    if (scrollPosition && !showActivityDetail) {
      window.scroll(0, scrollPosition)
    }
  }, [scrollPosition, showActivityDetail])

  return !showActivityDetail ? (
    <ActivityFeedTable
      activityFeed={activityFeed}
      handleShowActivityDetails={handleShowActivityDetails}
    />
  ) : (
    <div className="px-6">
      {isLiquidationFeedItem(showActivityDetail) ? (
        <LiquidationDetails
          activity={showActivityDetail}
          setShowActivityDetail={setShowActivityDetail}
        />
      ) : (
        <PerpTradeDetails
          activity={showActivityDetail}
          setShowActivityDetail={setShowActivityDetail}
        />
      )}
    </div>
  )
}

export default ActivityFeed
