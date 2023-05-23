import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { IconButton, LinkButton } from '@components/shared/Button'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Modal from '@components/shared/Modal'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import { UsersIcon } from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useState } from 'react'
import { PerpTradeActivity, PerpTradeFeedItem } from 'types'
import { ModalProps } from 'types/modal'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { getDecimalCount } from 'utils/numbers'
import { formatFee } from './ActivityFeedTable'

const PerpTradeDetails = ({ activity }: { activity: PerpTradeActivity }) => {
  const { t } = useTranslation(['common', 'activity', 'settings', 'trade'])
  const [showFills, setShowFills] = useState(false)
  const { mangoAccountAddress } = useMangoAccount()
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const {
    maker,
    maker_fee,
    perp_market_name,
    price,
    quantity,
    signature,
    taker,
    taker_fee,
    taker_side,
    fills,
  } = activity.activity_details

  const isTaker = taker === mangoAccountAddress

  const side = isTaker ? taker_side : taker_side === 'bid' ? 'ask' : 'bid'

  const notional = quantity * price

  const fee = isTaker ? taker_fee * notional : maker_fee * notional

  const totalPrice = (notional + fee) / quantity

  const counterpartyPk = isTaker ? maker : taker

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">
            {t('trade:side')}
          </p>
          <PerpSideBadge basePosition={side === 'bid' ? 1 : -1} />
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">
            {t('trade:size')}
          </p>
          <p className="font-mono text-th-fgd-1">
            {quantity}{' '}
            <span className="font-body text-th-fgd-3">{perp_market_name}</span>
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">
            {t('activity:execution-price')}
          </p>
          <p className="font-mono text-th-fgd-1">
            <FormatNumericValue
              value={price}
              decimals={getDecimalCount(price)}
            />{' '}
            <span className="font-body text-th-fgd-3">USDC</span>
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('value')}</p>
          <p className="font-mono text-th-fgd-1">
            <FormatNumericValue value={notional} isUsd />
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('fee')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatFee(fee)}{' '}
            <span className="font-body text-th-fgd-3">USDC</span>
          </p>
          <p className="font-body text-xs text-th-fgd-3">
            {isTaker ? t('trade:taker') : t('trade:maker')}
          </p>
        </div>
        <div className="col-span-1">
          <Tooltip content={t('activity:net-price-desc')} placement="top-start">
            <p className="tooltip-underline mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:net-price')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-1">
            <FormatNumericValue
              value={totalPrice}
              decimals={Math.max(getDecimalCount(price), 3)}
            />{' '}
            <span className="font-body text-th-fgd-3">USDC</span>
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">
            {t('activity:fills')}
          </p>
          <LinkButton onClick={() => setShowFills(true)}>
            <p className="font-body font-normal text-th-fgd-1">
              {`View ${activity.activity_details.fills.length} fills`}
            </p>
          </LinkButton>
        </div>
        {fills?.length === 1 ? (
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:counterparty')}
            </p>
            <a
              className="flex items-center text-sm"
              href={`/?address=${counterpartyPk}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mr-1.5">
                {abbreviateAddress(new PublicKey(counterpartyPk))}
              </span>
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </a>
          </div>
        ) : null}
        <div className="col-span-1">
          <p className="mb-0.5 font-body text-sm text-th-fgd-3">
            {t('transaction')}
          </p>
          <a
            className="default-transition flex items-center"
            href={`${preferredExplorer.url}${signature}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              alt=""
              width="20"
              height="20"
              src={`/explorer-logos/${preferredExplorer.name}.png`}
            />
            <span className="ml-2 text-sm">
              {t(`settings:${preferredExplorer.name}`)}
            </span>
          </a>
        </div>
      </div>
      {showFills ? (
        <FillsModal
          isOpen={showFills}
          onClose={() => setShowFills(false)}
          fills={fills}
        />
      ) : null}
    </>
  )
}

export default PerpTradeDetails

interface FillsModalProps {
  fills: PerpTradeFeedItem[]
}

type ModalCombinedProps = FillsModalProps & ModalProps

const FillsModal = ({ isOpen, onClose, fills }: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'activity', 'trade'])
  const { mangoAccountAddress } = useMangoAccount()
  return (
    <Modal isOpen={isOpen} onClose={onClose} wide>
      <h2 className="text-center">{t('activity:fills')}</h2>

      <Table className="min-w-full">
        <thead>
          <TrHead>
            <Th className="bg-th-bkg-1 text-left">{t('date')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('trade:size')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('price')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('fee')}</Th>
            <Th />
          </TrHead>
        </thead>
        <tbody>
          {fills.map((fill, index) => {
            const {
              block_datetime,
              quantity,
              price,
              taker,
              taker_fee,
              maker,
              maker_fee,
            } = fill
            const isTaker = taker === mangoAccountAddress
            const value = price * quantity
            const fee = isTaker ? taker_fee * value : maker_fee * value
            return (
              <TrBody key={quantity + block_datetime + index}>
                <Td>
                  <p className="font-body">
                    {dayjs(block_datetime).format('ddd D MMM')}
                  </p>
                  <p className="text-xs text-th-fgd-3">
                    {dayjs(block_datetime).format('h:mma')}
                  </p>
                </Td>
                <Td className="text-right">
                  <p>{quantity}</p>
                </Td>
                <Td className="text-right">
                  <p>{price}</p>
                </Td>
                <Td className="text-right">
                  <p>{formatFee(fee)}</p>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <Tooltip
                      content={`View Counterparty ${abbreviateAddress(
                        isTaker ? new PublicKey(maker) : new PublicKey(taker)
                      )}`}
                      delay={0}
                    >
                      <a
                        className=""
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`/?address=${isTaker ? maker : taker}`}
                      >
                        <IconButton size="small">
                          <UsersIcon className="h-4 w-4" />
                        </IconButton>
                      </a>
                    </Tooltip>
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </Modal>
  )
}
