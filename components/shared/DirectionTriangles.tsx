export const UpTriangle = ({ size }: { size?: 'small' | 'large' }) => (
  <div
    className={`h-0 w-0 ${
      size === 'small'
        ? 'border-b-[6.92px] border-l-[4px] border-r-[4px]'
        : 'border-b-[8.65px] border-l-[5px] border-r-[5px]'
    } border-b-th-up border-l-transparent border-r-transparent`}
  />
)

export const DownTriangle = ({ size }: { size?: 'small' | 'large' }) => (
  <div
    className={`h-0 w-0 ${
      size === 'small'
        ? 'border-l-[4px] border-r-[4px] border-t-[6.92px]'
        : 'border-l-[5px] border-r-[5px] border-t-[8.65px]'
    } border-l-transparent border-r-transparent border-t-th-down`}
  />
)
