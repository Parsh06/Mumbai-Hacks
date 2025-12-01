import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CompanySearch from "@/components/CompanySearch";
import LoadingState from "@/components/LoadingState";
import { useCompanyDataset } from "@/hooks/useCompanyDataset";

export default function Companies() {
  const { data, isLoading, error } = useCompanyDataset();
  const navigate = useNavigate();

  const companyOptions = useMemo(
    () =>
      (data?.companies ?? []).map((company) => ({
        ticker: company.company_code,
        name: company.name || company.company_code,
      })),
    [data]
  );

  const highlightCompanies = useMemo(
    () =>
      (data?.companies ?? [])
        .filter((company) => company.status === "success")
        .slice(0, 12),
    [data]
  );

  const [visibleCount, setVisibleCount] = useState(25);

  const handleRowClick = (ticker: string) => {
    if (!ticker) return;
    navigate(`/company/${ticker}`);
  };

  if (isLoading) {
    return <LoadingState label="Loading company intelligence..." />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Unable to load company dataset
          </p>
          <p className="text-muted-foreground">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="brutal-card-lg p-6 bg-gradient-to-r from-primary/10 to-secondary/10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-display-sm font-display mb-2">
            FinSightAi Company Graph
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Live dossier of {data.total_companies} Indian companies from our
            curated data snapshot
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Last updated:{" "}
            <span className="font-semibold">
              {new Date(data.generated_at).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <CompanySearch
          companies={companyOptions}
          placeholder="Search 100 tracked companies..."
        />
      </div>

      <div className="brutal-card-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold">Featured Insights</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Showing {highlightCompanies.length} tracked names across sectors.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {highlightCompanies.map((company) => (
            <Link
              key={company.company_code}
              to={`/company/${company.company_code}`}
              className="brutal-card p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.4em] text-muted-foreground uppercase">
                    {company.company_code}
                  </p>
                  <h3 className="text-lg font-bold">
                    {company.name || company.company_code}
                  </h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted">
                  {company.pros.length} ⚡ / {company.cons.length} ⚠️
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {company.about || "No description available."}
              </p>

              {company.key_ratios.length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
                  {company.key_ratios.slice(0, 2).map((ratio) => (
                    <div key={ratio.metric}>
                      <p className="uppercase tracking-wide text-[10px]">
                        {ratio.metric}
                      </p>
                      <p className="text-base text-foreground">{ratio.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="brutal-card-lg p-6 overflow-x-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-bold">Full Coverage</h2>
            <p className="text-sm text-muted-foreground">
              {data.total_companies} companies · Click ticker to open detailed
              dossier
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {Math.min(visibleCount, data.total_companies)}
            </span>{" "}
            of {data.total_companies}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
              <th className="py-3 pr-4">Ticker</th>
              <th className="py-3 pr-4">Company</th>
              <th className="py-3 pr-4">Pros</th>
              <th className="py-3 pr-4">Cons</th>
              <th className="py-3 pr-4">Key Ratio</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.companies.slice(0, visibleCount).map((company, idx) => (
              <tr
                key={company.company_code}
                className={`border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer ${
                  idx % 2 === 0 ? "bg-background/40" : "bg-background/10"
                }`}
                onClick={() => handleRowClick(company.company_code)}
              >
                <td className="py-3 pr-4 font-semibold">
                  <span className="text-primary underline decoration-dotted">
                    {company.company_code}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-semibold">
                    {company.name || company.company_code}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {company.about || "—"}
                  </p>
                </td>
                <td className="py-3 pr-4 text-success font-semibold">
                  {company.pros.length}
                </td>
                <td className="py-3 pr-4 text-destructive font-semibold">
                  {company.cons.length}
                </td>
                <td className="py-3 pr-4">
                  {company.key_ratios.length > 0 ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {company.key_ratios[0].metric}
                      </p>
                      <p className="font-semibold">
                        {company.key_ratios[0].value}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="py-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      company.status === "success"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {company.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleCount < data.total_companies && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(prev + 25, data.total_companies)
                )
              }
              className="brutal-button px-6 py-3 bg-primary text-primary-foreground text-sm"
            >
              Load more companies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
