import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEO title="Page Not Found" description="The page you are looking for does not exist. Return to MYUKCHEF home to find delicious food." />
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mb-8 inline-block">
            <h1 className="text-9xl font-black text-secondary/30 select-none">404</h1>
            <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold whitespace-nowrap">Page Not Found</p>
          </div>
          <p className="mb-10 text-xl text-muted-foreground max-w-md mx-auto">
            Oops! It looks like you've taken a wrong turn. Don't worry, our food is still delicious!
          </p>
          <Button asChild size="lg" className="rounded-full px-8 shadow-warm hover:scale-105 transition-transform">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
