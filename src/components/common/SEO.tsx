import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND_DESCRIPTION, BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/site';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: string;
    noindex?: boolean;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

// Account and checkout pages have no value in search results.
const PRIVATE_PATHS = /^\/(admin|cart|checkout|profile|login|register|forgot-password|reset-password|order-tracker|track-order|chef\/(dashboard|login))(\/|$)/;

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
};

const SEO = ({ title, description = BRAND_DESCRIPTION, image, type = 'website', noindex = false, jsonLd }: SEOProps) => {
    const { pathname } = useLocation();
    const structuredData = jsonLd ? JSON.stringify(jsonLd) : null;

    useEffect(() => {
        const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
        const url = SITE_URL + (pathname === '/' ? '/' : pathname.replace(/\/$/, ''));
        const imageUrl = !image ? DEFAULT_OG_IMAGE : image.startsWith('http') ? image : SITE_URL + image;

        document.title = fullTitle;
        setMeta('name', 'description', description);
        setMeta('name', 'robots', noindex || PRIVATE_PATHS.test(pathname) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:image', imageUrl);
        setMeta('property', 'og:url', url);
        setMeta('property', 'og:type', type);
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        setMeta('name', 'twitter:image', imageUrl);

        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', url);

        if (!structuredData) return;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.page = 'true';
        // "<" is escaped so chef-written text can't close the script tag.
        script.textContent = structuredData.replace(/</g, '\\u003c');
        document.head.appendChild(script);
        return () => script.remove();
    }, [title, description, image, type, noindex, pathname, structuredData]);

    return null;
};

export default SEO;
