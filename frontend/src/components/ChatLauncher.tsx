import { forwardRef } from "react";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatLauncherProps = {
  label: string;
  onClick: () => void;
  /** Stands aside (faded out, out of the tab order) while text needs the room. */
  aside?: boolean;
};

// Warm the Markdown renderer chunk while the visitor is still deciding to open
// the chat, so the first answer never waits on a download.
const preloadMarkdown = () => {
  void import("@/components/chat/MarkdownMessage");
};

/** Floating button that opens the Vex chat; sits above the safe area on phones. */
const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  ({ label, onClick, aside = false }, ref) => (
    <Button
      ref={ref}
      onClick={onClick}
      onMouseEnter={preloadMarkdown}
      onFocus={preloadMarkdown}
      aria-label={label}
      className={cn(
        "fixed right-6 z-40 h-14 w-14 rounded-xl shadow-float-edged transition-[transform,opacity,visibility,background-color,color,box-shadow] duration-200 ease-brand motion-reduce:transform-none",
        // Navy in light; in dark quiet at rest (index.css). It lights only
        // under a pointer that can hover: a tap on a phone would flash it, and
        // focus has the iris ring, which also keeps it from coming back lit
        // when the chat hands focus back on closing. Lit, the edge goes with
        // the plain float, as a filled button has none. The unguarded
        // hover:bg-launcher keeps the base button's hover from showing on touch.
        "bg-launcher text-launcher-foreground hover:bg-launcher",
        "[@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:bg-launcher-lit [@media(hover:hover)]:hover:text-launcher-lit-foreground [@media(hover:hover)]:hover:shadow-float",
        aside && "invisible translate-y-2 opacity-0",
      )}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
    >
      <MessageSquare className="!size-6" />
    </Button>
  ),
);
ChatLauncher.displayName = "ChatLauncher";

export default ChatLauncher;
