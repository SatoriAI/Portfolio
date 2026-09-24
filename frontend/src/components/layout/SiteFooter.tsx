import { BrandSymbol } from "@/components/brand/BrandLogo";
import Container from "@/components/layout/Container";
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
      <Container className="flex flex-col items-center justify-between gap-4 text-foreground sm:flex-row">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <BrandSymbol size={28} />
          Dawid Hanrahan
        </span>
        <span className="font-mono text-meta text-muted-foreground">
          © {new Date().getFullYear()} · {t.common.tagline}
        </span>
      </Container>
    </footer>
  );
};

export default SiteFooter;
