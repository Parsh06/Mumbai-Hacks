import { useEffect, useMemo, useState } from "react";
import { Calendar, TrendingUp, Building2, DollarSign, MapPin, Briefcase } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/ui/button";

type IPOData = {
  file_type: string;
  scraped_at: string;
  total_records: number;
  data: IPORecord[];
};

type IPORecord = {
  [key: string]: string; // Dynamic keys to handle BOM characters
  "Opening Date": string;
  "Closing Date": string;
  "Listing Date": string;
  "Issue Price (Rs.)": string;
  "Total Issue Amount (Incl.Firm reservations) (Rs.cr.)": string;
  "Listing at": string;
  "Lead Manager": string;
};

type IPOStatus = "open" | "closed_not_listed" | "listing_today" | "listed" | "not_listed" | "unknown";

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  
  // Handle formats like "Wed, Dec 10, 2025" or "Mon, Dec 08, 2025"
  const cleaned = dateStr.trim();
  if (cleaned === "") return null;
  
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
};

const getIPOStatus = (ipo: IPORecord): IPOStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const openingDate = parseDate(ipo["Opening Date"]);
  const closingDate = parseDate(ipo["Closing Date"]);
  const listingDate = parseDate(ipo["Listing Date"]);
  
  // Check if listing is today (highest priority)
  if (listingDate) {
    listingDate.setHours(0, 0, 0, 0);
    if (listingDate.getTime() === today.getTime()) {
      return "listing_today";
    }
    // If listing date has passed, it's already listed
    if (listingDate.getTime() < today.getTime()) {
      return "listed";
    }
  }
  
  // Check if issue is currently open
  if (openingDate && closingDate) {
    openingDate.setHours(0, 0, 0, 0);
    closingDate.setHours(0, 0, 0, 0);
    
    if (openingDate.getTime() <= today.getTime() && closingDate.getTime() >= today.getTime()) {
      return "open";
    }
    
    // Issue closed but not listed yet (listing date is in future or doesn't exist)
    if (closingDate.getTime() < today.getTime()) {
      if (!listingDate || listingDate.getTime() > today.getTime()) {
        return "closed_not_listed";
      }
    }
  }
  
  // No dates available
  if (!openingDate && !closingDate && !listingDate) {
    return "unknown";
  }
  
  // Future IPO or no clear status (has dates but all in future)
  return "not_listed";
};

