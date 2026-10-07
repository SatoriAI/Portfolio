import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VexProvider } from "@/contexts/VexContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <VexProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="/research" element={<Academic />} />
                {/* The page's old address, kept so shared links still land. */}
                <Route path="/academic" element={<Navigate to="/research" replace />} />
                <Route path="/education" element={<Education />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/workshop" element={<Workshop />} />
                <Route path="/workshop/:slug" element={<WorkshopArticle />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </VexProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
