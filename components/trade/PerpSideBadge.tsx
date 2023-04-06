const PerpSideBadge = ({ basePosition }: { basePosition: number }) => {
  return (
    <>
      {basePosition !== 0 ? (
        <span
          className={`inline-block rounded uppercase ${
            basePosition > 0
              ? 'text-th-up md:border md:border-th-up'
              : 'text-th-down md:border md:border-th-down'
          }
       uppercase md:-my-0.5 md:px-1.5 md:py-0.5 md:text-xs`}
        >
          {basePosition > 0 ? 'Long' : 'Short'}
        </span>
      ) : (
        '--'
      )}
    </>
  )
}

export default PerpSideBadge
