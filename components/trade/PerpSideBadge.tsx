import SideBadge from '@components/shared/SideBadge'

const PerpSideBadge = ({ basePosition }: { basePosition: number }) => {
  return (
    <>
      {basePosition !== 0 ? (
        <SideBadge side={basePosition > 0 ? 'long' : 'short'} />
      ) : (
        '--'
      )}
    </>
  )
}

export default PerpSideBadge
