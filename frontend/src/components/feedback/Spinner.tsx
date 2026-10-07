import { cn } from "@/lib/utils";

type SpinnerProps = {
  label: string;
  className?: string;
};

const Spinner = ({ label, className }: SpinnerProps) => (
  <div role="status" className={cn("inline-flex", className)}>
    <span
      aria-hidden="true"
      className="h-10 w-10 animate-spin rounded-full border-[3px] border-lavender border-t-iris motion-reduce:animate-none"
    />
    <span className="sr-only">{label}</span>
  </div>
);

export default Spinner;
