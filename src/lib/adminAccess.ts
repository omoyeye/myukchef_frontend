// Which admin pages each person may open. Matches the server's rules (staff only reach their role's menus).

/** The menu key behind each admin page. Team and roles is for Super Admins only. */
export const ADMIN_PAGE_KEYS: Record<string, string> = {
    '/admin': 'dashboard',
    '/admin/reports': 'reports',
    '/admin/orders': 'orders',
    '/admin/meal-plans': 'meal-plans',
    '/admin/events': 'events',
    '/admin/chefs': 'chefs',
    '/admin/customers': 'customers',
    '/admin/reviews': 'reviews',
    '/admin/support': 'support',
    '/admin/menu': 'menu',
    '/admin/videos': 'videos',
    '/admin/banners': 'banners',
    '/admin/wallets': 'wallets',
    '/admin/discounts': 'discounts',
    '/admin/seo': 'seo',
    '/admin/messages': 'messages',
    '/admin/settings': 'settings',
    '/admin/payments-email': 'keys',
    '/admin/system': 'system',
    '/admin/team': 'team',
    // Team chat is for every admin, whatever their role.
    '/admin/team-chat': 'chat',
};

export interface AdminUser { isAdmin?: boolean; isSuperAdmin?: boolean; permissions?: string[] }

/** The menu key for a page address, using the longest matching admin path. */
export function pageKey(pathname: string) {
    const match = Object.keys(ADMIN_PAGE_KEYS).filter((p) => (p === '/admin' ? pathname === '/admin' || pathname === '/admin/' : pathname === p || pathname.startsWith(p + '/'))).sort((a, b) => b.length - a.length)[0];
    return match ? ADMIN_PAGE_KEYS[match] : null;
}

export const canUse = (user: AdminUser | null | undefined, key: string | null) =>
    !!user?.isAdmin && (key === null || key === 'chat' || !!user.isSuperAdmin || (key !== 'team' && !!user.permissions?.includes(key)));

/** Where a staff admin lands: their first allowed page. */
export function firstAllowedPage(user: AdminUser | null | undefined) {
    return Object.entries(ADMIN_PAGE_KEYS).find(([, key]) => key !== 'chat' && canUse(user, key))?.[0] ?? '/admin/team-chat';
}
