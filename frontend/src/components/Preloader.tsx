import Logo from "@/components/Logo";

export default function Preloader() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(2,6,23,0.96), rgba(30,64,175,0.88), rgba(8,47,73,0.9)), url('https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2000&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <Logo size="lg" stacked className="justify-center" />
        <p className="text-xs tracking-[0.5em] uppercase text-muted-foreground">
          Initializing Foresight Engine
        </p>
        <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden mx-auto border border-white/20">
          <div className="h-full bg-gradient-to-r from-primary via-secondary to-accent animate-[shimmer_1.4s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground/80">
          Calibrating data streams...
        </p>
      </div>
    </div>
  );
}

