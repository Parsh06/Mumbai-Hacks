import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/LoadingState";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";
import {
  findCompanyRecord,
  type CompanyRecord,
} from "@/services/companyDataService";
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
import { ChevronDown, Sparkles } from "lucide-react";

type KeyMetric = {
  label: string;
  metric: string;
};

const KEY_METRICS: KeyMetric[] = [
  { label: "Market Cap", metric: "Market Cap" },
  { label: "Current Price", metric: "Current Price" },
  { label: "52W High / Low", metric: "High / Low" },
  { label: "Stock P/E", metric: "Stock P/E" },
  { label: "Book Value", metric: "Book Value" },
  { label: "Dividend Yield", metric: "Dividend Yield" },
  { label: "ROCE", metric: "ROCE" },
  { label: "ROE", metric: "ROE" },
];

const getMetricValue = (company: CompanyRecord | undefined, metric: string) => {
  if (!company) return "—";
  const ratio = (company.key_ratios || []).find((r) => r.metric === metric);
  return ratio?.value ?? "—";
};

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

type TableRow = Record<string, string>;

const buildQuarterlyChartData = (rows?: TableRow[]) => {
  if (!rows || rows.length === 0) return [];
  const quarterKeys = Object.keys(rows[0]).filter((key) => key !== "");
  const salesRow = rows.find((row) => row[""] === "Sales +");
  const netProfitRow = rows.find((row) => row[""] === "Net Profit +");

  return quarterKeys
    .map((quarter) => ({
      quarter,
      sales: parseNumber(salesRow?.[quarter] ?? undefined),
      netProfit: parseNumber(netProfitRow?.[quarter] ?? undefined),
    }))
    .filter(
      (item) => item.sales !== null || item.netProfit !== null
    );
};


type ChartMetric = { label: string; metric: string; type: "number" | "percent" };

type ChartConfig = {
  id: "sales-profit" | "profitability" | "valuation";
  label: string;
  description: string;
  chartType: "line" | "bar";
  metrics?: ChartMetric[];
};

const CHART_CONFIGS: ChartConfig[] = [
  {
    id: "sales-profit",
    label: "Sales & Profit Trends (Line)",
    description: "Quarterly sales and net profit trends (2022-2025) showing growth patterns.",
    chartType: "line",
  },
  {
    id: "profitability",
    label: "ROE/ROCE Comparison (Bar)",
    description: "Compare return ratios and dividend yield between the two companies.",
    chartType: "bar",
    metrics: [
      { label: "ROE (%)", metric: "ROE", type: "percent" },
      { label: "ROCE (%)", metric: "ROCE", type: "percent" },
      { label: "Dividend Yield (%)", metric: "Dividend Yield", type: "percent" },
    ],
  },
  {
    id: "valuation",
    label: "Valuation Ratios (Bar)",
    description: "See how the market prices earnings and book value for each company.",
    chartType: "bar",
    metrics: [
      { label: "P/E", metric: "Stock P/E", type: "number" },
      { label: "Book Value", metric: "Book Value", type: "number" },
      { label: "Dividend Yield (%)", metric: "Dividend Yield", type: "percent" },
    ],
  },
];

