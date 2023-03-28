import mangoStore from '@store/mangoStore'
import { useState } from 'react'
import ActivityFeedTable from './ActivityFeedTable'
import { LiquidationActivity } from 'types'
import LiquidationDetails from './LiquidationDetails'

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] =
    useState<LiquidationActivity>()

  const handleShowActivityDetails = (activity: LiquidationActivity) => {
    setShowActivityDetail(activity)
  }

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
