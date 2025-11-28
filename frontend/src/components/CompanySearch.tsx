import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";

const FALLBACK_COMPANIES = [
  { ticker: "RELIANCE", name: "Reliance Industries" },
  { ticker: "TCS", name: "Tata Consultancy Services" },
  { ticker: "INFY", name: "Infosys" },
  { ticker: "HDFCBANK", name: "HDFC Bank" },
  { ticker: "ICICIBANK", name: "ICICI Bank" },
  { ticker: "WIPRO", name: "Wipro" },
  { ticker: "ITC", name: "ITC Limited" },
  { ticker: "BHARTIARTL", name: "Bharti Airtel" },
];

export interface CompanySearchOption {
  ticker: string;
  name: string;
}

interface CompanySearchProps {
  companies?: CompanySearchOption[];
  placeholder?: string;
}

export default function CompanySearch({
  companies,
  placeholder = "Search by company name or ticker...",
}: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const shouldFetch = !companies;
  const { data, isLoading } = useCompanyDataset({
    enabled: shouldFetch,
  });

  const datasetOptions = useMemo<CompanySearchOption[]>(() => {
    if (!data) return [];
    return data.companies.map((company) => ({
      ticker: company.company_code,
      name: company.name || company.company_code,
    }));
  }, [data]);

  const options = useMemo(() => {
    if (companies && companies.length > 0) {
      return companies;
    }
    if (datasetOptions.length > 0) {
      return datasetOptions;
    }
    return FALLBACK_COMPANIES;
  }, [companies, datasetOptions]);

  const filteredCompanies = query
    ? options.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.ticker.toLowerCase().includes(query.toLowerCase())
      )
    : options;
  const suggestions = filteredCompanies.slice(0, 8);

  const isLoadingState = shouldFetch && isLoading && datasetOptions.length === 0;

  const handleSelect = (ticker: string) => {
    navigate(`/company/${ticker}`);
    setQuery("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && suggestions.length > 0) {
      event.preventDefault();
      handleSelect(suggestions[0].ticker);
    }
  };

  const inputPlaceholder = isLoadingState
    ? "Loading companies..."
    : placeholder;

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={inputPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          disabled={isLoadingState}
          aria-disabled={isLoadingState}
          className="brutal-input w-full pl-12 pr-4 py-4 text-lg font-semibold"
        />
        {isLoadingState && (
          <div className="absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-muted-foreground">
            Loading companies...
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full brutal-card bg-card z-50 max-h-80 overflow-y-auto">
          {suggestions.map((company) => (
            <button
              type="button"
              key={company.ticker}
              onClick={() => handleSelect(company.ticker)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex justify-between items-center"
            >
              <span className="font-semibold">{company.name}</span>
              <span className="text-sm font-bold text-primary">
                {company.ticker}
              </span>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query && (
        <div className="absolute top-full mt-2 w-full brutal-card bg-card z-50 p-4 text-sm text-muted-foreground">
          No companies match “{query}”.
        </div>
      )}
    </div>
  );
}
