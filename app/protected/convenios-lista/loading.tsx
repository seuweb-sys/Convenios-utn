import { ConvenioCardSkeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <div className="space-y-2 mb-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md"></div>
        <div className="h-4 w-64 bg-muted animate-pulse rounded-md"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filtros skeleton */}
        <div className="md:col-span-1 space-y-4">
          <div className="h-6 w-20 bg-muted animate-pulse rounded-md"></div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-full bg-muted animate-pulse rounded-md"></div>
            ))}
          </div>
        </div>
        
        {/* Lista skeleton */}
        <div className="md:col-span-3 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConvenioCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
} 