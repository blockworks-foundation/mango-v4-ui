export type TelemetryEvents = {
  rewardsViewLeaderboard: never
  rewardsOpenRender: never
  rewardsCloseRender: { rewards: number; early: boolean }
  rewardsRenderUnsupported: { message: string }
  rewardsClaim: { rewards: number }
  rewardsClaimError: { message: string }
}
