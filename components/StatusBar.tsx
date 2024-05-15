import { useTranslation } from 'react-i18next'
import Tps, { StatusDot } from './Tps'
import DiscordIcon from './icons/DiscordIcon'
import { TwitterIcon } from './icons/TwitterIcon'
import { DocumentTextIcon, MapIcon } from '@heroicons/react/20/solid'
import { useEffect, useMemo, useState } from 'react'
import { IDL } from '@blockworks-foundation/mango-v4'
import RpcPing from './RpcPing'
import Tooltip from './shared/Tooltip'
import useOffchainServicesHealth from 'hooks/useOffchainServicesHealth'
import mangoStore from '@store/mangoStore'
import { Connection } from '@solana/web3.js'
import { sumBy } from 'lodash'
import useInterval from './shared/useInterval'
import { LinkButton } from './shared/Button'
import { useRouter } from 'next/router'
import { startAccountTour } from 'utils/tours'
import useMangoAccount from 'hooks/useMangoAccount'

const DEFAULT_LATEST_COMMIT = { sha: '', url: '' }
export const tpsAlertThreshold = 1300
export const tpsWarningThreshold = 1000
export const rpcAlertThreshold = 250
export const rpcWarningThreshold = 500

const getLatestCommit = async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/blockworks-foundation/mango-v4-ui/commits`,
    )
    const data = await response.json()

    if (data && data.length) {
      const { sha, html_url } = data[0]
      return {
        sha: sha.slice(0, 7),
        url: html_url,
      }
    }
    return DEFAULT_LATEST_COMMIT
  } catch (error) {
    console.error('Error fetching latest commit:', error)
    return DEFAULT_LATEST_COMMIT
  }
}

const getRecentPerformance = async (
  connection: Connection,
  setTps: (x: number) => void,
) => {
  try {
    const samples = 2
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    setTps(tps)
  } catch {
    console.warn('Unable to fetch TPS')
  }
}

const getPingTime = async (
  connection: Connection,
  setRpcPing: (x: number) => void,
) => {
  const startTime = Date.now()
  try {
    await connection.getSlot()

    const endTime = Date.now()
    const pingTime = endTime - startTime
    setRpcPing(pingTime)
  } catch (error) {
    console.error('Error pinging the RPC:', error)
    return null
  }
}

const getOverallStatus = (
  tps: number,
  rpcPing: number,
  offchainHealth: number,
) => {
  if (tps < tpsWarningThreshold) {
    return 'severly-degraded'
  } else if (
    tps < tpsAlertThreshold ||
    rpcPing > rpcWarningThreshold ||
    offchainHealth !== 200
  ) {
    return 'degraded'
  } else return 'operational'
}

const StatusBar = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const accountPageTab = mangoStore((s) => s.accountPageTab)
  const router = useRouter()
  const [latestCommit, setLatestCommit] = useState(DEFAULT_LATEST_COMMIT)
  const { offchainHealth, isLoading: loadingOffchainHealth } =
    useOffchainServicesHealth()
  const connection = mangoStore((s) => s.connection)
  const [tps, setTps] = useState(0)
  const [rpcPing, setRpcPing] = useState(0)

  useEffect(() => {
    getPingTime(connection, setRpcPing)
  }, [])

  useInterval(() => {
    getPingTime(connection, setRpcPing)
  }, 30 * 1000)

  useEffect(() => {
    getRecentPerformance(connection, setTps)
  }, [])

  useInterval(() => {
    getRecentPerformance(connection, setTps)
  }, 60 * 1000)

  useEffect(() => {
    const { sha } = latestCommit
    if (!sha) {
      getLatestCommit().then((commit) => setLatestCommit(commit))
    }
  }, [latestCommit])

  const platformHealth = useMemo(() => {
    return getOverallStatus(tps, rpcPing, offchainHealth)
  }, [tps, rpcPing, offchainHealth])

  const dotColor =
    platformHealth === 'severly-degraded'
      ? 'bg-th-error'
      : platformHealth === 'degraded'
      ? 'bg-th-warning'
      : 'bg-th-success'

  return (
    <div
      className={`fixed hidden ${
        collapsed ? 'w-[calc(100vw-64px)]' : 'w-[calc(100vw-200px)]'
      } bottom-0 z-10 bg-th-input-bkg px-4 py-1 md:grid md:grid-cols-3 md:px-6`}
    >
      <div className="col-span-1 flex items-center">
        <Tooltip
          content={
            <div className="space-y-2">
              <div>
                <p className="mb-0.5">{t('solana-tps')}</p>
                <Tps tps={tps} />
              </div>
              <div>
                <p className="mb-0.5">{t('rpc-ping')}</p>
                <RpcPing rpcPing={rpcPing} />
              </div>
              {!loadingOffchainHealth ? (
                <div className="flex items-center">
                  <StatusDot
                    status={offchainHealth}
                    alert={201}
                    warning={301}
                  />
                  <span className="text-xs text-th-fgd-2">
                    {t('offchain-services')}
                  </span>
                </div>
              ) : null}
            </div>
          }
          placement="top-start"
        >
          <div className="flex items-center">
            <div className="relative mr-1 h-3 w-3">
              <div
                className={`absolute left-0.5 top-0.5 h-2 w-2 rounded-full ${dotColor}`}
              />
              <div
                className={`absolute h-3 w-3 rounded-full opacity-40 ${dotColor}`}
              />
            </div>
            <p className="tooltip-underline text-xs leading-none">
              {t(platformHealth)}
            </p>
          </div>
        </Tooltip>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <Tooltip content={t('program-version')}>
          <a
            className="text-xs text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
            href={`https://github.com/blockworks-foundation/mango-v4/releases`}
            rel="noreferrer noopener"
            target="_blank"
          >
            <span>v{IDL.version}</span>
          </a>
        </Tooltip>
        {latestCommit.sha && latestCommit.url ? (
          <Tooltip content={t('latest-ui-commit')}>
            <span className="mx-1.5 text-th-fgd-4">|</span>
            <a
              className="text-xs text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
              href={latestCommit.url}
              rel="noreferrer noopener"
              target="_blank"
            >
              {latestCommit.sha}
            </a>
          </Tooltip>
        ) : null}
      </div>
      <div className="col-span-1 flex items-center justify-end space-x-4 text-xs">
        {router?.asPath === '/' &&
        !router?.query?.view &&
        accountPageTab === 'overview' ? (
          <LinkButton
            className="flex items-center text-th-fgd-3  md:hover:text-th-fgd-2"
            onClick={() => startAccountTour(mangoAccountAddress)}
          >
            <MapIcon className="mr-1 h-3 w-3" />
            <span className="font-normal">UI Tour</span>
          </LinkButton>
        ) : null}
        {/* {router.asPath.includes('/trade') ? (
          <a
            className="flex items-center text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
            href="https://www.tradingview.com/"
            rel="noreferrer noopener"
            target="_blank"
          >
            <span>Powered by TradingView</span>
          </a>
        ) : null} */}
        <a
          className="flex items-center text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
          href="https://docs.mango.markets"
          rel="noreferrer noopener"
          target="_blank"
        >
          <DocumentTextIcon className="mr-1 h-3 w-3" />
          <span>{t('docs')}</span>
        </a>
        <a
          className="flex items-center text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
          href="https://discord.gg/2uwjsBc5yw"
          rel="noreferrer noopener"
          target="_blank"
        >
          <DiscordIcon className="mr-1 h-3 w-3" />
          <span>{t('discord')}</span>
        </a>
        <a
          className="flex items-center text-th-fgd-3 focus:outline-none md:hover:text-th-fgd-2"
          href="https://twitter.com/mangomarkets"
          rel="noreferrer noopener"
          target="_blank"
        >
          <TwitterIcon className="mr-1 h-3 w-3" />
          <span>{t('twitter')}</span>
        </a>
      </div>
    </div>
  )
}

export default StatusBar
