import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * The search and tracking settings from Super Admin, SEO: tag IDs and page titles. Tag IDs are
 * public by nature (they're in every page that uses them), so this is safe to load for everyone.
 */
export interface PublicSeo {
    tracking: { gtmId: string; ga4Id: string; metaPixelId: string; tiktokPixelId: string; clarityId: string };
    pages: Record<string, { title?: string; description?: string }>;
    defaults: { description: string };
    allowIndexing: boolean;
}

export const usePublicSeo = () => useQuery<PublicSeo>({ queryKey: ['seo-public'], queryFn: () => api.get('/seo/public'), staleTime: 300_000, retry: false });

export const hasAnalytics = (t?: PublicSeo['tracking']) => !!t && !!(t.gtmId || t.ga4Id || t.clarityId);
export const hasMarketing = (t?: PublicSeo['tracking']) => !!t && !!(t.metaPixelId || t.tiktokPixelId);
