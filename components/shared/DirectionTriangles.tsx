export const UpTriangle = ({ size }: { size?: 'small' }) => (
  <div
    className={`h-0 w-0 ${
      size === 'small'
        ? 'border-l-[4px] border-r-[4px] border-b-[6.92px]'
        : 'border-l-[6px] border-r-[6px] border-b-[10.39px]'
    } border-l-transparent border-r-transparent border-b-th-green`}
  />
)

export const DownTriangle = ({ size }: { size?: 'small' }) => (
  <div
    className={`h-0 w-0 ${
      size === 'small'
        ? 'border-l-[4px] border-r-[4px] border-b-[6.92px]'
        : 'border-l-[6px] border-r-[6px] border-b-[10.39px]'
    } border-l-transparent border-r-transparent border-t-th-red`}
  />
)
