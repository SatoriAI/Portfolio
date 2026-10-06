import { type PropsWithChildren, type RefObject, useEffect, useRef, useState } from "react";

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
  /** Text the floating chat button stands aside for while it is in view. */
  launcherClearOf?: RefObject<HTMLElement>;
}>;

/**
 * Header, main content offset below the fixed header, footer, and Vex. The
 * chat used to exist on the home page only; a visitor reading a role on the
 * Experience page had nobody to ask about it. It now travels with the layout.
 */
const PageLayout = ({ className, launcherClearOf, children }: PageLayoutProps) => {
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

  // Over a piece of reading the launcher would cover the ends of lines; the
  // page's own closing offers Vex once the text is past.
  const [launcherAside, setLauncherAside] = useState(false);
  useEffect(() => {
    const target = launcherClearOf?.current;
    if (!target) return;
    // Only the strip at the foot of the screen, where the launcher sits:
    // once the text's last line has risen above it, the launcher is back.
    const observer = new IntersectionObserver(([entry]) => setLauncherAside(entry.isIntersecting), {
      rootMargin: "-88% 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [launcherClearOf]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* The first stop for the keyboard: straight past the header's links. */}
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t.nav.skipToContent}
      </a>
      <SiteHeader />
      <main
        id="content"
        tabIndex={-1}
        className={cn("flex flex-1 flex-col pt-16 outline-none md:pt-20", className)}
      >
        {children}
      </main>
      {/* The footer keeps clear of the floating launcher. */}
      <SiteFooter className="pb-24 sm:pb-8" />

      <ChatWidget
        isOpen={isOpen}
        onClose={closeVex}
        initialQuestion={pendingQuestion}
        onInitialQuestionSent={consumeQuestion}
      />
      {!isOpen && (
        <ChatLauncher
          ref={launcherRef}
          label={t.common.chatWithVex}
          onClick={() => askVex()}
          aside={launcherAside}
        />
      )}
    </div>
  );
};

export default PageLayout;
