import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      <div className="text-center">
        <h1 className="mb-4 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-4xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400">
          404
        </h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a
          href="/"
          className="text-orange-600 underline hover:text-orange-700 dark:text-purple-500 dark:hover:text-purple-700"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
