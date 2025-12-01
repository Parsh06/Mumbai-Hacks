interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({
  label = "Loading insights...",
}: LoadingStateProps) {
  return (
    <div
      className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(6,78,59,0.85)), url('https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4 brutal-card bg-card/80 backdrop-blur rounded-2xl p-8">
          <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin mx-auto" />
          <div>
            <p className="text-xl font-bold">{label}</p>
            <p className="text-muted-foreground font-medium">
              Streaming curated market data...
            </p>
          </div>
        </div>

        {/* Generic skeleton grid for list / card layouts */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="brutal-card bg-card/80 border-border/80 animate-pulse overflow-hidden"
            >
              <div className="h-20 bg-gradient-to-r from-background/60 via-muted/40 to-background/60" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-muted rounded-full" />
                  <div className="h-6 w-12 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

