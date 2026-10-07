import { AlertCircle, Inbox } from "lucide-react";

import Spinner from "@/components/feedback/Spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusMessageProps = {
  variant: "loading" | "error" | "empty";
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * One block for the three states a fetched list can be in. Errors are stated
 * in words with an icon, so colour is never the only signal.
 */
const StatusMessage = ({
  variant,
  message,
  onRetry,
  retryLabel,
  className,
}: StatusMessageProps) => (
  <div
    className={cn("flex flex-col items-center justify-center gap-4 py-20 text-center", className)}
    aria-live="polite"
  >
    {variant === "loading" ? (
      <Spinner label={message} />
    ) : (
      <>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            variant === "error" ? "bg-blush text-destructive" : "bg-lavender text-iris",
          )}
        >
          {variant === "error" ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Inbox className="h-6 w-6" />
          )}
        </span>
        <p className="max-w-[38ch] text-base text-muted-foreground md:text-body-lg">{message}</p>
        {variant === "error" && onRetry && retryLabel && (
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </>
    )}
  </div>
);

export default StatusMessage;
