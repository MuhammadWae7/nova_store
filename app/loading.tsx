export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm uppercase tracking-widest text-muted-foreground animate-pulse">Loading Luxury Experience...</p>
      </div>
    </div>
  )
}
