import { useState } from "react";

import ClockExample from "@/components/academic/ClockExample";
import CyclicShiftFigure, {
  CyclicShiftControls,
  K_DEFAULT,
} from "@/components/academic/CyclicShiftFigure";
import DemoStage from "@/components/academic/DemoStage";
import GrokkingChart from "@/components/academic/GrokkingChart";
import StageHeading from "@/components/academic/StageHeading";
import { MathText } from "@/components/Formula";
import { Col, Grid } from "@/components/layout/Grid";
import { LINK, STORY_PROSE } from "@/components/research/prose";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import { translations } from "@/utils/translations";

/** The circle the wave rides: 0 to 112, and 113 is 0 again. */
const CYCLE = 113;
const SHIFT_DEMO = { from: 0, to: CYCLE, durationMs: 3000, delayMs: 1000 };

/**
 * The current investigation, told down the page in three stages a reader
 * without the mathematics can follow: the task, the measured result, the
 * mathematical clue, then what is not yet established. From lg the task's
 * prose takes columns 1–6 and its clock 7–12. The chart runs the full width,
 * and so does the introduction over it: the delay between the two rises is
 * the finding, and width is what shows a delay. On a phone the parts stack in
 * reading order. The measurement sits on white, the illustrations on
 * lavender, so the two are never mistaken.
 */
const GeneralisationThread = () => {
  // The shift figure's number of waves: the reader's choice, kept here. Each
  // figure's own value, which its demo moves frame by frame, lives in its
  // DemoStage, so a run renders that stage alone.
  const [waveK, setWaveK] = useState(K_DEFAULT);
  const { language } = useSettings();
  const transformers = translations[language].academic.interests.transformers;
  const [hook, clue, limits, outlook] = transformers.paragraphs;
  return (
    <div className="space-y-12 md:space-y-16">
      <div>
        <StageHeading title={transformers.stages.task} />
        {/* The paragraph is centred on the card as it is seen. A frame's
            visible edge runs through the middle of its label, half the
            label's 1.25rem line below the box, so the paragraph is pushed
            down by that half: 0.625rem of padding moves its centre by the
            5px the card's centre sits lower. */}
        <Grid gapY={32} className="lg:items-center">
          <Col spanLg={6} className="lg:pt-[0.625rem]">
            <p className={STORY_PROSE}>
              <MathText text={hook} />
            </p>
          </Col>
          <Col as={Reveal} spanLg={6}>
            <ClockExample labels={transformers.clock} />
          </Col>
        </Grid>
      </div>

      {/* Each text has one job. Above the chart, a fixed introduction that
          tells the story without tying a value to a step; in the panel, the
          selected step in words, which follows the chart, and under the plot
          how the runs were made; below the panel, what the result shows and
          the question the next stage takes up. Nothing repeats. */}
      <div>
        <StageHeading title={transformers.stages.result} />
        {/* The one stage that asks before it answers: the question over the
            chart, which shows the new examples once the reader has guessed,
            and the finding under it. Nothing here changes size. */}
        <p className={`mb-8 ${STORY_PROSE} lg:max-w-none`}>{transformers.predictQuestion}</p>
        <Reveal>
          <GrokkingChart labels={transformers.chart} locale={language} />
        </Reveal>
        <p className={`mt-8 ${STORY_PROSE} lg:max-w-none`}>
          <MathText text={transformers.resultLead} /> {transformers.resultCredit.before}
          <a
            href="https://arxiv.org/abs/2301.05217"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {transformers.resultCredit.setup}
          </a>
          {transformers.resultCredit.between}
          <a
            href="https://arxiv.org/abs/2201.02177"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {transformers.resultCredit.term}
          </a>
          {transformers.resultCredit.after}
        </p>
        {/* What the result shows and the question the next stage takes up,
            set as a quotation so it reads as the stage's conclusion: a rule
            in iris, the text in italic at full strength, at the prose's own
            size. A paragraph rather than a blockquote: the words are the
            page's own, not quoted from anyone. */}
        <p className="mt-8 max-w-[52ch] border-l-2 border-iris py-1 pl-6 text-base italic text-foreground md:text-body-lg lg:max-w-none">
          {transformers.resultQuestion}
        </p>
      </div>

      {/* The clue opens the stage across the full width. Under it the
          illustration takes columns 1–7, its panel holding the drawing and
          its caption, as the other figures do; columns 8–12 hold what to
          look for, the two sliders and the short explanation, centred on the
          panel's height by two flexible rows around them. The prompt comes
          first in the markup, so on a phone it precedes the drawing. */}
      <div>
        <StageHeading title={transformers.stages.clue} />
        <p className="mb-8 text-base text-foreground/80">
          <MathText text={clue} />
        </p>
        <DemoStage
          placement="left-wide"
          initial={0}
          demo={SHIFT_DEMO}
          fromDemo={(value) => Math.round(value) % CYCLE}
          prose={
            <p id="shift-prompt" className="text-base font-medium text-foreground md:text-body-lg">
              {transformers.figure.prompt}
            </p>
          }
          figure={(add) => (
            <CyclicShiftFigure
              labels={transformers.figure}
              k={waveK}
              add={add}
              describedBy="shift-prompt"
            />
          )}
          controls={(add, setAdd) => (
            <>
              <CyclicShiftControls
                labels={transformers.figure}
                k={waveK}
                add={add}
                onKChange={setWaveK}
                onAddChange={setAdd}
              />
              <div className="mt-8 border-t border-border pt-6">
                <p className="mb-2 font-mono text-meta font-medium uppercase tracking-widest text-muted-foreground">
                  {transformers.figure.curious}
                </p>
                <p className="text-base text-foreground/80">
                  <MathText text={transformers.figure.detail} />
                </p>
              </div>
            </>
          )}
        />
      </div>

      {/* The limits of the conclusion close the thread across its full width
          under the same dotted stage heading, in one paragraph set as the
          clue's is: what is not yet established, and what the experiment is
          for. */}
      <div>
        <StageHeading title={transformers.stages.open} />
        <p className="text-base text-foreground/80">
          <MathText text={`${limits} ${outlook}`} />
        </p>
      </div>
    </div>
  );
};

export default GeneralisationThread;
