export type TelemetryEvents = {
  accountCreate: { accountNum: number; enableNotifications: boolean }
  rewardsViewLeaderboard: never
  rewardsOpenRender: never
  rewardsCloseRender: { rewards: number; early: boolean }
  rewardsRenderUnsupported: { message: string }
  rewardsClaim: { rewards: number }
  rewardsClaimError: { message: string }
  postSendTx: { fee: number }
}
