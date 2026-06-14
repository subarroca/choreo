export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-raised rounded-lg ${className}`} />
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  )
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 ${className}`}>
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  )
}
