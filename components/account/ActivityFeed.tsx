import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import ActivityFeedTable from './ActivityFeedTable'
import { LiquidationActivity } from 'types'
import LiquidationDetails from './LiquidationDetails'

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] =
    useState<LiquidationActivity>()
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleShowActivityDetails = (activity: LiquidationActivity) => {
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
      <LiquidationDetails
        activity={showActivityDetail}
        setShowActivityDetail={setShowActivityDetail}
      />
    </div>
  )
}

export default ActivityFeed
