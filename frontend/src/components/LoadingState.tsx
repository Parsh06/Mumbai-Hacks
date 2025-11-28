interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = "Loading insights..." }: LoadingStateProps) {
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
      <div className="text-center space-y-6 brutal-card bg-card/80 backdrop-blur rounded-2xl p-10">
        <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin mx-auto" />
        <div>
          <p className="text-xl font-bold">{label}</p>
          <p className="text-muted-foreground font-medium">
            Streaming curated market data...
          </p>
        </div>
      </div>
    </div>
  );
}