export default function CompareCompanies() {
  const { data, isLoading, error } = useCompanyDataset();
  const [leftTicker, setLeftTicker] = useState<string>("");
  const [rightTicker, setRightTicker] = useState<string>("");
  const [leftQuery, setLeftQuery] = useState<string>("");
  const [rightQuery, setRightQuery] = useState<string>("");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [chartMode, setChartMode] = useState<ChartConfig["id"]>("sales-profit");

  const options = useMemo(
    () =>
      (data?.companies ?? [])
        .filter((c) => c.status === "success")
        .map((c) => ({
          ticker: c.company_code,
          name: c.name || c.company_code,
        })),
    [data]
  );

  const filteredLeft = useMemo(
    () =>
      options.filter(
        (o) =>
          o.name.toLowerCase().includes(leftQuery.toLowerCase()) ||
          o.ticker.toLowerCase().includes(leftQuery.toLowerCase())
      ),
    [options, leftQuery]
  );

  const filteredRight = useMemo(
    () =>
      options.filter(
        (o) =>
          o.name.toLowerCase().includes(rightQuery.toLowerCase()) ||
          o.ticker.toLowerCase().includes(rightQuery.toLowerCase())
      ),
    [options, rightQuery]
  );

  const leftCompany = useMemo(
    () => (data && leftTicker ? findCompanyRecord(data, leftTicker) : undefined),
    [data, leftTicker]
  );

  const rightCompany = useMemo(
    () => (data && rightTicker ? findCompanyRecord(data, rightTicker) : undefined),
    [data, rightTicker]
  );

  const handleShow = () => {
    if (leftTicker && rightTicker && leftTicker !== rightTicker) {
      setShowComparison(true);
    } else {
      setShowComparison(false);
    }
  };

  const handleInvestmentAnalysis = () => {
    // Button is kept but does nothing
    return;
  };

  if (isLoading) {
    return <LoadingState label="Loading comparison dataset..." />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Unable to load comparison data
          </p>
          <p className="text-muted-foreground">
            Ensure the dataset is available and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div
        className="brutal-card-lg p-6 md:p-8 space-y-4 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(15,23,42,0.9), rgba(6,78,59,0.85)), url('https://images.unsplash.com/photo-1556761175-129418cb2dfe?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(52,211,153,0.25),transparent_55%)] opacity-70" />
        <div className="relative z-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground font-semibold">
            FinSightAi Comparator
          </p>
          <h1 className="text-display-sm md:text-display-md font-display">
            Put two companies head to head.
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Search by name or ticker for each side. Hit{" "}
            <span className="font-semibold text-primary">Show data</span> to
            reveal the key financials side by side.
          </p>
        </div>
      </div>

      {/* Search-based selection row */}
      <div className="brutal-card-lg p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <input
              className="brutal-input w-full px-4 py-3 font-semibold"
              placeholder="Search by name or ticker…"
              value={leftQuery}
              onChange={(e) => {
                setLeftQuery(e.target.value);
                setLeftOpen(true);
              }}
              onFocus={() => setLeftOpen(true)}
            />
            {leftOpen && filteredLeft.length > 0 && (
              <div className="absolute top-full mt-2 w-full brutal-card bg-card max-h-64 overflow-y-auto z-20">
                {filteredLeft.slice(0, 10).map((opt) => (
                  <button
                    key={opt.ticker}
                    type="button"
                    onClick={() => {
                      setLeftTicker(opt.ticker);
                      setLeftQuery(`${opt.ticker} — ${opt.name}`);
                      setLeftOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center border-b border-border last:border-b-0"
                  >
                    <span className="font-semibold">{opt.name}</span>
                    <span className="text-xs font-bold text-primary">
                      {opt.ticker}
                    </span>
                  </button>
                ))}
          </div>
            )}
        </div>

          <div className="space-y-2 relative">
            <input
              className="brutal-input w-full px-4 py-3 font-semibold"
              placeholder="Search by name or ticker…"
              value={rightQuery}
              onChange={(e) => {
                setRightQuery(e.target.value);
                setRightOpen(true);
              }}
              onFocus={() => setRightOpen(true)}
            />
            {rightOpen && filteredRight.length > 0 && (
              <div className="absolute top-full mt-2 w-full brutal-card bg-card max-h-64 overflow-y-auto z-20">
                {filteredRight.slice(0, 10).map((opt) => (
                  <button
                    key={opt.ticker}
                    type="button"
                    onClick={() => {
                      setRightTicker(opt.ticker);
                      setRightQuery(`${opt.ticker} — ${opt.name}`);
                      setRightOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center border-b border-border last:border-b-0"
                  >
                    <span className="font-semibold">{opt.name}</span>
                    <span className="text-xs font-bold text-primary">
                      {opt.ticker}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

        <div className="flex justify-center">
          <Button
            className="brutal-button bg-primary text-primary-foreground"
            onClick={handleShow}
            disabled={
              !leftTicker || !rightTicker || leftTicker === rightTicker
            }
          >
            Show data
          </Button>
      </div>

        {!showComparison && (
          <p className="text-xs text-muted-foreground text-center">
            Search and pick two different companies, then click{" "}
            <span className="font-semibold">Show data</span> to view the
            comparison.
          </p>
        )}
        </div>

      {/* Side-by-side comparison */}
      {showComparison && leftCompany && rightCompany && (
        <div className="brutal-card-lg p-6 space-y-8">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div />
            <div className="space-y-1 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                {leftCompany.company_code}
              </p>
              <p className="text-xl font-bold">
                {leftCompany.name || leftCompany.company_code}
              </p>
              </div>
            <div className="space-y-1 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                {rightCompany.company_code}
              </p>
              <p className="text-xl font-bold">
                {rightCompany.name || rightCompany.company_code}
          </p>
        </div>
      </div>

          <div className="overflow-x-auto brutal-card bg-card/80 border border-border/80 rounded-xl shadow-[var(--shadow-brutal-lg)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left bg-muted/40">
                  <th className="py-3 pr-4 pl-4 font-bold text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Metric
                  </th>
                  <th className="py-3 pr-4 text-center font-bold text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {leftCompany.company_code}
                  </th>
                  <th className="py-3 pr-4 text-center font-bold text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {rightCompany.company_code}
                  </th>
                </tr>
              </thead>
              <tbody>
                {KEY_METRICS.map((m, idx) => (
                  <tr
                    key={m.metric}
                    className={`border-b border-border/40 ${
                      idx % 2 === 0 ? "bg-background/40" : "bg-background/10"
                    } hover:bg-primary/5 transition-colors`}
                  >
                    <td className="py-3 pr-4 pl-4 font-semibold text-xs sm:text-sm">
                      {m.label}
                    </td>
                    <td className="py-3 pr-4 text-center font-medium text-xs sm:text-sm">
                      {getMetricValue(leftCompany, m.metric)}
                    </td>
                    <td className="py-3 pr-4 text-center font-medium text-xs sm:text-sm">
                      {getMetricValue(rightCompany, m.metric)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual chart with dropdown */}
          <div className="brutal-card-lg p-6 bg-gradient-to-br from-card to-primary/5 border border-border/80 rounded-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
                <h3 className="text-lg font-bold">Financial Visualizations</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Compare key metrics across both companies
            </p>
          </div>
              <div className="relative">
                <select
                  className="brutal-input pr-10 pl-4 py-2 font-semibold appearance-none cursor-pointer bg-card border-border text-sm"
                  value={chartMode}
                  onChange={(e) =>
                    setChartMode(e.target.value as ChartConfig["id"])
                  }
                >
                  {CHART_CONFIGS.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
            <p className="text-xs text-muted-foreground">
              {
                CHART_CONFIGS.find((cfg) => cfg.id === chartMode)
                  ?.description
              }
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "sales-profit" ? (
                  (() => {
                    const leftData = buildQuarterlyChartData(leftCompany?.tables?.["Quarterly Results"]);
                    const rightData = buildQuarterlyChartData(rightCompany?.tables?.["Quarterly Results"]);
                    const allQuarters = Array.from(
                      new Set([
                        ...leftData.map((d) => d.quarter),
                        ...rightData.map((d) => d.quarter),
                      ])
                    ).sort();
                    const combinedData = allQuarters.map((q) => {
                      const left = leftData.find((d) => d.quarter === q);
                      const right = rightData.find((d) => d.quarter === q);
                      return {
                        quarter: q,
                        [`${leftCompany.company_code} Sales`]: left?.sales ?? null,
                        [`${leftCompany.company_code} Net Profit`]: left?.netProfit ?? null,
                        [`${rightCompany.company_code} Sales`]: right?.sales ?? null,
                        [`${rightCompany.company_code} Net Profit`]: right?.netProfit ?? null,
                      };
                    });
                    return (
                      <LineChart data={combinedData} margin={{ top: 16, right: 24, left: 8, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="quarter" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${leftCompany.company_code} Sales`}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${leftCompany.company_code} Net Profit`}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${rightCompany.company_code} Sales`}
                          stroke="hsl(var(--secondary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${rightCompany.company_code} Net Profit`}
                          stroke="hsl(var(--secondary))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    );
                  })()
                ) : (
                  <BarChart
                    data={(
                      CHART_CONFIGS.find((cfg) => cfg.id === chartMode)
                        ?.metrics ?? []
                    ).map((m) => {
                      const leftRaw =
                        getMetricValue(leftCompany, m.metric) ?? undefined;
                      const rightRaw =
                        getMetricValue(rightCompany, m.metric) ?? undefined;
                      const parser =
                        m.type === "percent" ? parsePercent : parseNumber;
                      return {
                        metric: m.label,
                        left: parser(leftRaw as string) ?? 0,
                        right: parser(rightRaw as string) ?? 0,
                      };
                    })}
                    margin={{ top: 16, right: 24, left: 8, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="metric"
                      tick={{ fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="left"
                      name={leftCompany.company_code}
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    />
                    <Bar
                      dataKey="right"
                      name={rightCompany.company_code}
                      fill="hsl(var(--secondary))"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Investment Analysis Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleInvestmentAnalysis}
              disabled
              className="brutal-button bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground opacity-60 cursor-not-allowed px-8 py-6 text-lg font-bold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Analysis for Investments
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

