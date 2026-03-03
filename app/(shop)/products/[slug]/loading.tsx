import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
        <div className="aspect-[3/4] bg-neutral-900 rounded-sm"></div>
        <div className="space-y-4">
          <div className="h-12 w-3/4 bg-neutral-900 rounded-sm"></div>
          <div className="h-8 w-1/4 bg-neutral-900 rounded-sm"></div>
          <div className="h-64 bg-neutral-900 rounded-sm"></div>
        </div>
      </div>
    </Container>
  );
}
