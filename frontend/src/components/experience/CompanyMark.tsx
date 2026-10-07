import type { CSSProperties } from "react";

import { companyLogos } from "@/config/companyLogos";
import { companyInitials } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * A company as a circle: its logo on the logo's own colour (or picture), or
 * its initials on navy where there is no logo. Sized by the caller. Shared by
 * the timeline's buttons and the header of the role they open, so the circle
 * the visitor pressed is the circle they find in the dialog.
 */

type CompanyMarkProps = {
  company: string;
  className?: string;
  style?: CSSProperties;
};

const CompanyMark = ({ company, className, style }: CompanyMarkProps) => {
  const logo = companyLogos[company];
  return (
    <span
      aria-hidden="true"
      style={{ ...(logo ? { backgroundColor: logo.background } : {}), ...style }}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full font-mono font-semibold",
        // A logo keeps its own colours, so a hairline edges it on the page.
        logo ? "ring-1 ring-border" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {logo ? (
        <>
          {logo.backdrop && (
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${logo.backdrop})` }}
            />
          )}
          <img
            src={logo.src}
            alt=""
            className="relative max-w-none object-contain"
            style={{ width: `${logo.scale * 100}%` }}
          />
        </>
      ) : (
        companyInitials(company)
      )}
    </span>
  );
};

export default CompanyMark;
