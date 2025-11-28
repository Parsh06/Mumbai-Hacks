export interface InvestmentAnalysisRequest {
  companyA: any;
  companyB: any;
  comparisonData: {
    metrics: Array<{
      label: string;
      metric: string;
      companyAValue: string;
      companyBValue: string;
    }>;
  };
  chartData: {
    salesProfitTrends: any[];
    profitabilityComparison: any[];
    valuationRatios: any[];
  };
}

export interface InvestmentAnalysisResponse {
  verdict: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const fetchInvestmentAnalysis = async (
  request: InvestmentAnalysisRequest
): Promise<InvestmentAnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/investment-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to fetch investment analysis");
  }

  return response.json();
};

