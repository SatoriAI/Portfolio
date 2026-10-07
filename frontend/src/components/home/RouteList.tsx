import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import RouteGlyph, { type RouteKind } from "@/components/home/RouteGlyph";

/**
 * The ways on from the home page into the full record: a row each, the
 * page's signature in miniature (see RouteGlyph), its name, one line of what
 * is there, and an arrow. Each row is the whole link and at least 44px tall,
 * a hairline between rows.
 */

export type Route = {
  kind: RouteKind;
  to: string;
  name: string;
  line: string;
};

const RouteList = ({ routes }: { routes: readonly Route[] }) => (
  <ol className="border-t border-border">
    {routes.map((route) => (
      <li key={route.to} className="border-b border-border">
        <Link
          to={route.to}
          className="group flex min-h-11 items-baseline gap-4 rounded-lg py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background"
        >
          <RouteGlyph kind={route.kind} />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-iris">
              {route.name}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{route.line}</span>
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 self-center text-iris transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </li>
    ))}
  </ol>
);

export default RouteList;
