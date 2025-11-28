import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
  className?: string;
}

const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

export default function Logo({
  size = "md",
  stacked = false,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", stacked && "flex-col", className)}>
      <div
        className={cn(
          "relative rounded-2xl border-4 border-border shadow-[var(--shadow-brutal-lg)] overflow-hidden bg-gradient-to-br from-[#00F5A0] via-[#00D9F5] to-[#0066FF]",
          sizeMap[size]
        )}
      >
        <div className="absolute inset-0 opacity-70 mix-blend-screen bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative w-full h-full text-primary-foreground p-3"
          aria-hidden="true"
        >
          <path
            d="M12 44L26 28l10 10 16-22"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="28" r="4" fill="currentColor" />
          <circle cx="36" cy="38" r="4" fill="currentColor" />
        </svg>
      </div>

      <div className={cn("text-left", stacked && "text-center")}>
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-semibold">
          FinSight
        </p>
        <p className="text-2xl font-black font-display leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Ai
        </p>
      </div>
    </div>
  );
}

