import { type MouseEvent, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import BrandLogo from "@/components/brand/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { homeSections, type NavItem, pages } from "@/config/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

const sectionIds = homeSections.map((item) => item.to.slice(2));

const linkClassName = (active: boolean) =>
  cn(
    "rounded-md py-2 font-medium transition-colors duration-200 hover:text-iris",
    active ? "text-iris underline decoration-2 underline-offset-8" : "text-foreground",
  );

const SiteHeader = () => {
  const { language } = useSettings();
  const t = translations[language];
  const { pathname, hash } = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Sections only exist on the home page; elsewhere the spy simply finds none.
  const activeSection = useActiveSection(sectionIds);

  const isSectionActive = (item: NavItem) =>
    pathname === "/" && (activeSection ? `/#${activeSection}` === item.to : `/${hash}` === item.to);

  // Re-clicking the anchor already in the URL changes nothing for the router,
  // so scroll explicitly.
  const handleSectionClick = (item: NavItem) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/" && `/${hash}` === item.to) {
      event.preventDefault();
      document.getElementById(item.to.slice(2))?.scrollIntoView({ block: "start" });
    }
  };

  const renderMobileLink = (item: NavItem) => (
    <SheetClose asChild key={item.to}>
      <Link
        to={item.to}
        onClick={handleSectionClick(item)}
        className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors duration-200 hover:bg-lavender"
      >
        {t.nav[item.labelKey]}
      </Link>
    </SheetClose>
  );

  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Link
          to="/"
          aria-label="Dawid Hanrahan"
          className="rounded-md text-foreground transition-opacity duration-200 hover:opacity-80"
        >
          {/* Sizes are the symbol's artwork box. The kit's minimums are 32px
              for the standalone symbol and 180px for the full logo; the master
              artwork is 315×120, so 180px wide is a 57.14px box. */}
          <BrandLogo variant="symbol" size={40} className="sm:hidden" />
          <BrandLogo size={58} className="hidden sm:inline-flex" />
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <nav aria-label={t.common.menu} className="hidden items-center gap-6 md:flex">
            {homeSections.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleSectionClick(item)}
                aria-current={isSectionActive(item) ? "location" : undefined}
                className={linkClassName(isSectionActive(item))}
              >
                {t.nav[item.labelKey]}
              </Link>
            ))}
            {/* Anchors above scroll the home page; these open other pages. */}
            <Separator orientation="vertical" className="h-5" />
            {pages.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => linkClassName(isActive)}
              >
                {t.nav[item.labelKey]}
              </NavLink>
            ))}
          </nav>

          <LanguageToggle />

          <div className="md:hidden">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t.common.openMenu}>
                  <Menu className="!size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="w-[85vw] max-w-sm pb-[env(safe-area-inset-bottom)]"
                aria-describedby={undefined}
              >
                <SheetTitle className="sr-only">{t.common.menu}</SheetTitle>
                <nav aria-label={t.common.menu} className="mt-8 flex flex-col gap-1">
                  <p className="px-4 pb-1 font-mono text-meta uppercase tracking-wide text-muted-foreground">
                    {t.nav.mainPage}
                  </p>
                  {homeSections.map(renderMobileLink)}
                  <Separator className="my-3" />
                  <p className="px-4 pb-1 font-mono text-meta uppercase tracking-wide text-muted-foreground">
                    {t.nav.pages}
                  </p>
                  {pages.map(renderMobileLink)}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default SiteHeader;
