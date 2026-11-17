import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/common/SEO";
import { CustomerPortal } from "@/components/layout/CustomerPortal";
import { WalletPanel } from "@/components/wallet/wallet";
import { useAuth } from "@/contexts/AuthContext";

/** The customer's wallet: credit from referrals, cashback and gifts, to spend at checkout. */
const WalletPage = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate(`/login?redirect=${encodeURIComponent("/wallet")}`, { replace: true });
    }, [isLoading, isAuthenticated, navigate]);
    return (
        <CustomerPortal>
            <SEO title="My Wallet" description="Your MYUKCHEF wallet." noindex />
            <h1 className="mb-1 font-display text-3xl font-extrabold md:text-4xl">My wallet</h1>
            <p className="mb-6 text-muted-foreground">Credit from referrals, cashback and gifts. Use it on any order.</p>
            {isAuthenticated && <WalletPanel />}
        </CustomerPortal>
    );
};

export default WalletPage;
