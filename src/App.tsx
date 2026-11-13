import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/lib/location";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { MobileFab } from "./components/layout/MobileFab";
import { AppErrorBoundary, OfflineBanner, PageLoader } from "./components/layout/AppShell";

const Menu = lazy(() => import("./pages/Menu"));
const ItemDetail = lazy(() => import("./pages/ItemDetail"));
const OrderTracker = lazy(() => import("./pages/OrderTracker"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const MenuManagement = lazy(() => import("./pages/admin/MenuManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const DiscountManagement = lazy(() => import("./pages/admin/DiscountManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const IntegrationSettings = lazy(() => import("./pages/admin/IntegrationSettings"));
const SearchOrder = lazy(() => import("./pages/SearchOrder"));
const ReviewManagement = lazy(() => import("./pages/admin/ReviewManagement"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const AllergenInfo = lazy(() => import("./pages/AllergenInfo"));
const Support = lazy(() => import("./pages/Support"));
const Chefs = lazy(() => import("./pages/Chefs"));
const Events = lazy(() => import("./pages/Events"));
const Recommend = lazy(() => import("./pages/Recommend"));
const ChefRegister = lazy(() => import("./pages/chef/ChefRegister"));
const ChefLogin = lazy(() => import("./pages/chef/ChefLogin"));
const ChefDashboard = lazy(() => import("./pages/chef/ChefDashboard"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const ChefManagement = lazy(() => import("./pages/admin/ChefManagement"));
const EventManagement = lazy(() => import("./pages/admin/EventManagement"));
const ChefProfile = lazy(() => import("./pages/ChefProfile"));
const CustomerManagement = lazy(() => import("./pages/admin/CustomerManagement"));
const MyBookingDetail = lazy(() => import("./pages/MyBookingDetail"));
const ChefAgreement = lazy(() => import("./pages/ChefAgreement"));
const SupportInbox = lazy(() => import("./pages/admin/SupportInbox"));
const SavedChefs = lazy(() => import("./pages/SavedChefs"));
const MealPlans = lazy(() => import("./pages/MealPlans"));
const MealPlanBuilder = lazy(() => import("./pages/MealPlanBuilder"));
const MyPlans = lazy(() => import("./pages/MyPlans"));
const MyPlanDetail = lazy(() => import("./pages/MyPlanDetail"));
const MealPlanManagement = lazy(() => import("./pages/admin/MealPlanManagement"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } });

// The staff portals have their own floating menus, and their sign-in pages stay uncluttered.
const PublicFab = () => (/^\/(admin|chef)(\/|$)/.test(useLocation().pathname) ? null : <MobileFab />);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
        <LocationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <OfflineBanner />
            <CookieConsent />
            <AppErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/menu/:id" element={<ItemDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/track-order" element={<SearchOrder />} />
              <Route path="/order-tracker/:id" element={<OrderTracker />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/allergens" element={<AllergenInfo />} />
              <Route path="/support" element={<Support />} />
              <Route path="/chefs" element={<Chefs />} />
              <Route path="/chefs/:id" element={<ChefProfile />} />
              <Route path="/events" element={<Events />} />
              <Route path="/recommend" element={<Recommend />} />
              <Route path="/meal-plans" element={<MealPlans />} />
              <Route path="/meal-plans/new" element={<MealPlanBuilder />} />
              <Route path="/my-plans" element={<MyPlans />} />
              <Route path="/saved-chefs" element={<SavedChefs />} />
              <Route path="/my-bookings/:id" element={<MyBookingDetail />} />
              <Route path="/my-plans/:id" element={<MyPlanDetail />} />

              {/* Chef Portal */}
              <Route path="/chef/register" element={<ChefRegister />} />
              <Route path="/chef/agreement" element={<ChefAgreement />} />
              <Route path="/chef/login" element={<ChefLogin />} />
              <Route path="/chef/forgot-password" element={<ForgotPassword portal="chef" />} />
              <Route path="/chef/reset-password" element={<ResetPassword portal="chef" />} />
              <Route path="/chef/dashboard" element={<ChefDashboard />} />
              <Route path="/chef/receipts/:id" element={<InvoiceView />} />
              <Route path="/admin/invoices/:id" element={<InvoiceView />} />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin Login - Separated */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword portal="admin" />} />
              <Route path="/admin/reset-password" element={<ResetPassword portal="admin" />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="menu/add" element={<ProductForm />} />
                <Route path="menu/edit/:id" element={<ProductForm />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="discounts" element={<DiscountManagement />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="customers" element={<CustomerManagement />} />
                <Route path="chefs" element={<ChefManagement />} />
                <Route path="events" element={<EventManagement />} />
                <Route path="meal-plans" element={<MealPlanManagement />} />
                <Route path="support" element={<SupportInbox />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="payments-email" element={<IntegrationSettings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </AppErrorBoundary>
            <PublicFab />
          </BrowserRouter>
        </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
