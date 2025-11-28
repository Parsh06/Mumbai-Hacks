import { CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

interface Insight {
  type: "strength" | "weakness" | "opportunity";
  text: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  title?: string;
}

export default function InsightsPanel({
  insights,
  title = "FinSightAi Agentic Insights",
}: InsightsPanelProps) {
  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "strength":
        return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />;
      case "weakness":
        return <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />;
      case "opportunity":
        return <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />;
    }
  };

  return (
    <div className="brutal-card-lg p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        {title}
      </h3>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            {getIcon(insight.type)}
            <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
