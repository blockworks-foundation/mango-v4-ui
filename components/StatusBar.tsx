import { useTranslation } from 'react-i18next'
import Tps from './Tps'
import DiscordIcon from './icons/DiscordIcon'
import { TwitterIcon } from './icons/TwitterIcon'
import { DocumentTextIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { IDL } from '@blockworks-foundation/mango-v4'
import RpcPing from './RpcPing'
import Tooltip from './shared/Tooltip'

const DEFAULT_LATEST_COMMIT = { sha: '', url: '' }

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

const StatusBar = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation('common')
  const [latestCommit, setLatestCommit] = useState(DEFAULT_LATEST_COMMIT)

  useEffect(() => {
    const { sha } = latestCommit
    if (!sha) {
      getLatestCommit().then((commit) => setLatestCommit(commit))
    }
  }, [latestCommit])

  return (
    <div
      className={`fixed hidden ${
        collapsed ? 'w-[calc(100vw-64px)]' : 'w-[calc(100vw-200px)]'
      } bottom-0 z-10 bg-th-input-bkg px-4 py-1 md:grid md:grid-cols-3 md:px-6`}
    >
      <div className="col-span-1 flex items-center space-x-2">
        <Tps />
        <span className="text-th-fgd-4">|</span>
        <RpcPing />
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
