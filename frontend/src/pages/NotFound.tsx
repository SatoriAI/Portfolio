import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { translations } from "@/utils/translations";

const NotFound = () => {
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Floating hamburger to avoid layout shifts on this page */}
      <div
        className="fixed right-4 z-40 md:hidden"
        style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-orange-100/50 dark:hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[85vw] max-w-sm">
            <div className="mt-6 flex flex-col gap-1">
              <SheetClose asChild>
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.home}
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <a href="/#about">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.about}
                  </Button>
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="/#skills">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.skills}
                  </Button>
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="/#projects">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.projects}
                  </Button>
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="/#contact">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.contact}
                  </Button>
                </a>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/experience">
                  <Button variant="ghost" className="mt-2 w-full justify-start text-base">
                    {t.nav.experience}
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/academic">
                  <Button variant="ghost" className="w-full justify-start text-base">
                    {t.nav.academic}
                  </Button>
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
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
