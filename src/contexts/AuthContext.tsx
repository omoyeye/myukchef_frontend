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
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string, portal?: Portal) => Promise<User>;
    register: (name: string, email: string, password: string) => Promise<void>;
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
            // Verify session with backend
            api.get('/auth/me')
                .then(data => {
                    const userData = {
                        ...data.user,
                        isAdmin: data.user.role === 'admin'
                    };
                    setUser(userData);
                })
                .catch(err => {
                    console.error("Session verification failed", err);
                    session.clear();
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
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

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.post('/auth/register', { name, email, password, acceptTerms: true });
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading, error }}>
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
