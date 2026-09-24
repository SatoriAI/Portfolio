import { type PropsWithChildren, useEffect, useRef } from "react";

import ChatLauncher from "@/components/ChatLauncher";
import ChatWidget from "@/components/ChatWidget";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

type PageLayoutProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Header, main content offset below the fixed header, footer, and Vex. The
 * chat used to exist on the home page only; a visitor reading a role on the
 * Experience page had nobody to ask about it. It now travels with the layout.
 */
const PageLayout = ({ className, children }: PageLayoutProps) => {
  const { language } = useSettings();
  const t = translations[language];
  const { isOpen, pendingQuestion, askVex, closeVex, consumeQuestion } = useVex();

  // The launcher unmounts while the chat is open, so Radix cannot return focus
  // to it; do that here once it is back.
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasChatOpenRef = useRef(false);
  useEffect(() => {
    if (wasChatOpenRef.current && !isOpen) launcherRef.current?.focus();
    wasChatOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className={cn("flex-1 pt-16 md:pt-20", className)}>{children}</main>
      {/* The footer keeps clear of the floating launcher. */}
      <SiteFooter className="pb-24 sm:pb-8 sm:pr-24" />

      <ChatWidget
        isOpen={isOpen}
        onClose={closeVex}
        initialQuestion={pendingQuestion}
        onInitialQuestionSent={consumeQuestion}
      />
      {!isOpen && (
        <ChatLauncher ref={launcherRef} label={t.common.chatWithVex} onClick={() => askVex()} />
      )}
    </div>
  );
};

export default PageLayout;
