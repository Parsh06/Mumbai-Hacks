import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BellRing,
  Brain,
  Download,
  Shield,
  Sparkles,
  AlertTriangle,
  Newspaper,
  BarChart3,
  Bolt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";
import LoadingState from "@/components/LoadingState";
import { type CompanyRecord } from "@/services/companyDataService";

const parseNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parsePercent = (value: string | undefined): number | null => {
  if (!value) return null;
  const cleaned = value.replace("%", "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

const getMetricValue = (
  company: CompanyRecord,
  metric: string
) => company.key_ratios?.find((r) => r.metric === metric)?.value;

const formatMarketCap = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
  return `₹${value.toFixed(1)} Cr`;
};

export default function Dashboard() {
  const { data, isLoading, error } = useCompanyDataset();

  const dashboardData = useMemo(() => {
    if (!data) return null;

    const companies = data.companies.filter((c) => c.status === "success");

    let totalMarketCap = 0;
    let highROECompanies = 0;
    let highROCECompanies = 0;
    let positiveSignalCompanies = 0;
    let companiesWithAlerts = 0;

    companies.forEach((company) => {
      const marketCap = parseNumber(getMetricValue(company, "Market Cap"));
      if (marketCap) totalMarketCap += marketCap;

      const roe = parsePercent(getMetricValue(company, "ROE"));
      if (roe && roe > 15) highROECompanies++;

      const roce = parsePercent(getMetricValue(company, "ROCE"));
      if (roce && roce > 15) highROCECompanies++;

      const prosCount = company.pros?.length || 0;
      const consCount = company.cons?.length || 0;
      if (prosCount > consCount) positiveSignalCompanies++;
      if (consCount > 3) companiesWithAlerts++;
    });

    const watchlist = companies
      .map((company) => {
        const marketCap = parseNumber(getMetricValue(company, "Market Cap"));
        const currentPrice = getMetricValue(company, "Current Price");
        const highLow = getMetricValue(company, "High / Low");
        const prosCount = company.pros?.length || 0;
        const consCount = company.cons?.length || 0;

        let change = "0%";
        let changeValue = 0;
        if (highLow) {
          const parts = highLow.split(" / ");
          if (parts.length === 2) {
            const high = parseNumber(parts[0]);
            const low = parseNumber(parts[1]);
            const price = parseNumber(currentPrice);
            if (high && low && price) {
              const range = high - low;
              const position = price - low;
              changeValue = range > 0 ? (position / range) * 100 - 50 : 0;
              change = `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(1)}%`;
            }
          }
        }

        let signal = "Hold";
        if (prosCount > consCount + 2) signal = "Strong Buy";
        else if (prosCount > consCount) signal = "Buy";
        else if (consCount > prosCount + 2) signal = "Sell";
        else if (consCount > prosCount) signal = "Weak Hold";

        return {
          ticker: company.company_code,
          name: company.name || company.company_code,
          price: currentPrice || "—",
          change,
          changeValue,
          signal,
          marketCap: marketCap || 0,
        };
      })
      .filter((item) => item.marketCap > 0)
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);

    const riskAlerts = companies
      .filter((c) => (c.cons?.length || 0) > 3)
      .slice(0, 3)
      .map((company) => ({
        title: `${company.company_code} Risk Alert`,
        description: `${company.cons?.length || 0} concerns identified. ${
          company.cons?.[0] || "Review required"
        }`,
        status: "Alert",
        ticker: company.company_code,
      }));

    const opportunities = companies
      .filter((c) => (c.pros?.length || 0) > (c.cons?.length || 0) + 1)
      .slice(0, 2)
      .map((company) => ({
        title: `${company.company_code} Opportunity`,
        description: `${company.pros?.length || 0} positive factors. ${
          company.pros?.[0] || "Strong fundamentals"
        }`,
        status: "Active",
        ticker: company.company_code,
      }));

    const actions: string[] = [];
    const highROE = companies
      .filter((c) => {
        const roe = parsePercent(getMetricValue(c, "ROE"));
        return roe && roe > 20;
      })
      .slice(0, 2);
    if (highROE.length > 0) {
      actions.push(
        `Review ${highROE.map((c) => c.company_code).join(
          ", "
        )} - ROE above 20% indicates strong profitability.`
      );
    }

    const lowPE = companies
      .filter((c) => {
        const pe = parseNumber(getMetricValue(c, "Stock P/E"));
        return pe && pe > 0 && pe < 20;
      })
      .slice(0, 1);
    if (lowPE.length > 0) {
      actions.push(
        `Consider ${lowPE[0].company_code} - low valuation could be an entry point.`
      );
    }

    const highDividend = companies
      .filter((c) => {
        const div = parsePercent(getMetricValue(c, "Dividend Yield"));
        return div && div > 2;
      })
      .slice(0, 1);
    if (highDividend.length > 0) {
      actions.push(
        `Evaluate ${highDividend[0].company_code} - dividend yield above 2% suits income mandates.`
      );
    }

    const nextActions = actions.slice(0, 3);

    return {
      kpis: {
        totalCompanies: data.total_companies,
        totalMarketCap: formatMarketCap(totalMarketCap),
        highPerformingCompanies: highROECompanies + highROCECompanies,
        positiveSignals: positiveSignalCompanies,
        alerts: companiesWithAlerts,
      },
      watchlist,
      automations: [...opportunities, ...riskAlerts].slice(0, 3),
      nextActions,
    };
  }, [data]);

  const trendSeries = useMemo(() => {
    if (!dashboardData) return [];
    const avgChange =
      dashboardData.watchlist.reduce((sum, w) => sum + (w.changeValue || 0), 0) /
      (dashboardData.watchlist.length || 1);
    const base = 100;
    return Array.from({ length: 6 }).map((_, idx) => ({
      label: `T-${5 - idx}`,
      value: Math.max(0, base + avgChange * (idx - 3)),
    }));
  }, [dashboardData]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard data..." />;
  }

  if (error || !data || !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Unable to load dashboard data
          </p>
          <p className="text-muted-foreground">
            Ensure the company dataset is available and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <section
        className="brutal-card-lg p-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(15,118,110,0.8)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.5em] text-muted-foreground">
            Mission Control
          </p>
          <h1 className="text-display-sm font-display leading-tight">
            Personalized intelligence cockpit for{" "}
            <span className="text-primary">FinSightAi</span> power users.
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Monitor mandates, automate alerts, and collaborate with AI agents
            that work the way you do.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/companies">
              <Button className="brutal-button bg-primary text-primary-foreground">
                Explore Signals
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="brutal-button">
              <Download className="w-4 h-4 mr-2" />
              Export Daily Brief
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.4),transparent_60%)]" />
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Companies Tracked",
            value: dashboardData.kpis.totalCompanies.toString(),
            sub: `Last updated: ${new Date(
              data.generated_at
            ).toLocaleDateString()}`,
          },
          {
            label: "Total Market Cap",
            value: dashboardData.kpis.totalMarketCap,
            sub: `${dashboardData.kpis.highPerformingCompanies} high performers`,
          },
          {
            label: "Positive Signals",
            value: dashboardData.kpis.positiveSignals.toString(),
            sub: "Companies with strong fundamentals",
          },
          {
            label: "Risk Alerts",
            value: dashboardData.kpis.alerts.toString(),
            sub: "Require attention",
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="brutal-card p-5 bg-gradient-to-br from-card to-primary/5"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              {metric.label}
            </p>
            <p className="text-3xl font-bold">{metric.value}</p>
            <p className="text-xs font-semibold text-success">{metric.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="brutal-card-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-lg font-bold">Signal Inbox</p>
              <p className="text-sm text-muted-foreground font-medium">
                Curated opportunities & alerts
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {dashboardData.automations.map((item) => (
              <Link key={item.title} to={`/company/${item.ticker}`}>
                <div className="p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <p className="font-semibold flex items-center gap-2">
                    {item.status === "Alert" ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <p
                    className={`text-xs font-bold mt-2 ${
                      item.status === "Alert"
                        ? "text-destructive"
                        : "text-success"
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4 bg-gradient-to-br from-card to-primary/10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Trendline
            </h2>
            <span className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
              Synthetic view
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Quick glance at watchlist momentum. For full fundamentals jump to
            Companies or Compare pages.
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="brutal-card-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items=center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Watchlist
            </h2>
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {dashboardData.watchlist.map((item) => (
              <Link key={item.ticker} to={`/company/${item.ticker}`}>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-to-r from-card to-card/40 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div>
                    <p className="text-lg font-bold">{item.ticker}</p>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cnText(item.change)}>{item.change}</p>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        item.signal === "Strong Buy" || item.signal === "Buy"
                          ? "text-success"
                          : item.signal === "Sell"
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    >
                      {item.signal}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4 bg-gradient-to-br from-card to-secondary/10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Quick navigation
          </p>
          <div className="space-y-3">
            {[
              {
                to: "/companies",
                label: "Browse Companies",
                desc: "100 dossiers refreshed daily",
                icon: BarChart3,
              },
              {
                to: "/compare",
                label: "Compare Companies",
                desc: "Side-by-side analysis cockpit",
                icon: ArrowUpRight,
              },
              {
                to: "/news",
                label: "Top News Feed",
                desc: "Latest scraped headlines",
                icon: Newspaper,
              },
            ].map((link) => (
              <Link
                to={link.to}
                key={link.to}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 transition"
              >
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <link.icon className="w-4 h-4 text-primary" />
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="brutal-card-lg p-6 space-y-3 bg-gradient-to-br from-card to_primary/5">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Dataset coverage
          </p>
          <h3 className="text-2xl font-bold">
            {dashboardData.kpis.totalCompanies} companies live
          </h3>
          <p className="text-sm text-muted-foreground">
            Last scraped{" "}
            <span className="font-semibold text-primary">
              {new Date(data.generated_at).toLocaleString()}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs uppercase text-muted-foreground">Pros</p>
              <p className="text-lg font-bold text-success">
                {dashboardData.kpis.positiveSignals}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs uppercase text-muted-foreground">Alerts</p>
              <p className="text-lg font-bold text-destructive">
                {dashboardData.kpis.alerts}
              </p>
            </div>
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4 bg-gradient-to-br from-card to-secondary/10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Quick tasks
          </p>
          <div className="space-y-3">
            {dashboardData.nextActions.length > 0 ? (
              dashboardData.nextActions.map((action, idx) => (
                <div key={action} className="flex items-start gap-3">
                  <span
                    className={`mt-2 w-2 h-2 rounded-full ${
                      idx === 0
                        ? "bg-success"
                        : idx === 1
                        ? "bg-secondary"
                        : "bg-accent"
                    }`}
                  />
                  {action}
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 text-muted-foreground">
                <Bolt className="w-4 h-4 mt-1" />
                No specific actions recommended at this time.
              </div>
            )}
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4 bg-gradient-to-br from-card to-accent/10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Command center
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Check <Link className="text-primary" to="/compare">Compare</Link> for saved match-ups.
            </p>
            <p>
              • Review <Link className="text-primary" to="/news">Top News</Link> for fresh headlines.
            </p>
            <p>
              • Browse <Link className="text-primary" to="/companies">Companies</Link> for full dossiers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function cnText(change: string) {
  return change.startsWith("+")
    ? "text-success font-bold"
    : change.startsWith("-")
    ? "text-destructive font-bold"
    : "font-bold";
}


