import { InformationCircleIcon } from '@heroicons/react/20/solid'
import Tooltip from './Tooltip'

const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip content={content}>
    <InformationCircleIcon className="ml-1.5 h-5 w-5 cursor-help text-th-fgd-4" />
  </Tooltip>
)

export default InfoTooltip
