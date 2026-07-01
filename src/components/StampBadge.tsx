interface StampBadgeProps {
  label: string
}

export function StampBadge({ label }: StampBadgeProps) {
  return (
    <span className="stamp-badge" role="status">
      {label}
    </span>
  )
}
