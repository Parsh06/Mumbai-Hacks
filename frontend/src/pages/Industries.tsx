import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const INDUSTRIES = [
  "IT Services",
  "Banking",
  "Oil & Gas",
  "Telecommunications",
  "Pharmaceuticals",
];

const INDUSTRY_DATA = {
  "IT Services": {
    avgRoe: "32.5%",
    avgDE: "0.18",
    avgEbitMargin: "24.2%",
    companies: [
      { ticker: "TCS", name: "Tata Consultancy Services", marketCap: "14.2T", roe: "44.2%", de: "0.08", growth: "13.2%" },
      { ticker: "INFY", name: "Infosys", marketCap: "6.9T", roe: "31.5%", de: "0.15", growth: "11.7%" },
      { ticker: "WIPRO", name: "Wipro", marketCap: "3.2T", roe: "18.2%", de: "0.22", growth: "8.5%" },
    ],
  },
  Banking: {
    avgRoe: "14.8%",
    avgDE: "6.2",
    avgEbitMargin: "N/A",
    companies: [
      { ticker: "HDFCBANK", name: "HDFC Bank", marketCap: "11.5T", roe: "17.2%", de: "7.1", growth: "9.5%" },
      { ticker: "ICICIBANK", name: "ICICI Bank", marketCap: "7.8T", roe: "16.5%", de: "6.8", growth: "10.2%" },
      { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", marketCap: "4.2T", roe: "13.8%", de: "5.2", growth: "8.8%" },
    ],
  },
};

const CHART_DATA = [
  {
    metric: "ROE",
    "IT Services": 32.5,
    Banking: 14.8,
    "Oil & Gas": 9.5,
  },
  {
    metric: "EBIT Margin",
    "IT Services": 24.2,
    Banking: 0,
    "Oil & Gas": 12.8,
  },
];

export default function Industries() {
  const [selectedIndustry, setSelectedIndustry] = useState("IT Services");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const industryData =
    INDUSTRY_DATA[selectedIndustry as keyof typeof INDUSTRY_DATA] ||
    INDUSTRY_DATA["IT Services"];

  const toggleCompany = (ticker: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="brutal-card-lg p-6 bg-gradient-to-r from-accent/10 to-primary/10">
        <h1 className="text-display-sm font-display mb-2">Industry Explorer</h1>
        <p className="text-lg text-muted-foreground font-medium">
          Analyze companies by sector and compare industry averages
        </p>
      </div>

      {/* Industry Selector */}
      <div className="brutal-card p-6">
        <label className="block font-bold mb-3">Select Industry</label>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="brutal-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Industry Averages */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="brutal-card p-6">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            Avg ROE
          </p>
          <p className="text-4xl font-bold text-primary">{industryData.avgRoe}</p>
        </div>
        <div className="brutal-card p-6">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            Avg D/E Ratio
          </p>
          <p className="text-4xl font-bold text-secondary">{industryData.avgDE}</p>
        </div>
        <div className="brutal-card p-6">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            Avg EBIT Margin
          </p>
          <p className="text-4xl font-bold text-accent">{industryData.avgEbitMargin}</p>
        </div>
      </div>

      {/* Industry Chart */}
      <div className="brutal-card-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Industry Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="IT Services" fill="hsl(var(--primary))" />
            <Bar dataKey="Banking" fill="hsl(var(--secondary))" />
            <Bar dataKey="Oil & Gas" fill="hsl(var(--accent))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Company List */}
      <div className="brutal-card-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Companies in {selectedIndustry}</h2>
          <Button
            className="brutal-button bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={selectedCompanies.length === 0}
            onClick={() => {
              const tickers = selectedCompanies.join(",");
              window.location.href = `/compare?tickers=${tickers}`;
            }}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare Selected ({selectedCompanies.length})
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-3 border-border">
                <th className="text-left py-3 px-4 font-bold">Select</th>
                <th className="text-left py-3 px-4 font-bold">Ticker</th>
                <th className="text-left py-3 px-4 font-bold">Company</th>
                <th className="text-right py-3 px-4 font-bold">Market Cap</th>
                <th className="text-right py-3 px-4 font-bold">ROE</th>
                <th className="text-right py-3 px-4 font-bold">D/E</th>
                <th className="text-right py-3 px-4 font-bold">Revenue Growth</th>
              </tr>
            </thead>
            <tbody>
              {industryData.companies.map((company) => (
                <tr key={company.ticker} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCompany(company.ticker)}
                      className={`w-6 h-6 border-3 border-border rounded flex items-center justify-center ${
                        selectedCompanies.includes(company.ticker)
                          ? "bg-primary"
                          : "bg-background"
                      }`}
                    >
                      {selectedCompanies.includes(company.ticker) && (
                        <CheckSquare className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/company/${company.ticker}`}>
                      <span className="font-bold hover:text-primary transition-colors">
                        {company.ticker}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold">{company.name}</td>
                  <td className="text-right py-3 px-4 font-semibold">{company.marketCap}</td>
                  <td className="text-right py-3 px-4 font-bold text-success">{company.roe}</td>
                  <td className="text-right py-3 px-4 font-semibold">{company.de}</td>
                  <td className="text-right py-3 px-4 font-bold text-success">{company.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
