import { forwardRef } from "react";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatLauncherProps = {
  label: string;
  onClick: () => void;
};

// Warm the Markdown renderer chunk while the visitor is still deciding to open
// the chat, so the first answer never waits on a download.
const preloadMarkdown = () => {
  void import("@/components/chat/MarkdownMessage");
};

/** Floating button that opens the Vex chat; sits above the safe area on phones. */
const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(({ label, onClick }, ref) => (
  <Button
    ref={ref}
    onClick={onClick}
    onMouseEnter={preloadMarkdown}
    onFocus={preloadMarkdown}
    aria-label={label}
    className="fixed right-6 z-40 h-14 w-14 rounded-xl shadow-float transition-transform duration-200 ease-brand hover:-translate-y-0.5 motion-reduce:transform-none"
    style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
  >
    <MessageSquare className="!size-6" />
  </Button>
));
ChatLauncher.displayName = "ChatLauncher";

export default ChatLauncher;
