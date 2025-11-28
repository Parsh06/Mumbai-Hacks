import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  className?: string;
}

export default function MetricCard({
  label,
  value,
  change,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("brutal-card p-4", className)}>
      <p className="text-sm font-semibold text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 font-bold text-sm",
              trend === "up"
                ? "text-success"
                : "text-destructive"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
}