const getStatusBadgeColor = (status: IPOStatus): string => {
  switch (status) {
    case "open":
      return "bg-success text-success-foreground border-success";
    case "closed_not_listed":
      return "bg-warning text-warning-foreground border-warning";
    case "listing_today":
      return "bg-primary text-primary-foreground border-primary";
    case "listed":
      return "bg-secondary text-secondary-foreground border-secondary";
    case "not_listed":
      return "bg-destructive text-destructive-foreground border-destructive";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const getStatusLabel = (status: IPOStatus): string => {
  switch (status) {
    case "open":
      return "Issue Open";
    case "closed_not_listed":
      return "Closed (Not Listed)";
    case "listing_today":
      return "Listing Today";
    case "listed":
      return "Listed";
    case "not_listed":
      return "Not Listed";
    default:
      return "Unknown";
  }
};

const getCompanyName = (ipo: IPORecord): string => {
  // Find the company field (it might have BOM or quotes)
  const companyKey = Object.keys(ipo).find(
    (key) => key.toLowerCase().includes("company") || key.includes("Company")
  );
  if (companyKey) {
    const name = ipo[companyKey];
    // Remove BOM, quotes, and trim
    return name.replace(/^[\uFEFF"]+|[\uFEFF"]+$/g, "").trim();
  }
  return "Unknown Company";
};

export default function IPO() {
  const [ipoType, setIpoType] = useState<"mainboard" | "sme">("mainboard");
  const [mainboardData, setMainboardData] = useState<IPOData | null>(null);
  const [smeData, setSmeData] = useState<IPOData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadIPOs = async () => {
      try {
        setIsLoading(true);
        
        // Load both files in parallel
        const [mainboardRes, smeRes] = await Promise.all([
          fetch("/main-ipo.json", { headers: { "Cache-Control": "no-cache" } }),
          fetch("/sme-ipo.json", { headers: { "Cache-Control": "no-cache" } }),
        ]);

        if (!mainboardRes.ok || !smeRes.ok) {
          throw new Error("Failed to load IPO data");
        }

        const [mainboardJson, smeJson] = await Promise.all([
          mainboardRes.json(),
          smeRes.json(),
        ]);

        if (isMounted) {
          setMainboardData(mainboardJson);
          setSmeData(smeJson);
          setError(null);
        }
      } catch (e) {
        if (isMounted) {
          setError(
            e instanceof Error ? e.message : "Unable to load IPO data at the moment."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadIPOs();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentData = useMemo(() => {
    return ipoType === "mainboard" ? mainboardData : smeData;
  }, [ipoType, mainboardData, smeData]);

  const sortedIPOs = useMemo(() => {
    if (!currentData) return [];
    
    const ipos = [...currentData.data];
    
    // Sort by status priority and date
    return ipos.sort((a, b) => {
      const statusA = getIPOStatus(a);
      const statusB = getIPOStatus(b);
      
      // Priority: listing_today > open > closed_not_listed > listed > not_listed > unknown
      const priority: Record<IPOStatus, number> = {
        listing_today: 1,
        open: 2,
        closed_not_listed: 3,
        listed: 4,
        not_listed: 5,
        unknown: 6,
      };
      
      if (priority[statusA] !== priority[statusB]) {
        return priority[statusA] - priority[statusB];
      }
      
      // If same status, sort by opening date (most recent first)
      const dateA = parseDate(a["Opening Date"]);
      const dateB = parseDate(b["Opening Date"]);
      
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return 0;
    });
  }, [currentData]);

  const statusCounts = useMemo(() => {
    if (!sortedIPOs.length) return {};
    
    const counts: Record<IPOStatus, number> = {
      open: 0,
      closed_not_listed: 0,
      listing_today: 0,
      listed: 0,
      not_listed: 0,
      unknown: 0,
    };
    
    sortedIPOs.forEach((ipo) => {
      counts[getIPOStatus(ipo)]++;
    });
    
    return counts;
  }, [sortedIPOs]);

  if (isLoading) {
    return <LoadingState label="Loading IPO data..." />;
  }

  if (error || !currentData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Unable to load IPO data
          </p>
          <p className="text-muted-foreground">
            {error || "Ensure the IPO dataset is available and try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <section className="brutal-card-lg p-6 bg-gradient-to-br from-card to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">IPO Tracker</h1>
            <p className="text-muted-foreground">
              Track Initial Public Offerings - Mainboard & SME IPOs
            </p>
          </div>
          
          {/* Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-muted-foreground">
              IPO Type:
            </label>
            <select
              value={ipoType}
              onChange={(e) => setIpoType(e.target.value as "mainboard" | "sme")}
              className="brutal-input px-4 py-2 font-semibold bg-background border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="mainboard">Mainboard IPO</option>
              <option value="sme">SME IPO</option>
            </select>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="brutal-card p-4 bg-success/10 border-success/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Open
          </p>
          <p className="text-2xl font-bold text-success">{statusCounts.open || 0}</p>
        </div>
        <div className="brutal-card p-4 bg-primary/10 border-primary/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Listing Today
          </p>
          <p className="text-2xl font-bold text-primary">{statusCounts.listing_today || 0}</p>
        </div>
        <div className="brutal-card p-4 bg-warning/10 border-warning/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Closed
          </p>
          <p className="text-2xl font-bold text-warning">{statusCounts.closed_not_listed || 0}</p>
        </div>
        <div className="brutal-card p-4 bg-secondary/10 border-secondary/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Listed
          </p>
          <p className="text-2xl font-bold text-secondary">{statusCounts.listed || 0}</p>
        </div>
        <div className="brutal-card p-4 bg-destructive/10 border-destructive/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Not Listed
          </p>
          <p className="text-2xl font-bold text-destructive">{statusCounts.not_listed || 0}</p>
        </div>
        <div className="brutal-card p-4 bg-card border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Total
          </p>
          <p className="text-2xl font-bold">{currentData.total_records}</p>
        </div>
      </section>

      {/* IPO Cards Grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {ipoType === "mainboard" ? "Mainboard" : "SME"} IPOs
          </h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(currentData.scraped_at).toLocaleString()}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedIPOs.map((ipo, idx) => {
            const status = getIPOStatus(ipo);
            const companyName = getCompanyName(ipo);
            
            return (
              <div
                key={idx}
                className="brutal-card-lg p-6 bg-card border-3 border-border shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-lg)] transition-shadow space-y-5"
              >
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold leading-tight flex-1">
                    {companyName}
                  </h3>
                  <span className={`px-3 py-1.5 rounded-sm text-xs font-bold border-2 whitespace-nowrap shadow-sm ${getStatusBadgeColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-0.5 bg-border"></div>

                {/* Key Dates Section */}
                {(ipo["Opening Date"] || ipo["Closing Date"] || ipo["Listing Date"]) && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Key Dates
                    </h4>
                    <div className="space-y-2.5">
                      {ipo["Opening Date"] && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Opening</p>
                            <p className="text-sm font-semibold">{ipo["Opening Date"]}</p>
                          </div>
                        </div>
                      )}
                      
                      {ipo["Closing Date"] && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Closing</p>
                            <p className="text-sm font-semibold">{ipo["Closing Date"]}</p>
                          </div>
                        </div>
                      )}
                      
                      {ipo["Listing Date"] && (
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Listing</p>
                            <p className="text-sm font-semibold">{ipo["Listing Date"]}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Details Section */}
                {(ipo["Issue Price (Rs.)"] || ipo["Total Issue Amount (Incl.Firm reservations) (Rs.cr.)"]) && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Financial Details
                    </h4>
                    <div className="space-y-2.5">
                      {ipo["Issue Price (Rs.)"] && (
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Issue Price</p>
                            <p className="text-sm font-semibold">₹{ipo["Issue Price (Rs.)"]}</p>
                          </div>
                        </div>
                      )}
                      
                      {ipo["Total Issue Amount (Incl.Firm reservations) (Rs.cr.)"] && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Amount</p>
                            <p className="text-sm font-semibold">
                              ₹{ipo["Total Issue Amount (Incl.Firm reservations) (Rs.cr.)"]} Cr
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exchange & Manager Section */}
                {(ipo["Listing at"] || ipo["Lead Manager"]) && (
                  <div className="space-y-3 pt-2 border-t-2 border-border/50">
                    <div className="space-y-2.5">
                      {ipo["Listing at"] && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Exchange</p>
                            <p className="text-sm font-semibold">{ipo["Listing at"]}</p>
                          </div>
                        </div>
                      )}
                      
                      {ipo["Lead Manager"] && (
                        <div className="flex items-start gap-3">
                          <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lead Manager</p>
                            <p className="text-sm font-semibold">{ipo["Lead Manager"]}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

