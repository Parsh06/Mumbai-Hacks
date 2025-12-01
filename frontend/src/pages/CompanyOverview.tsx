import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  ExternalLink,
  BarChart3,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import InsightsPanel from "@/components/InsightsPanel";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { findCompanyRecord, CompanyRecord } from "@/services/companyDataService";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";

type TableRow = Record<string, string>;

const DATA_SECTIONS = [
  "Quarterly Results",
  "Profit and Loss",
  "Cash Flow",
  "Balance Sheet",
  "Ratios",
] as const;

const parseNumericValue = (value?: string | number | null): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9\.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildQuarterlyChartData = (rows?: TableRow[]) => {
  if (!rows || rows.length === 0) return [];
  const quarterKeys = Object.keys(rows[0]).filter((key) => key !== "");
  const salesRow = rows.find((row) => row[""] === "Sales +");
  const netProfitRow = rows.find((row) => row[""] === "Net Profit +");
  const epsRow = rows.find((row) => row[""] === "EPS in Rs");

  return quarterKeys
    .map((quarter) => ({
      quarter,
      sales: parseNumericValue(salesRow?.[quarter]),
      netProfit: parseNumericValue(netProfitRow?.[quarter]),
      eps: parseNumericValue(epsRow?.[quarter]),
    }))
    .filter(
      (item) => item.sales !== null || item.netProfit !== null || item.eps !== null
    );
};

const buildAnnualPnlChartData = (rows?: TableRow[]) => {
  if (!rows || rows.length === 0) return [];
  const yearKeys = Object.keys(rows[0]).filter((key) => key !== "");
  const salesRow =
    rows.find((row) => row[""] === "Sales") ||
    rows.find((row) => row[""] === "Sales +");
  const netProfitRow =
    rows.find((row) => row[""] === "Net Profit") ||
    rows.find((row) => row[""] === "Net Profit +");

  return yearKeys
    .map((year) => ({
      year,
      sales: parseNumericValue(salesRow?.[year]),
      netProfit: parseNumericValue(netProfitRow?.[year]),
    }))
    .filter(
      (item) => item.sales !== null || item.netProfit !== null
    );
};

const buildCashFlowChartData = (rows?: TableRow[]) => {
  if (!rows || rows.length === 0) return [];
  const yearKeys = Object.keys(rows[0]).filter((key) => key !== "");

  const opRow =
    rows.find((row) => row[""] === "Cash from Operating Activity") ||
    rows.find((row) => row[""] === "Cash from Operating Activities");
  const invRow =
    rows.find((row) => row[""] === "Cash from Investing Activity") ||
    rows.find((row) => row[""] === "Cash from Investing Activities");
  const finRow =
    rows.find((row) => row[""] === "Cash from Financing Activity") ||
    rows.find((row) => row[""] === "Cash from Financing Activities");

  return yearKeys
    .map((year) => ({
      year,
      operating: parseNumericValue(opRow?.[year]) ?? 0,
      investing: parseNumericValue(invRow?.[year]) ?? 0,
      financing: parseNumericValue(finRow?.[year]) ?? 0,
    }))
    .filter(
      (item) =>
        item.operating !== 0 || item.investing !== 0 || item.financing !== 0
    );
};

