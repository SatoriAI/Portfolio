import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-orange-600 hover:text-orange-700 dark:text-blue-500 dark:hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
