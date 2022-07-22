const Label = ({ text, optional }: { text: string; optional?: boolean }) => (
  <p className="mb-2 text-sm text-th-fgd-3">
    {text}{' '}
    {optional ? (
      <span className="ml-1 text-xs text-th-fgd-4">(Optional)</span>
    ) : null}
  </p>
)

export default Label
