interface Props {
  content: string
  children: React.ReactNode
  disabled?: boolean
}

/** Wraps children with a hover tooltip. CSS-only, no JS needed. */
export function Tooltip({ content, children, disabled }: Props) {
  if (!content || disabled) return <>{children}</>
  return (
    <span className="tooltip-wrap">
      {children}
      <span className="tooltip-content zh-kaiti">{content}</span>
    </span>
  )
}
