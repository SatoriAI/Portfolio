import { Link } from "react-router-dom";

import DemoStage from "@/components/academic/DemoStage";
import InfluenceMapFigure, { InfluenceMapControls } from "@/components/academic/InfluenceMapFigure";
import SharpBoundsFigure, { SharpBoundsControls } from "@/components/academic/SharpBoundsFigure";
import StageHeading from "@/components/academic/StageHeading";
import { MathText } from "@/components/Formula";
import { LINK, STORY_PROSE } from "@/components/research/prose";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { BOUNDS_START, INFLUENCE_START } from "@/lib/kernelFigures";
import { translations } from "@/utils/translations";

/**
 * A kernel figure's slider run once, from the start of time to its end, then
 * back to where the figure reads clearest; the two figures set theirs.
 */
const demoTo = (rest: number) => ({ from: 0, to: 1, durationMs: 2600, rest });
const INFLUENCE_DEMO = demoTo(INFLUENCE_START);
const BOUNDS_DEMO = demoTo(BOUNDS_START);

/**
 * Heat kernels, in four short stages a reader without the mathematics can
 * follow: what a heat kernel is, drawn as a map of influence; why geometry
 * complicates it; what a sharp estimate is, drawn as two bounds of one shape;
 * and what the bounds are for, which leads on to the quantum thread. The
 * figures start at the start of time where their slider will run; with
 * reduced motion nothing runs and they rest where they are clearest.
 */
const HeatKernelsThread = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { language } = useSettings();
  const kernels = translations[language].academic.story.kernels;
  return (
    <div className="space-y-12 md:space-y-16">
      <div>
        <StageHeading title={kernels.stages.map} />
        {/* Prose and controls in columns 1–6, centred on the figure's
            height by the flexible rows around them; the figure in 7–12.
            The figure comes second in the markup, so on a phone it sits
            between the prose and the controls it answers to. */}
        <DemoStage
          placement="right"
          initial={prefersReducedMotion ? INFLUENCE_START : 0}
          demo={INFLUENCE_DEMO}
          prose={<p className={STORY_PROSE}>{kernels.map}</p>}
          figure={(time) => <InfluenceMapFigure labels={kernels.influence} position={time} />}
          controls={(time, setTime) => (
            <InfluenceMapControls
              labels={kernels.influence}
              position={time}
              onPositionChange={setTime}
            />
          )}
        />
      </div>

      <div>
        <StageHeading title={kernels.stages.geometry} />
        <p className="text-base text-foreground/80 md:text-body-lg">{kernels.geometry}</p>
      </div>

      <div>
        <StageHeading title={kernels.stages.sharp} />
        {/* Mirrored from the first stage: the figure on the left from lg,
            the prose and its control on the right. A phone keeps the
            markup's order: prose, figure, control. */}
        <DemoStage
          placement="left"
          initial={prefersReducedMotion ? BOUNDS_START : 0}
          demo={BOUNDS_DEMO}
          prose={
            <p className={STORY_PROSE}>
              <MathText text={kernels.sharp} />
            </p>
          }
          figure={(time) => <SharpBoundsFigure labels={kernels.bounds} position={time} />}
          controls={(time, setTime) => (
            <SharpBoundsControls
              labels={kernels.bounds}
              position={time}
              onPositionChange={setTime}
            />
          )}
        />
      </div>

      <div>
        <StageHeading title={kernels.stages.why} />
        <p className="text-base text-foreground/80 md:text-body-lg">
          {kernels.whyBefore}
          <Link to="/research/quantum-algorithm" className={LINK}>
            {kernels.whyLink}
          </Link>
          {kernels.whyAfter}
        </p>
      </div>
    </div>
  );
};

export default HeatKernelsThread;
