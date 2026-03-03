import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-16 bg-black min-h-screen">
      <div className="h-12 w-48 bg-neutral-900 rounded mb-12 animate-pulse"></div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-[3/4] bg-neutral-900 rounded-sm animate-pulse"></div>
        ))}
      </div>
    </Container>
  );
}
