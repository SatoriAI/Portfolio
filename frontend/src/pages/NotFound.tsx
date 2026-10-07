import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import RhythmMotif from "@/components/brand/RhythmMotif";
import Section from "@/components/layout/Section";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { translations } from "@/utils/translations";

const NotFound = () => {
  const location = useLocation();
  const { language } = useSettings();
  const t = translations[language];
  usePageMeta(t.meta.notFound);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Section className="w-full">
      <Reveal className="max-w-2xl">
        <p className="mb-4 font-mono text-meta uppercase tracking-widest text-iris">404</p>
        <h1 className="text-display-sm md:text-display">{t.notFound.title}</h1>
        <p className="mt-6 max-w-[55ch] text-base text-muted-foreground md:text-body-lg">
          {t.notFound.body}
        </p>
        <Button className="mt-8" asChild>
          <Link to="/">
            <ArrowLeft />
            {t.notFound.home}
          </Link>
        </Button>
        <RhythmMotif
          className="mt-14"
          modules={["lines", "square", "dot", "lines", "arch"]}
          accentIndex={1}
        />
      </Reveal>
    </Section>
  );
};

export default NotFound;
