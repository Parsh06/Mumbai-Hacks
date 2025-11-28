import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  fetchCompanyDataset,
  type CompanyDataset,
} from "@/services/companyDataService";

export const COMPANY_DATASET_QUERY_KEY = ["company-dataset"];

export const useCompanyDataset = (
  options?: Partial<UseQueryOptions<CompanyDataset>>
) =>
  useQuery<CompanyDataset>({
    queryKey: COMPANY_DATASET_QUERY_KEY,
    queryFn: fetchCompanyDataset,
    staleTime: 1000 * 60 * 10,
    ...options,
  });

