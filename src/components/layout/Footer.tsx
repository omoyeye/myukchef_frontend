import { Link } from 'react-router-dom';
import { openCookieSettings } from "@/lib/consent";
import { CompanyDetails } from '@/components/common/CompanyDetails';
import { Instagram, Twitter, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const Footer = () => {
  const { data: settings = {} } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => api.get('/settings'),
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  const storeInfo = settings.store_info || {};
  const footerInfo = settings.footer_info || {};

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="MYUKCHEF Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">{storeInfo.name?.split(' ')[0] || "MYUKCHEF"}</span>
                              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              {storeInfo.description || "Home-cooked food from independent local chefs across the UK, delivered to your door or served at your event."}
            </p>
            <div className="flex gap-2">
              {[
                { url: footerInfo.socials?.instagram, label: "Instagram", icon: Instagram },
                { url: footerInfo.socials?.twitter, label: "Twitter", icon: Twitter },
                { url: footerInfo.socials?.facebook, label: "Facebook", icon: Facebook },
              ].filter((link) => link.url).map(({ url, label, icon: Icon }) => (
                <a key={label} href={url} aria-label={label} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/meal-plans" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Meal Plans
                </Link>
              </li>
              <li>
                <Link to="/chefs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Our Chefs
                </Link>
              </li>
              <li>
                <Link to="/app" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Get the App
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Book an Event
                </Link>
              </li>
              <li>
                <Link to="/chef/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Become a Chef
                </Link>
              </li>
              <li>
                <Link to="/chef/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Chef Portal
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Loyalty Rewards
                </Link>
              </li>
              <li>
                <Link to="/recommend" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Find My Meal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Us</h4>
            <ul className="space-y-3">
              {storeInfo.address && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{storeInfo.address}</span>
                </li>
              )}
              {storeInfo.phone && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href={`tel:${storeInfo.phone}`} className="hover:text-primary">{storeInfo.phone}</a>
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${storeInfo.email || "info@myukchef.com"}`} className="hover:text-primary">{storeInfo.email || "info@myukchef.com"}</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          {footerInfo.hours?.some((line: string) => line) && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Opening Hours</h4>
              <ul className="space-y-2">
                {footerInfo.hours.filter(Boolean).map((line: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MYUKCHEF. All rights reserved.
              <CompanyDetails className="mt-1 max-w-xl text-xs" />
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/allergens" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Allergen Info
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </Link>
              <Link to="/refer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Refer a friend
              </Link>
              <button type="button" onClick={openCookieSettings} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cookie settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
