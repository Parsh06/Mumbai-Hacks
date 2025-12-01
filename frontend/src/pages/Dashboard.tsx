import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BellRing, Brain, Download, Shield, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, LineChart, Line } from "recharts";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";
import LoadingState from "@/components/LoadingState";
import { type CompanyRecord } from "@/services/companyDataService";

// Helper functions
const parseNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parsePercent = (value: string | undefined): number | null => {
  if (!value) return null;
  const cleaned = value.replace("%", "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

const getMetricValue = (company: CompanyRecord, metric: string): string | undefined => {
  const ratio = company.key_ratios?.find((r) => r.metric === metric);
  return ratio?.value;
};

const formatMarketCap = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
  return `₹${value.toFixed(1)} Cr`;
};

export default function Dashboard() {
  const { data, isLoading, error } = useCompanyDataset();

  const dashboardData = useMemo(() => {
    if (!data) return null;

    const successfulCompanies = data.companies.filter((c) => c.status === "success");

    // Calculate KPIs
    let totalMarketCap = 0;
    let highROECompanies = 0;
    let highROCECompanies = 0;
    let positiveSignalCompanies = 0;
    let companiesWithAlerts = 0;

    successfulCompanies.forEach((company) => {
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

    // Top companies by Market Cap for watchlist
    const topCompanies = successfulCompanies
      .map((company) => {
        const marketCap = parseNumber(getMetricValue(company, "Market Cap"));
        const currentPrice = getMetricValue(company, "Current Price");
        const highLow = getMetricValue(company, "High / Low");
        const prosCount = company.pros?.length || 0;
        const consCount = company.cons?.length || 0;

        // Calculate change from High/Low
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

        // Determine signal based on pros/cons
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
          prosCount,
          consCount,
        };
      })
      .filter((c) => c.marketCap > 0)
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);

    // Portfolio trend from quarterly results (aggregate top 5 companies)
    const top5 = topCompanies.slice(0, 5);
    const quarters = new Set<string>();

    top5.forEach((item) => {
      const company = successfulCompanies.find((c) => c.company_code === item.ticker);
      if (company?.tables?.["Quarterly Results"]) {
        const qr = company.tables["Quarterly Results"];
        const firstRow = qr[0];
        if (firstRow) {
          Object.keys(firstRow).forEach((key) => {
            if (key !== "" && key.match(/[A-Za-z]{3} \d{4}/)) {
              quarters.add(key);
            }
          });
        }
      }
    });

    const sortedQuarters = Array.from(quarters).sort().slice(-5);
    const portfolioTrend = sortedQuarters.map((quarter) => {
      let totalSales = 0;
      let count = 0;

      top5.forEach((item) => {
        const company = successfulCompanies.find((c) => c.company_code === item.ticker);
        if (company?.tables?.["Quarterly Results"]) {
          const qr = company.tables["Quarterly Results"];
          const salesRow = qr.find((row) => row[""] === "Sales +");
          if (salesRow && salesRow[quarter]) {
            const sales = parseNumber(salesRow[quarter]);
            if (sales) {
              totalSales += sales;
              count++;
            }
          }
        }
      });

      return {
        label: quarter,
        value: count > 0 ? totalSales / count / 1000 : 0, // Normalize to thousands
      };
    });

    // Risk alerts (companies with many cons)
    const riskAlerts = successfulCompanies
      .filter((c) => (c.cons?.length || 0) > 3)
      .slice(0, 3)
      .map((company) => ({
        title: `${company.company_code} Risk Alert`,
        description: `${company.cons?.length || 0} concerns identified. ${company.cons?.[0] || "Review required"}`,
        status: "Alert",
        ticker: company.company_code,
      }));

    // Opportunity signals (companies with strong pros)
    const opportunities = successfulCompanies
      .filter((c) => (c.pros?.length || 0) > (c.cons?.length || 0) + 1)
      .slice(0, 2)
      .map((company) => ({
        title: `${company.company_code} Opportunity`,
        description: `${company.pros?.length || 0} positive factors. ${company.pros?.[0] || "Strong fundamentals"}`,
        status: "Active",
        ticker: company.company_code,
      }));

    // Next best actions
    const actions: string[] = [];

    // High ROE companies
    const highROE = successfulCompanies
      .filter((c) => {
        const roe = parsePercent(getMetricValue(c, "ROE"));
        return roe && roe > 20;
      })
      .slice(0, 2);
    if (highROE.length > 0) {
      actions.push(`Review ${highROE.map((c) => c.company_code).join(", ")} - High ROE (>20%) indicates strong profitability.`);
    }

    // Low P/E companies
    const lowPE = successfulCompanies
      .filter((c) => {
        const pe = parseNumber(getMetricValue(c, "Stock P/E"));
        return pe && pe > 0 && pe < 20;
      })
      .slice(0, 1);
    if (lowPE.length > 0) {
      actions.push(`Consider ${lowPE[0].company_code} - Low P/E ratio suggests potential value opportunity.`);
    }

    // High dividend yield
    const highDividend = successfulCompanies
      .filter((c) => {
        const div = parsePercent(getMetricValue(c, "Dividend Yield"));
        return div && div > 2;
      })
      .slice(0, 1);
    if (highDividend.length > 0) {
      actions.push(`Evaluate ${highDividend[0].company_code} - High dividend yield (>2%) for income-focused portfolios.`);
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
      watchlist: topCompanies,
      portfolioTrend,
      automations: [...opportunities, ...riskAlerts].slice(0, 3),
      nextActions,
    };
  }, [data]);

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
            Monitor mandates, automate alerts, and collaborate with AI agents that work the way
            you do.
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
            sub: `Last updated: ${new Date(data.generated_at).toLocaleDateString()}` 
          },
          { 
            label: "Total Market Cap", 
            value: dashboardData.kpis.totalMarketCap, 
            sub: `${dashboardData.kpis.highPerformingCompanies} high performers` 
          },
          { 
            label: "Positive Signals", 
            value: dashboardData.kpis.positiveSignals.toString(), 
            sub: "Companies with strong fundamentals" 
          },
          { 
            label: "Risk Alerts", 
            value: dashboardData.kpis.alerts.toString(), 
            sub: "Require attention" 
          },
        ].map((metric) => (
          <div key={metric.label} className="brutal-card p-5 bg-gradient-to-br from-card to-primary/5">
            <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-bold">{metric.value}</p>
            <p className="text-xs font-semibold text-success">{metric.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="brutal-card-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Portfolio Pulse</h2>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.35em]">
              Real-time
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dashboardData.portfolioTrend}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", borderRadius: 12 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="brutal-card-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-lg font-bold">Signal Inbox</p>
              <p className="text-sm text-muted-foreground font-medium">
                3 priority triggers awaiting review
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
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className={`text-xs font-bold mt-2 ${item.status === "Alert" ? "text-destructive" : "text-success"}`}>
                    {item.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="brutal-card-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
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
                    <p className="text-xs text-muted-foreground mt-1">{item.price}</p>
                  </div>
                  <div className="text-right">
                    <p className={cnText(item.change)}>{item.change}</p>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${
                      item.signal === "Strong Buy" || item.signal === "Buy" ? "text-success" :
                      item.signal === "Sell" ? "text-destructive" : "text-primary"
                    }`}>
                      {item.signal}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Next best actions</h2>
          <ul className="space-y-3 text-sm font-medium">
            {dashboardData.nextActions.length > 0 ? (
              dashboardData.nextActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-2 ${
                    idx === 0 ? "bg-success" : idx === 1 ? "bg-secondary" : "bg-accent"
                  }`} />
                  {action}
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
                No specific actions recommended at this time.
              </li>
            )}
          </ul>
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

