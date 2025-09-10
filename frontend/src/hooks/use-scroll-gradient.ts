import { useEffect, useMemo, useState } from 'react';

type GradientStops = {
  from: string;
  via: string;
  to: string;
};

export function useScrollGradient(light: GradientStops, dark: GradientStops) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(clamp(max > 0 ? window.scrollY / max : 0, 0, 1));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const style = useMemo(() => {
    const lightFrom = light.from; // hsla strings
    const lightViaWarm = light.via;
    const lightTo = light.to;

    const darkFrom = dark.from;
    const darkVia = dark.via;
    const darkTo = dark.to;

    // Base smooth gradient (no moving stops)
    const lightBase = `linear-gradient(180deg, ${lightFrom} 0%, ${lightViaWarm} 50%, ${lightTo} 100%)`;

    // Subtle overlay that increases cool tint as you scroll, without hard edges
    const coolAlpha = (0.0 + 0.25 * progress).toFixed(3);
    const lightCool = `hsla(200,85%,94%,${coolAlpha})`;
    const lightOverlay = `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${lightCool} 50%, rgba(0,0,0,0) 100%)`;
    const lightGradient = `${lightBase}, ${lightOverlay}`;

    // Dark remains constant to preserve mood
    const darkBase = `linear-gradient(180deg, ${darkFrom} 0%, ${darkVia} 50%, ${darkTo} 100%)`;
    const darkTint = `hsla(217,80%,55%,${(0.0 + 0.12 * progress).toFixed(3)})`;
    const darkOverlay = `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${darkTint} 50%, rgba(0,0,0,0) 100%)`;

    return { lightGradient, darkBase, darkOverlay };
  }, [progress, light, dark]);

  return style;
}


