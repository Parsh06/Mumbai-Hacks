export interface CompanyRatio {
  metric: string;
  value: string;
}

export interface CompanyRecord {
  company_code: string;
  url: string;
  name: string | null;
  about: string | null;
  pros: string[];
  cons: string[];
  key_ratios: CompanyRatio[];
  tables: Record<string, Record<string, string>[]>;
  status: string;
}

export interface CompanyDataset {
  generated_at: string;
  total_companies: number;
  companies: CompanyRecord[];
}

export const fetchCompanyDataset = async (): Promise<CompanyDataset> => {
  const response = await fetch("/company.json", {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load company dataset");
  }

  return response.json();
};

export const findCompanyRecord = (
  dataset: CompanyDataset | undefined,
  ticker: string
): CompanyRecord | undefined => {
  if (!dataset) return undefined;
  const target = ticker.toUpperCase();
  return dataset.companies.find(
    (company) => company.company_code.toUpperCase() === target
  );
};

