import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
};

/** Kit composition: content up to 1160px, 24px gutters on phones, 48px on large screens. */
const Container = ({ as: Tag = "div", className, ...props }: ContainerProps) => (
  <Tag className={cn("mx-auto w-full max-w-content px-6 lg:px-12", className)} {...props} />
);

export default Container;
