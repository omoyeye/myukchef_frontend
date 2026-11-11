import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CompanyInfo {
    legalName?: string;
    companyNumber?: string;
    registeredAddress?: string;
    vatNumber?: string;
    icoNumber?: string;
}

export const useCompanyInfo = (): CompanyInfo => {
    const { data } = useQuery<any>({ queryKey: ["site-settings"], queryFn: () => api.get("/settings"), staleTime: 300_000 });
    return data?.company_info ?? {};
};

/** The company behind the site, once an admin has entered it under Settings. */
export const companyLine = (c: CompanyInfo) => [
    c.legalName,
    c.companyNumber && `Company number ${c.companyNumber}`,
    c.registeredAddress && `Registered office: ${c.registeredAddress}`,
    c.vatNumber && `VAT ${c.vatNumber}`,
    c.icoNumber && `ICO registration ${c.icoNumber}`,
].filter(Boolean).join(". ");

export const CompanyDetails = ({ className }: { className?: string }) => {
    const line = companyLine(useCompanyInfo());
    return line ? <p className={className}>{line}.</p> : null;
};
