import { useTranslation } from 'react-i18next'
import Tps from './Tps'
import DiscordIcon from './icons/DiscordIcon'
import { TwitterIcon } from './icons/TwitterIcon'
import { DocumentTextIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { IDL } from '@blockworks-foundation/mango-v4'

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

const StatusBar = () => {
  const { t } = useTranslation('common')
  const [latestCommit, setLatestCommit] = useState(DEFAULT_LATEST_COMMIT)

  useEffect(() => {
    const { sha } = latestCommit
    if (!sha) {
      getLatestCommit().then((commit) => setLatestCommit(commit))
    }
  }, [latestCommit])

  return (
    <div className="hidden relative bottom-0 bg-th-bkg-2 md:grid md:grid-cols-3 px-4 md:px-6 py-2">
      <div className="col-span-1 flex items-center">
        <Tps />
      </div>
      <div className="col-span-1 text-center">
        <span className="text-th-fgd-3 text-xs">v{IDL.version}</span>
        {latestCommit.sha && latestCommit.url ? (
          <>
            <span className="mx-1.5 text-th-fgd-4">|</span>
            <a
              className="text-th-fgd-3 text-xs focus:outline-none md:hover:text-th-fgd-2"
              href={latestCommit.url}
              rel="noreferrer noopener"
              target="_blank"
            >
              {latestCommit.sha}
            </a>
          </>
        ) : null}
      </div>
      <div className="col-span-1 flex items-center justify-end space-x-4 text-xs">
        <a
          className="text-th-fgd-3 focus:outline-none flex items-center md:hover:text-th-fgd-2"
          href="https://docs.mango.markets"
          rel="noreferrer noopener"
          target="_blank"
        >
          <DocumentTextIcon className="h-3 w-3 mr-1" />
          <span>{t('docs')}</span>
        </a>
        <a
          className="text-th-fgd-3 focus:outline-none flex items-center md:hover:text-th-fgd-2"
          href="https://discord.gg/2uwjsBc5yw"
          rel="noreferrer noopener"
          target="_blank"
        >
          <DiscordIcon className="h-3 w-3 mr-1" />
          <span>{t('discord')}</span>
        </a>
        <a
          className="text-th-fgd-3 focus:outline-none flex items-center md:hover:text-th-fgd-2"
          href="https://twitter.com/mangomarkets"
          rel="noreferrer noopener"
          target="_blank"
        >
          <TwitterIcon className="h-3 w-3 mr-1" />
          <span>{t('twitter')}</span>
        </a>
      </div>
    </div>
  )
}

export default StatusBar
