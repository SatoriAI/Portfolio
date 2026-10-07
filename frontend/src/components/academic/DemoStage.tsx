import { type ReactNode, useState } from "react";

import { Col, Grid } from "@/components/layout/Grid";
import Reveal from "@/components/Reveal";
import { type DemoRun, useDemoRun } from "@/hooks/use-demo-run";

/**
 * A figure, the prose it illustrates and its control, laid out as one stage:
 * from lg the figure spans the stage's height on one side and the prose and
 * the control sit centred on it on the other; on a phone the markup's order,
 * prose, figure, control. The stage owns the control's value and the demo
 * run that moves it once (see useDemoRun), so the frames of the run render
 * this stage alone, not the page around it.
 */

/** From lg: which side the figure stands on, and whether it takes 7 columns rather than 6. */
type Placement = "right" | "left" | "left-wide";

const PLACEMENT: Record<
  Placement,
  { textSpan: 5 | 6; figureSpan: 6 | 7; text: string; figure: string; controls: string }
> = {
  right: {
    textSpan: 6,
    figureSpan: 6,
    text: "lg:col-start-1 lg:row-start-2",
    figure: "lg:col-start-7 lg:row-span-4 lg:row-start-1",
    controls: "lg:col-start-1 lg:row-start-3 lg:pt-4",
  },
  left: {
    textSpan: 6,
    figureSpan: 6,
    text: "lg:col-start-7 lg:row-start-2",
    figure: "lg:col-start-1 lg:row-span-4 lg:row-start-1",
    controls: "lg:col-start-7 lg:row-start-3 lg:pt-4",
  },
  "left-wide": {
    textSpan: 5,
    figureSpan: 7,
    text: "lg:col-start-8 lg:row-start-2 lg:pl-6",
    figure: "lg:col-start-1 lg:row-span-4 lg:row-start-1",
    controls: "lg:col-start-8 lg:row-start-3 lg:pl-6",
  },
};

type DemoStageProps = {
  placement: Placement;
  /** Where the value starts, before the run. */
  initial: number;
  demo: DemoRun;
  /** The run's raw value as the control's, e.g. rounded to a step. */
  fromDemo?: (value: number) => number;
  prose: ReactNode;
  figure: (value: number) => ReactNode;
  controls: (value: number, onChange: (value: number) => void) => ReactNode;
};

const DemoStage = ({
  placement,
  initial,
  demo,
  fromDemo = (value) => value,
  prose,
  figure,
  controls,
}: DemoStageProps) => {
  const [value, setValue] = useState(initial);
  const run = useDemoRun<HTMLDivElement>((next) => setValue(fromDemo(next)), demo);
  const place = PLACEMENT[placement];
  return (
    <Grid gapY={24} className="lg:grid-rows-[1fr_auto_auto_1fr]">
      <Col spanLg={place.textSpan} className={place.text}>
        {prose}
      </Col>
      <Col as={Reveal} spanLg={place.figureSpan} className={place.figure}>
        <div ref={run.ref}>{figure(value)}</div>
      </Col>
      <Col spanLg={place.textSpan} className={place.controls}>
        {controls(value, (next) => {
          run.stop();
          setValue(next);
        })}
      </Col>
    </Grid>
  );
};

export default DemoStage;
