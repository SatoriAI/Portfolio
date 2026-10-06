import { BrandSymbol } from "@/components/brand/BrandLogo";
import Container from "@/components/layout/Container";
import { EMAIL } from "@/config/contact";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

type SiteFooterProps = {
  className?: string;
};

const SiteFooter = ({ className }: SiteFooterProps) => {
  const { language } = useSettings();
  const t = translations[language];
  return (
    <footer className={cn("border-t border-border py-8", className)}>
      {/* One row from lg; below it the two lines stack, left-aligned with the
          page, and on a phone the address goes under the name. */}
      <Container className="flex flex-col items-start justify-between gap-3 text-foreground lg:flex-row lg:items-center">
        <span className="inline-flex flex-col items-start gap-x-2 gap-y-1 text-sm sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2 font-medium">
            <BrandSymbol size={28} />
            Dawid Hanrahan
          </span>
          <span aria-hidden="true" className="hidden text-muted-foreground sm:inline">
            ·
          </span>
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-sm font-mono text-meta text-muted-foreground underline decoration-1 underline-offset-4 outline-none transition-colors duration-200 hover:text-iris focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {EMAIL}
          </a>
        </span>
        {/* The footer lines up with the page; only this line keeps clear of
            the floating chat button, where the margin is narrower than it
            (24px below lg, 48px until the content's cap leaves room). */}
        <span className="font-mono text-meta text-muted-foreground sm:max-lg:mr-16 lg:max-[1335px]:mr-10">
          © {new Date().getFullYear()} · {t.common.tagline}
        </span>
      </Container>
    </footer>
  );
};

export default SiteFooter;
