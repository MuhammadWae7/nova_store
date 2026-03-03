export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8">
      {/* Hero skeleton */}
      <div className="w-full h-[60vh] bg-neutral-900 animate-pulse rounded-lg mb-8" />
      {/* Marquee skeleton */}
      <div className="w-full h-16 bg-neutral-900 animate-pulse mb-8" />
      {/* Featured collection skeleton */}
      <div className="w-full max-w-7xl">
        <div className="w-48 h-8 bg-neutral-900 animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-900 animate-pulse rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
