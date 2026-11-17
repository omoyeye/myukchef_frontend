import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, session } from '@/lib/api';
import { Portal } from '@/lib/portals';

interface User {
    id: number;
    name: string;
    email: string;
    points: number;
    isAdmin?: boolean;
    role?: string;
    /** Set once they've clicked the link in their confirmation email. */
    emailVerifiedAt?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, portal?: Portal) => Promise<User>;
    register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
    /** Loads the account again, for example after confirming the email address. */
    refreshUser: () => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial load - verify user session
    useEffect(() => {
        if (session.token) {
            // Verify the session with the server. Only a real "not signed in" answer signs the person
            // out; if the server can't be reached for a moment, keep the session and try again.
            let cancelled = false;
            const verify = (attempt: number) => {
                api.get('/auth/me')
                    .then(data => {
                        if (cancelled) return;
                        setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
                        setIsLoading(false);
                    })
                    .catch((err: Error & { status?: number }) => {
                        if (cancelled) return;
                        if (err.status === 401 || err.status === 403) {
                            session.clear();
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }
                        console.warn("Couldn't check your session yet, trying again", err.message);
                        if (attempt < 6) setTimeout(() => verify(attempt + 1), Math.min(1000 * 2 ** attempt, 15000));
                        else setIsLoading(false);
                    });
            };
            verify(0);
            return () => { cancelled = true; };
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string, portal: Portal = 'customer') => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.post('/auth/login', { email, password, portal });
            const userData = {
                ...data.user,
                isAdmin: data.user.role === 'admin'
            };
            session.set(data.token);
            setUser(userData);
            return userData;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        if (!session.token) return;
        const data = await api.get('/auth/me').catch(() => null);
        if (data?.user) setUser({ ...data.user, isAdmin: data.user.role === 'admin' });
    };

    const register = async (name: string, email: string, password: string, referralCode?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.post('/auth/register', { name, email, password, acceptTerms: true, referralCode });
            const userData = {
                ...data.user,
                isAdmin: data.user.role === 'admin'
            };
            session.set(data.token);
            setUser(userData);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        session.clear();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, refreshUser, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
