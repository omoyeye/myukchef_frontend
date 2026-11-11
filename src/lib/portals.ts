export type Portal = "customer" | "chef" | "admin";

/** Each kind of account has its own sign-in pages and its own home. */
export const PORTALS: Record<Portal, { name: string; home: string; login: string; forgot: string; reset: string; register?: string }> = {
    customer: { name: "your account", home: "/profile", login: "/login", forgot: "/forgot-password", reset: "/reset-password", register: "/register" },
    chef: { name: "the Chef Portal", home: "/chef/dashboard", login: "/chef/login", forgot: "/chef/forgot-password", reset: "/chef/reset-password", register: "/chef/register" },
    // Super Admins are only ever created by another Super Admin, so there is no sign-up page.
    admin: { name: "the Super Admin Portal", home: "/admin", login: "/admin/login", forgot: "/admin/forgot-password", reset: "/admin/reset-password" },
};

export const portalForRole = (role?: string): Portal => (role === "chef" || role === "admin" ? role : "customer");
export const portalHome = (role?: string) => PORTALS[portalForRole(role)].home;
