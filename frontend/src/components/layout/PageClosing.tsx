import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";

import HeatField from "@/components/brand/HeatField";
import Section from "@/components/layout/Section";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { EMAIL } from "@/config/contact";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

/**
 * How a subpage ends: one question in the page's own terms, one line, and two
 * ways to answer it — write, or ask Vex first. Set on the site's grid with
 * the page's own split: the question and its line in the left columns, the
 * two ways and the way on in the right, so every edge in the band lines up
 * with something above it. The question is set a step under the page's
 * title, so the ending never outranks the content. Every subpage ends on it,
 * so a reader who has reached the bottom of any of them is never left
 * without a next step. After the buttons, a quiet way on to the next page,
 * so the subpages read as one path: Experience, then Research, then
 * Education, then back to the projects.
 *
 * It brings its own band, the heat field, pushed to the foot of a short
 * page so it closes the page right above the footer rather than leaving a
 * gap under it.
 */

type PageClosingProps = {
  /** The page's own closing copy: its question, its line, the e-mail button's words. */
  copy: { title: string; body: string; email: string };
  /** The way on: a lead-in, then the next page's name as the link. */
  next?: { lead: string; label: string; to: string };
  /** The e-mail's subject, when the question is about something in particular. */
  subject?: string;
  /** How many of the twelve columns the page's left part takes above. */
  split?: 4 | 5;
};

/** The split as literal classes, so Tailwind finds them. */
const SPLIT = {
  4: { left: "lg:col-span-4", right: "lg:col-start-5" },
  5: { left: "lg:col-span-5", right: "lg:col-start-6" },
} as const;

const PageClosing = ({
  copy: { title, body, email },
  next,
  subject,
  split = 5,
}: PageClosingProps) => {
  const { askVex } = useVex();
  const { language } = useSettings();
  const mailto = `mailto:${EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;

  return (
    <HeatField className="mt-auto">
      <Section className="py-12 md:py-20">
        <Reveal className="grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-6">
          <h2 className={cn("text-balance text-card-title-sm md:text-h2-sm", SPLIT[split].left)}>
            {title}
          </h2>
          <p
            className={cn(
              "max-w-[38ch] text-base text-muted-foreground md:text-body-lg lg:row-start-2",
              SPLIT[split].left,
            )}
          >
            {body}
          </p>
          {/* Level with the question's first line, wherever the question wraps;
          the way on below them, level with the line. */}
          <div
            className={cn(
              "mt-5 flex flex-wrap gap-3 lg:col-end-13 lg:row-start-1 lg:-mt-1.5 lg:self-start",
              SPLIT[split].right,
            )}
          >
            <Button asChild>
              <a href={mailto}>
                <Mail />
                {email}
              </a>
            </Button>
            <Button variant="outline" onClick={() => askVex()}>
              <MessageSquare />
              {translations[language].hero.askAI}
            </Button>
          </div>
          {/* After the two ways to answer, the way on: the band's job is
          contact, keeping reading comes second. The link is 44px to press
          (its padding reaches past the line, the margin takes it back), and
          the name and arrow never part. */}
          {next && (
            <p
              className={cn(
                "mt-6 font-mono text-meta text-muted-foreground lg:col-end-13 lg:row-start-2 lg:mt-0 lg:self-center",
                SPLIT[split].right,
              )}
            >
              {next.lead}{" "}
              <Link
                to={next.to}
                className="group -my-3 inline-flex items-center gap-1 whitespace-nowrap py-3 text-iris underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-foreground"
              >
                {next.label}
                <ArrowRight
                  aria-hidden="true"
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </p>
          )}
        </Reveal>
      </Section>
    </HeatField>
  );
};

export default PageClosing;
