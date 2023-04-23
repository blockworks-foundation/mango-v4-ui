type VoteResultsBarProps = {
  approveVotePercentage: number
  denyVotePercentage: number
}

const VoteResultsBar = ({
  approveVotePercentage = 0,
  denyVotePercentage = 0,
}: VoteResultsBarProps) => {
  return (
    <>
      <div className="mt-2.5 flex h-2 w-full flex-grow rounded bg-th-bkg-4">
        <div
          style={{
            width: `${
              approveVotePercentage > 2 || approveVotePercentage < 0.01
                ? approveVotePercentage
                : 2
            }%`,
          }}
          className={`flex rounded-l bg-th-up ${
            denyVotePercentage < 0.01 && 'rounded'
          }`}
        ></div>
        <div
          style={{
            width: `${
              denyVotePercentage > 2 || denyVotePercentage < 0.01
                ? denyVotePercentage
                : 2
            }%`,
          }}
          className={`flex rounded-r bg-th-down ${
            approveVotePercentage < 0.01 && 'rounded'
          }`}
        ></div>
      </div>
    </>
  )
}

export default VoteResultsBar
