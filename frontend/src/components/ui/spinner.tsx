type LoadingSpinnerProps = {
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Loading', className }: LoadingSpinnerProps) {
  return (
    <div className={className ?? 'flex items-center gap-3 text-sm text-muted-foreground'}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