const DataTable = ({ rows }: { rows?: TableRow[] }) => {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No data available for this section
      </p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="py-3 pr-4 font-bold whitespace-nowrap">
                {col === "" ? "Metric" : col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-border/60 hover:bg-muted/20 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className={`py-3 pr-4 ${
                    col === "" ? "font-semibold" : "text-right font-medium"
                  }`}
                >
                  {row[col] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getRatioCards = (company?: CompanyRecord) => {
  if (!company) return [];
  return (company.key_ratios ?? []).slice(0, 4);
};

const getRatioValue = (company: CompanyRecord | undefined, metric: string) => {
  if (!company) return "—";
  const ratio = (company.key_ratios || []).find((r) => r.metric === metric);
  return ratio?.value ?? "—";
};

const parseMarketCap = (value: string | undefined): number | null => {
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

const computeFactorScores = (company: CompanyRecord | undefined) => {
  if (!company) {
    return { value: 0, quality: 0, growth: 0 };
  }

  const pe = parseNumericValue(getRatioValue(company, "Stock P/E"));
  const dy = parsePercent(getRatioValue(company, "Dividend Yield"));
  const pb = parseNumericValue(getRatioValue(company, "Book Value"));
  const roe = parsePercent(getRatioValue(company, "ROE"));
  const roce = parsePercent(getRatioValue(company, "ROCE"));

  let value = 50;
  if (pe !== null) {
    if (pe < 15) value += 20;
    else if (pe < 25) value += 10;
    else if (pe > 40) value -= 10;
  }
  if (dy !== null) {
    if (dy > 3) value += 20;
    else if (dy > 1) value += 10;
  }
  if (pb !== null) {
    if (pb < 2) value += 10;
    else if (pb > 5) value -= 10;
  }

  let quality = 50;
  if (roe !== null) {
    if (roe > 20) quality += 20;
    else if (roe > 15) quality += 10;
  }
  if (roce !== null) {
    if (roce > 20) quality += 20;
    else if (roce > 15) quality += 10;
  }

  let growth = 50;
  if (roe !== null) {
    if (roe > 18) growth += 15;
    else if (roe > 12) growth += 8;
  }
  if (dy !== null && dy < 1) {
    growth += 5;
  }
  if (revenueCagr3Y !== null && revenueCagr3Y > 0.1) {
    growth += 10;
  }

  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return {
    value: clamp(value),
    quality: clamp(quality),
    growth: clamp(growth),
  };
};

const buildInsights = (company?: CompanyRecord) => {
  if (!company) return [];
  return [
    ...company.pros.map((text) => ({ type: "strength" as const, text })),
    ...company.cons.map((text) => ({ type: "weakness" as const, text })),
  ];
};

type ChartType = "sales-profit" | "profitability" | "valuation" | "cashflow";
type Frequency = "quarterly" | "annual";

export default function CompanyOverview() {
  const { ticker = "RELIANCE" } = useParams();
  const [selectedChart, setSelectedChart] = useState<ChartType>("sales-profit");
  const [frequency, setFrequency] = useState<Frequency>("quarterly");

  const { data, isLoading, error } = useCompanyDataset();

  const company = useMemo(
    () => findCompanyRecord(data, ticker),
    [data, ticker]
  );

  const quarterlyChartData = useMemo(
    () => buildQuarterlyChartData(company?.tables?.["Quarterly Results"]),
    [company]
  );

  const annualPnlData = useMemo(
    () => buildAnnualPnlChartData(company?.tables?.["Profit and Loss"]),
    [company]
  );

  const cashFlowData = useMemo(
    () => buildCashFlowChartData(company?.tables?.["Cash Flow"]),
    [company]
  );

  const salesProfitChartData = useMemo(() => {
    if (frequency === "quarterly") {
      return quarterlyChartData.map((d) => ({
        period: d.quarter,
        sales: d.sales,
        netProfit: d.netProfit,
      }));
    }
    return annualPnlData.map((d) => ({
      period: d.year,
      sales: d.sales,
      netProfit: d.netProfit,
    }));
  }, [frequency, quarterlyChartData, annualPnlData]);

  // Simple 3-year revenue CAGR and net margin trend from annual P&L
  const revenueCagr3Y = useMemo(() => {
    if (!annualPnlData || annualPnlData.length < 3) return null;
    const recent = annualPnlData.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    if (!first.sales || !last.sales || first.sales === 0) return null;
    const years = recent.length - 1 || 1;
    const cagr = Math.pow(last.sales / first.sales, 1 / years) - 1;
    return Number.isFinite(cagr) ? cagr : null;
  }, [annualPnlData]);

  const marginTrend3Y = useMemo(() => {
    if (!annualPnlData || annualPnlData.length < 3) return null;
    const recent = annualPnlData.slice(-3);
    const margins = recent
      .map((r) =>
        r.sales && r.netProfit ? r.netProfit / r.sales : null
      )
      .filter((m): m is number => m !== null);
    if (margins.length < 2) return null;
    const delta = margins[margins.length - 1] - margins[0];
    return delta;
  }, [annualPnlData]);

  const insights = useMemo(() => buildInsights(company), [company]);
  const ratioCards = useMemo(() => getRatioCards(company), [company]);
  const tables = company?.tables ?? {};
  const factorScores = useMemo(() => computeFactorScores(company), [company]);

  // Simple peer selection: same sector & similar market cap bucket
  const peers = useMemo(() => {
    if (!data || !company) return [];

    const sector = company.sector || company.industry || "";
    const mkcapRaw = getRatioValue(company, "Market Cap");
    const mkcap = parseMarketCap(mkcapRaw);

    // bucket market cap into rough ranges (in crores)
    const getBucket = (val: number | null) => {
      if (val === null) return "unknown";
      if (val < 5_000) return "small";
      if (val < 50_000) return "mid";
      if (val < 2_00_000) return "large";
      return "mega";
    };

    const targetBucket = getBucket(mkcap);

    return (data.companies || [])
      .filter((c) => c.company_code !== company.company_code)
      .filter((c) => {
        const sameSector =
          !sector ||
          c.sector === sector ||
          c.industry === sector;
        const bucket = getBucket(
          parseMarketCap(getRatioValue(c, "Market Cap"))
        );
        return sameSector && bucket === targetBucket;
      })
      .slice(0, 5);
  }, [data, company]);

  if (isLoading) {
    return <LoadingState label={`Loading ${ticker} intel...`} />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Unable to load dossier
          </p>
          <p className="text-muted-foreground">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-2xl font-bold">Company not found</p>
          <p className="text-muted-foreground">
            We couldn't locate a dossier for ticker{" "}
            <span className="font-semibold">{ticker}</span>.
          </p>
          <Button asChild className="brutal-button mt-2">
            <Link to="/companies">
              <TrendingUp className="w-4 h-4 mr-2" />
              Browse all companies
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="brutal-card-lg p-6 md:p-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border-3 border-border bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-semibold">
                {company.company_code}
              </p>
              <h1 className="text-display-sm font-display">
                {company.name || company.company_code}
              </h1>
            </div>
          </div>
          {company.about && (
            <p className="text-muted-foreground font-medium max-w-3xl">
              {company.about}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {company.url && (
            <Button asChild variant="outline" className="brutal-button">
              <a href={company.url} target="_blank" rel="noreferrer">
                Open source filing <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
          <Link to="/companies" className="text-primary font-semibold">
            ← Back to FinSightAi graph
          </Link>
        </div>
      </div>

      {ratioCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ratioCards.map((ratio) => (
            <MetricCard key={ratio.metric} label={ratio.metric} value={ratio.value} />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart selector with dropdown + frequency toggle + trend badges */}
          <div className="brutal-card-lg p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-display-sm font-display">Financial Visualizations</h2>
                <p className="text-xs text-muted-foreground">
                  Toggle between quarterly and annual views, and scan quick trend badges.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full ${
                      frequency === "quarterly"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setFrequency("quarterly")}
                  >
                    Quarterly
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full ${
                      frequency === "annual"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setFrequency("annual")}
                  >
                    Annual
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value as ChartType)}
                    className="brutal-input pr-10 pl-4 py-2 font-semibold appearance-none cursor-pointer bg-card border-border text-sm"
                  >
                    <option value="sales-profit">Sales & Profit Trends (Line)</option>
                    <option value="profitability">ROE/ROCE Comparison (Bar)</option>
                    <option value="valuation">Valuation Ratios (Bar)</option>
                    <option value="cashflow">Cash Flow Breakdown (Stacked)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Trend badges computed from annual P&L */}
            <div className="flex flex-wrap gap-2">
              {revenueCagr3Y !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${
                    revenueCagr3Y > 0
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/40"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Revenue CAGR 3Y: {(revenueCagr3Y * 100).toFixed(1)}%
                </span>
              )}
              {marginTrend3Y !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${
                    marginTrend3Y > 0.01
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                      : marginTrend3Y < -0.01
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/40"
                      : "bg-slate-500/10 text-slate-300 border border-slate-500/30"
                  }`}
                >
                  Net margin{" "}
                  {marginTrend3Y > 0.01
                    ? "improving"
                    : marginTrend3Y < -0.01
                    ? "compressing"
                    : "stable"}
                </span>
              )}
            </div>

            <div className="brutal-card p-6 min-h-[400px] bg-gradient-to-br from-card to-primary/5">
              {/* Sales & Profit Trends (Line Chart) */}
              {selectedChart === "sales-profit" && salesProfitChartData.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">
                    {frequency === "quarterly"
                      ? "Quarterly Sales & Profit Trends"
                      : "Annual Sales & Profit Trends"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Track revenue and net profit growth over{" "}
                    {frequency === "quarterly" ? "recent quarters" : "the last few years"}.
                  </p>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={salesProfitChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Sales"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netProfit"
                        name="Net Profit"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ROE/ROCE Comparison (Bar Chart) */}
              {selectedChart === "profitability" && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Profitability Ratios</h3>
                  <p className="text-xs text-muted-foreground">
                    Return on Equity (ROE) and Return on Capital Employed (ROCE) comparison
                  </p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[
                        {
                          metric: "ROE (%)",
                          value: parseNumericValue(
                            company.key_ratios.find((r) => r.metric === "ROE")?.value
                          ) ?? 0,
                        },
                        {
                          metric: "ROCE (%)",
                          value: parseNumericValue(
                            company.key_ratios.find((r) => r.metric === "ROCE")?.value
                          ) ?? 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name={company.company_code}
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Valuation Ratios (Bar Chart) */}
              {selectedChart === "valuation" && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Valuation Snapshot</h3>
                  <p className="text-xs text-muted-foreground">
                    Price-to-Earnings (P/E), Book Value, and Dividend Yield
                  </p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[
                        {
                          metric: "P/E",
                          value: parseNumericValue(
                            company.key_ratios.find((r) => r.metric === "Stock P/E")?.value
                          ) ?? 0,
                        },
                        {
                          metric: "Book Value",
                          value: parseNumericValue(
                            company.key_ratios.find((r) => r.metric === "Book Value")?.value
                          ) ?? 0,
                        },
                        {
                          metric: "Dividend Yield (%)",
                          value: parseNumericValue(
                            company.key_ratios.find((r) => r.metric === "Dividend Yield")?.value
                          ) ?? 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="metric" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name={company.company_code}
                        fill="hsl(var(--secondary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cash Flow Breakdown (Stacked Bar Chart) */}
              {selectedChart === "cashflow" && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Cash Flow Breakdown</h3>
                  <p className="text-xs text-muted-foreground">
                    Operating, Investing, and Financing cash flows by year
                  </p>
                  {cashFlowData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="operating"
                          name="Operating"
                          stackId="cf"
                          fill="hsl(var(--success))"
                        />
                        <Bar
                          dataKey="investing"
                          name="Investing"
                          stackId="cf"
                          fill="hsl(var(--destructive))"
                        />
                        <Bar
                          dataKey="financing"
                          name="Financing"
                          stackId="cf"
                          fill="hsl(var(--accent))"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <p>Cash flow data not available for this company</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback if no data */}
              {selectedChart === "sales-profit" && quarterlyChartData.length === 0 && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Quarterly data not available for this company</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Financial statements</h2>
              <p className="text-sm text-muted-foreground">
                Raw financial tables from the underlying data source
              </p>
            </div>
            <Tabs defaultValue="Quarterly Results" className="space-y-4">
              <TabsList className="brutal-card p-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                {DATA_SECTIONS.map((section) => (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className="text-xs font-semibold"
                  >
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
              {DATA_SECTIONS.map((section) => (
                <TabsContent key={section} value={section}>
                  <div className="brutal-card p-6">
                    <DataTable rows={tables[section]} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          {insights.length > 0 && (
            <InsightsPanel
              insights={insights}
              title="FinSightAi qualitative notes"
            />
          )}

          {/* Peer Snapshot */}
          {peers.length > 0 && (
            <div className="brutal-card-lg p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Peer Snapshot
                </h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  {peers.length} similar names
                </p>
              </div>
              <div className="space-y-3">
                {peers.map((peer) => (
                  <button
                    key={peer.company_code}
                    type="button"
                    className="w-full text-left brutal-card p-3 bg-card/80 hover:bg-card transition-colors flex flex-col gap-2"
                    onClick={() => {
                      window.location.href = `/company/${peer.company_code}`;
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                          {peer.company_code}
                        </p>
                        <p className="text-sm font-semibold line-clamp-1">
                          {peer.name || peer.company_code}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-muted/60">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        {getRatioValue(peer, "Market Cap")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <p className="uppercase tracking-wide">P/E</p>
                        <p className="font-semibold text-foreground">
                          {getRatioValue(peer, "Stock P/E")}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide">ROE</p>
                        <p className="font-semibold text-foreground">
                          {getRatioValue(peer, "ROE")}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide">ROCE</p>
                        <p className="font-semibold text-foreground">
                          {getRatioValue(peer, "ROCE")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="brutal-card p-6 space-y-4">
            <h3 className="text-xl font-bold">Snapshot</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Pros identified</span>
                <span className="font-semibold text-success">
                  {company.pros.length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Cons flagged</span>
                <span className="font-semibold text-destructive">
                  {company.cons.length}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Tables scraped</span>
                <span className="font-semibold">
                  {Object.keys(tables).length}
                </span>
              </li>
              {company.url && (
                <li className="flex justify-between">
                  <span>Source</span>
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold flex items-center gap-1"
                  >
                    View underlying page <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>

            {/* Factor score mini-bars */}
            <div className="mt-3 space-y-2 text-xs">
              <p className="font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                Factor profile
              </p>
              {(["value", "quality", "growth"] as const).map((key) => {
                const label =
                  key === "value"
                    ? "Value"
                    : key === "quality"
                    ? "Quality"
                    : "Growth";
                const score = factorScores[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-14 text-[11px] text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 70
                            ? "bg-emerald-500"
                            : score >= 40
                            ? "bg-amber-400"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-muted-foreground">
                      {score.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button asChild variant="outline" className="brutal-button w-full">
            <Link to={`/compare?left=${company.company_code}&right=TCS`}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Launch comparison cockpit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

