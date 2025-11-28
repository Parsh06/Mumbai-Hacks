import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import CompanySearch from "@/components/CompanySearch";
import { Button } from "@/components/ui/button";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";

const DEFAULT_GAINERS = [
  { ticker: "TCS", name: "Tata Consultancy Services", change: 5.2 },
  { ticker: "INFY", name: "Infosys", change: 4.8 },
  { ticker: "WIPRO", name: "Wipro", change: 3.6 },
];

const DEFAULT_LOSERS = [
  { ticker: "ZOMATO", name: "Zomato", change: -3.8 },
  { ticker: "PAYTM", name: "Paytm", change: -2.5 },
  { ticker: "NYKAA", name: "FSN E-Commerce", change: -1.9 },
];

const RECENTLY_VIEWED_FALLBACK = ["RELIANCE", "HDFCBANK", "ICICIBANK"];

export default function Index() {
  const { data } = useCompanyDataset();

  const searchOptions = useMemo(
    () =>
      data?.companies.map((company) => ({
        ticker: company.company_code,
        name: company.name || company.company_code,
      })),
    [data]
  );

  const recentlyViewed = useMemo(() => {
    if (!data) return RECENTLY_VIEWED_FALLBACK;
    return data.companies.slice(0, 3).map((company) => company.company_code);
  }, [data]);

  const quickActions = [
    {
      title: "Compare Companies",
      description: "Side-by-side analysis",
      icon: BarChart3,
      to: "/compare",
    },
    {
      title: "Explore Industries",
      description: "Sector insights",
      icon: TrendingUp,
      to: "/industries",
    },
  ];

  const topGainers = DEFAULT_GAINERS;
  const topLosers = DEFAULT_LOSERS;

  const heroBackdrop =
    "linear-gradient(120deg, rgba(2,6,23,0.85), rgba(8,47,73,0.85)), url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=80')";

  const featurePanels = [
    {
      title: "Agentic Workflows",
      copy: "Deploy autonomous agents to collect filings, summarize earnings, and surface anomalies.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Pitch‑ready Assets",
      copy: "Instant PDF packs with comps, valuation bridges, and diligence-ready charts.",
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Risk Radar",
      copy: "AI monitors macro, FX, and sentiment feeds to warn you before volatility hits.",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section
        className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh] brutal-card-lg p-10 bg-cover"
        style={{ backgroundImage: heroBackdrop, backgroundSize: "cover" }}
      >
        <div className="space-y-6">
          <h1 className="text-display-lg font-display leading-tight">
            Agentic Investment Insights —{" "}
            <span className="text-primary">Compare, Analyze,</span>{" "}
            <span className="text-secondary">Invest Smarter.</span>
          </h1>

          <p className="text-xl text-muted-foreground font-medium max-w-xl">
            AI-powered financial intelligence dashboard for investment bankers
            and traders. Real-time data, instant insights, smarter decisions.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/companies">
              <Button className="brutal-button bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                Start Exploring Companies
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/compare">
              <Button
                variant="outline"
                className="brutal-button text-lg px-8 py-6"
              >
                Compare Companies
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative brutal-card-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-8 lg:p-12 flex items-center justify-center min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(190,255,255,0.1),transparent_50%)]"></div>
          <div className="text-center space-y-6 w-full relative z-10">
            <div className="relative inline-block">
              <Zap className="w-24 h-24 text-primary mx-auto animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="brutal-card bg-gradient-to-r from-card to-card/80 p-6 border-primary/50 shadow-[0_0_15px_rgba(190,255,255,0.3)] hover:shadow-[0_0_25px_rgba(190,255,255,0.5)] transition-all">
                <p className="font-bold text-xl text-primary">⚡ Real-time Analytics</p>
                <p className="text-sm text-muted-foreground mt-1">Live market data tracking</p>
              </div>
              <div className="brutal-card bg-gradient-to-r from-card to-card/80 p-6 border-secondary/50 shadow-[0_0_15px_rgba(200,150,255,0.3)] hover:shadow-[0_0_25px_rgba(200,150,255,0.5)] transition-all">
                <p className="font-bold text-xl text-secondary">🤖 AI-Powered Insights</p>
                <p className="text-sm text-muted-foreground mt-1">Smart financial analysis</p>
              </div>
              <div className="brutal-card bg-gradient-to-r from-card to-card/80 p-6 border-accent/50 shadow-[0_0_15px_rgba(255,170,90,0.3)] hover:shadow-[0_0_25px_rgba(255,170,90,0.5)] transition-all">
                <p className="font-bold text-xl text-accent">📊 Smart Comparisons</p>
                <p className="text-sm text-muted-foreground mt-1">Side-by-side metrics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-display-sm font-display">Find Any Company</h2>
          <CompanySearch companies={searchOptions} />
        </div>
      </section>

      {/* Feature Panels with Imagery */}
      <section className="grid md:grid-cols-3 gap-6">
        {featurePanels.map((panel) => (
          <div key={panel.title} className="brutal-card-lg overflow-hidden">
            <div
              className="h-40 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${panel.image})` }}
            />
            <div className="p-5 space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {panel.title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">{panel.copy}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-2 gap-6">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.to}>
            <div className="brutal-card-lg p-8 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group">
              <action.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">{action.title}</h3>
              <p className="text-muted-foreground font-medium">
                {action.description}
              </p>
              <ArrowRight className="w-6 h-6 mt-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        ))}
      </section>

      {/* Real-time Alerts Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="brutal-card p-6 border-success/30 bg-gradient-to-br from-card to-success/5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-success">📈 Top Gainers</span>
            <span className="text-xs bg-success/20 text-success px-2 py-1 rounded font-semibold border border-success/30">
              LIVE
            </span>
          </h3>
          <div className="space-y-3">
            {topGainers.map((stock) => (
              <div
                key={stock.ticker}
                className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20 hover:bg-success/20 transition-all"
              >
                <Link to={`/company/${stock.ticker}`}>
                  <span className="font-bold hover:text-success transition-colors">
                    {stock.ticker}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-success">+{stock.change}%</span>
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-card p-6 border-destructive/30 bg-gradient-to-br from-card to-destructive/5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-destructive">📉 Top Losers</span>
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded font-semibold border border-destructive/30">
              LIVE
            </span>
          </h3>
          <div className="space-y-3">
            {topLosers.map((stock) => (
              <div
                key={stock.ticker}
                className="flex justify-between items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all"
              >
                <Link to={`/company/${stock.ticker}`}>
                  <span className="font-bold hover:text-destructive transition-colors">
                    {stock.ticker}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-destructive">{stock.change}%</span>
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-card p-6 border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-primary">👁️ Recently Viewed</span>
          </h3>
          <div className="space-y-3">
            {recentlyViewed.map((ticker) => (
              <Link key={ticker} to={`/company/${ticker}`}>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all font-bold hover:text-primary">
                  {ticker}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="brutal-card p-6 border-accent/30 bg-gradient-to-br from-card to-accent/5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-accent">⚡ Popular Comparisons</span>
          </h3>
          <div className="space-y-3">
            <Link to="/compare?tickers=INFY,TCS">
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all font-bold hover:text-accent">
                Infosys vs TCS
              </div>
            </Link>
            <Link to="/compare?tickers=HDFCBANK,ICICIBANK">
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all font-bold hover:text-accent">
                HDFC vs ICICI
              </div>
            </Link>
            <Link to="/compare?tickers=RELIANCE,ITC">
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all font-bold hover:text-accent">
                Reliance vs ITC
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Storytelling Section */}
      <section className="brutal-card-lg p-8 bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 space-y-4">
          <p className="text-sm uppercase tracking-[0.5em] text-muted-foreground">New</p>
          <h3 className="text-3xl font-display leading-tight">
            AI co-pilot stitches together filings, sentiment, and price action to prep you for any
            boardroom.
          </h3>
          <p className="text-muted-foreground font-medium">
            Upload your mandate brief and let FinSightAi craft custom narratives, comps, and next
            steps in minutes.
          </p>
          <Button className="brutal-button bg-secondary text-secondary-foreground">
            Meet the Analyst Copilot
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div
          className="flex-1 h-64 rounded-2xl border-3 border-border bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80')",
          }}
        />
      </section>
    </div>
  );
}
