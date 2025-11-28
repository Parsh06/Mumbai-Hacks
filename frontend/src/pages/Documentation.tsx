import { BookOpen, Database, Shield, TrendingUp } from "lucide-react";

export default function Documentation() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="brutal-card-lg p-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <h1 className="text-display-sm font-display mb-2">Documentation</h1>
        <p className="text-lg text-muted-foreground font-medium">
          How FinSightAi works and what you need to know
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="brutal-card-lg p-6">
          <TrendingUp className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-4">Scoring Methodology</h2>
          <div className="space-y-3 text-sm">
            <p className="font-medium leading-relaxed">
              Our composite scoring system evaluates companies across five key dimensions:
            </p>
            <ul className="space-y-2 ml-4 font-medium">
              <li>• <strong>Growth (20%):</strong> Revenue growth, earnings growth</li>
              <li>• <strong>Profitability (25%):</strong> ROE, EBITDA margin, net margin</li>
              <li>• <strong>Cash Flow (20%):</strong> Free cash flow, operating cash flow</li>
              <li>• <strong>Valuation (20%):</strong> P/E ratio, P/B ratio</li>
              <li>• <strong>Leverage (15%):</strong> Debt-to-equity, interest coverage</li>
            </ul>
            <p className="font-medium leading-relaxed mt-4">
              You can customize these weights on the comparison page to match your investment strategy.
            </p>
          </div>
        </div>

        <div className="brutal-card-lg p-6">
          <Database className="w-12 h-12 text-secondary mb-4" />
          <h2 className="text-2xl font-bold mb-4">Data Pipeline</h2>
          <div className="space-y-3 text-sm">
            <p className="font-medium leading-relaxed">
              FinSightAi aggregates data from multiple sources to provide comprehensive insights:
            </p>
            <ul className="space-y-2 ml-4 font-medium">
              <li>• <strong>Financial Statements:</strong> Quarterly and annual reports from company filings</li>
              <li>• <strong>Market Data:</strong> Real-time stock prices and trading volumes</li>
              <li>• <strong>Industry Benchmarks:</strong> Sector averages and peer comparisons</li>
              <li>• <strong>AI Analysis:</strong> Machine learning models for pattern recognition</li>
            </ul>
            <p className="font-medium leading-relaxed mt-4">
              Data is updated daily to ensure you have the latest information.
            </p>
          </div>
        </div>

        <div className="brutal-card-lg p-6">
          <BookOpen className="w-12 h-12 text-accent mb-4" />
          <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
          <div className="space-y-3 text-sm font-medium">
            <p className="leading-relaxed">
              We acknowledge the following data providers:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Stock Exchange APIs (BSE, NSE)</li>
              <li>• Company Annual Reports & Filings</li>
              <li>• Industry Research Databases</li>
              <li>• Financial News Aggregators</li>
            </ul>
            <p className="leading-relaxed mt-4 text-muted-foreground">
              Note: This is a demonstration project using mock data for educational purposes.
            </p>
          </div>
        </div>

        <div className="brutal-card-lg p-6 bg-destructive/10 border-destructive">
          <Shield className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Important Disclaimer</h2>
          <div className="space-y-3 text-sm font-bold">
            <p className="leading-relaxed">
              ⚠️ FinSightAi provides informational insights only and is NOT financial advice.
            </p>
            <p className="leading-relaxed">
              • Do not make investment decisions based solely on this platform
            </p>
            <p className="leading-relaxed">
              • Always consult with a qualified financial advisor
            </p>
            <p className="leading-relaxed">
              • Past performance does not guarantee future results
            </p>
            <p className="leading-relaxed">
              • Investing in securities involves risk of loss
            </p>
            <p className="leading-relaxed mt-4 text-muted-foreground">
              By using FinSightAi, you acknowledge and accept these terms.
            </p>
          </div>
        </div>
      </div>

      <div className="brutal-card-lg p-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 text-center">
        <h2 className="text-2xl font-bold mb-4">Questions or Feedback?</h2>
        <p className="text-muted-foreground font-medium mb-4">
          We're constantly improving FinSightAi. Reach out to us with suggestions!
        </p>
        <p className="font-bold text-primary">contact@finsightai.com</p>
      </div>
    </div>
  );
}
