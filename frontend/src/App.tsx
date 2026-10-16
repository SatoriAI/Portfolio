import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PageLayout from "@/components/layout/PageLayout";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { redirects } from "@/config/navigation";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VexProvider } from "@/contexts/VexContext";
import type { Language } from "@/lib/locale";
import { NotFound, PAGES } from "@/pages/routes";

/** The routes, inside whichever router the entry brings. */
export const AppRoutes = () => (
  <>
    <ScrollToTop />
    <Routes>
      {/* Every page inside one layout, which stays mounted between them. */}
      <Route element={<PageLayout />}>
        {PAGES.map(({ path, Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
        {redirects.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </>
);

/**
 * Everything around the router, the same in the browser (main.tsx) and at
 * build time (entry-server.tsx); each entry brings its own router and its
 * own QueryClient, as one render at build time must not share a cache with
 * the next.
 */
const App = ({
  language,
  queryClient,
  children,
}: {
  language: Language;
  queryClient: QueryClient;
  children: ReactNode;
}) => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider language={language}>
      <VexProvider>
        <TooltipProvider>
          <Sonner />
          {children}
        </TooltipProvider>
      </VexProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
