import type { PropsWithChildren } from "react";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { cn } from "@/lib/utils";

type PageLayoutProps = PropsWithChildren<{
  className?: string;
  /** Pages with a floating control (the chat launcher) pad the footer clear of it. */
  footerClassName?: string;
}>;

/** Header, main content offset below the fixed header, and footer. */
const PageLayout = ({ className, footerClassName, children }: PageLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <SiteHeader />
    <main className={cn("flex-1 pt-16 md:pt-20", className)}>{children}</main>
    <SiteFooter className={footerClassName} />
  </div>
);

export default PageLayout;
