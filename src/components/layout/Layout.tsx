import { ReactNode } from 'react';
import { VerifyEmailBanner } from "./VerifyEmailBanner";
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  fullBleed?: boolean;
}

export const Layout = ({ children, hideFooter = false, fullBleed = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className={`flex-1 relative z-10 ${!fullBleed ? 'pt-24' : ''}`}>{!fullBleed && <VerifyEmailBanner />}{children}</main>
      {!hideFooter && <Footer />}
      <MobileNav />
      <CartDrawer />
      <PWAInstallPrompt />
    </div>
  );
};
