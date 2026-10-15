import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import PageLayout from "@/components/layout/PageLayout";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { redirects } from "@/config/navigation";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VexProvider } from "@/contexts/VexContext";
import { type Language, languageBasename } from "@/lib/locale";
import { queryClient } from "@/lib/queries";

import Index from "./pages/Index";

// The landing page ships in the main chunk so first paint never waits on a
// second request; the other routes load when navigated to.
const Experience = lazy(() => import("./pages/Experience"));
const Academic = lazy(() => import("./pages/Academic"));
const Education = lazy(() => import("./pages/Education"));
const Workshop = lazy(() => import("./pages/Workshop"));
const WorkshopArticle = lazy(() => import("./pages/WorkshopArticle"));
const NotFound = lazy(() => import("./pages/NotFound"));

// The routes are written once, without a language: under /pl the router's
// basename carries the prefix, for every Link and navigate as well.
const App = ({ language }: { language: Language }) => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider language={language}>
      <VexProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter basename={languageBasename(language)}>
            <ScrollToTop />
            <Routes>
              {/* Every page inside one layout, which stays mounted between them. */}
              <Route element={<PageLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="/research" element={<Academic />} />
                {redirects.map(({ from, to }) => (
                  <Route key={from} path={from} element={<Navigate to={to} replace />} />
                ))}
                <Route path="/education" element={<Education />} />
                <Route path="/workshop" element={<Workshop />} />
                <Route path="/workshop/:slug" element={<WorkshopArticle />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </VexProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
