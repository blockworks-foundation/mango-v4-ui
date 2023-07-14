import React, { useEffect, useState } from 'react'
import { Governance, Proposal } from '@solana/spl-governance'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { DAILY_SECONDS } from 'utils/constants'

interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const ZeroCountdown: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
}

const isZeroCountdown = (state: CountdownState) =>
  state.days === 0 &&
  state.hours === 0 &&
  state.minutes === 0 &&
  state.seconds === 0

export function VoteCountdown({
  proposal,
  governance,
}: {
  proposal: Proposal
  governance: Governance
}) {
  const { t } = useTranslation(['governance'])

  const [countdown, setCountdown] = useState(ZeroCountdown)

  useEffect(() => {
    if (proposal.isVoteFinalized()) {
      setCountdown(ZeroCountdown)
      return
    }

    const getTimeToVoteEnd = () => {
      const now = dayjs().unix()

      let timeToVoteEnd = proposal.isPreVotingState()
        ? governance.config.baseVotingTime
        : (proposal.votingAt?.toNumber() ?? 0) +
          governance.config.baseVotingTime -
          now

      if (timeToVoteEnd <= 0) {
        return ZeroCountdown
      }

      const days = Math.floor(timeToVoteEnd / DAILY_SECONDS)
      timeToVoteEnd -= days * DAILY_SECONDS

      const hours = Math.floor(timeToVoteEnd / 3600) % 24
      timeToVoteEnd -= hours * 3600

      const minutes = Math.floor(timeToVoteEnd / 60) % 60
      timeToVoteEnd -= minutes * 60

      const seconds = Math.floor(timeToVoteEnd % 60)

      return { days, hours, minutes, seconds }
    }

    const updateCountdown = () => {
      const newState = getTimeToVoteEnd()
      setCountdown(newState)
    }

    const interval = setInterval(() => {
      updateCountdown()
    }, 1000)

    updateCountdown()
    return () => clearInterval(interval)
  }, [proposal, governance])

  return (
    <>
      {isZeroCountdown(countdown) ? (
        <div className="text-fgd-3">{t('voting-ended')}</div>
      ) : (
        <div className="text-fgd-1 flex w-40 items-center">
          <div className="text-fgd-3 mr-1">{t('ends')}</div>
          {countdown && countdown.days > 0 && (
            <>
              <div className="bg-bkg-1 rounded px-1 py-0.5">
                {countdown.days}d
              </div>
              <span className="text-fgd-3 mx-0.5 font-bold">:</span>
            </>
          )}
          <div className="bg-bkg-1 rounded px-1 py-0.5">{countdown.hours}h</div>
          <span className="text-fgd-3 mx-0.5 font-bold">:</span>
          <div className="bg-bkg-1 rounded px-1 py-0.5">
            {countdown.minutes}m
          </div>
          {!countdown.days && (
            <>
              <span className="text-fgd-3 mx-0.5 font-bold">:</span>
              <div className="bg-bkg-1 w-9 rounded px-1 py-0.5">
                {countdown.seconds}s
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
