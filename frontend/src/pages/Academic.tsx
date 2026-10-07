import { useState } from "react";

import ClockExample from "@/components/academic/ClockExample";
import CyclicShiftFigure, {
  CyclicShiftControls,
  K_DEFAULT,
} from "@/components/academic/CyclicShiftFigure";
import GrokkingChart from "@/components/academic/GrokkingChart";
import HeatRodFigure from "@/components/academic/HeatRodFigure";
import InfluenceMapFigure, { InfluenceMapControls } from "@/components/academic/InfluenceMapFigure";
import PublicationStack from "@/components/academic/PublicationStack";
import SharpBoundsFigure, { SharpBoundsControls } from "@/components/academic/SharpBoundsFigure";
import StageHeading from "@/components/academic/StageHeading";
import HeaderShapes from "@/components/brand/HeaderShapes";
import HeatField from "@/components/brand/HeatField";
import { queryStatus } from "@/components/feedback/queryStatus";
import StatusMessage from "@/components/feedback/StatusMessage";
import { MathText } from "@/components/Formula";
import { Col, Grid } from "@/components/layout/Grid";
import PageClosing from "@/components/layout/PageClosing";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import { useDemoRun } from "@/hooks/use-demo-run";
import { usePageMeta } from "@/hooks/use-page-meta";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { BOUNDS_START, INFLUENCE_START } from "@/lib/kernelFigures";
import type { UiPublication } from "@/lib/publicationsService";
import { usePublications } from "@/lib/queries";
import { translations } from "@/utils/translations";

/**
 * The research story's paragraphs, set as the site's prose is on the home
 * page: 16px on phones, 18/29 from md, at most 52ch.
 */
const STORY_PROSE = "max-w-[52ch] text-base text-muted-foreground md:text-body-lg";

const SECTION_COUNT = 4;

/**
 * A kernel figure's slider run once, from the start of time to its end, then
 * back to where the figure reads clearest; the two figures set theirs.
 */
const demoTo = (rest: number) => ({ from: 0, to: 1, durationMs: 2600, rest });
const INFLUENCE_DEMO = demoTo(INFLUENCE_START);
const BOUNDS_DEMO = demoTo(BOUNDS_START);
/** The circle the wave rides: 0 to 112, and 113 is 0 again. */
const CYCLE = 113;
const eyebrow = (index: number) =>
  `${String(index).padStart(2, "0")} / ${String(SECTION_COUNT).padStart(2, "0")}`;

/**
 * Research, told in the order of the work's standing: the established work
 * on heat kernels; the current investigation; a developing interest,
 * smaller; and the papers. The degrees and the teaching have a page of
 * their own.
 */
const Academic = () => {
  // The shift figure's number of waves and the amount added to every number:
  // the figure draws them, and its controls, set beside it, change them.
  const [waveK, setWaveK] = useState(K_DEFAULT);
  const [waveShift, setWaveShift] = useState(0);
  // The two heat-kernel figures, whose controls sit beside the prose.
  // They start at the start of time where their slider will run, so the run
  // begins where the figure already is; with reduced motion, nothing runs and
  // they rest where they are clearest.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [influenceTime, setInfluenceTime] = useState(prefersReducedMotion ? INFLUENCE_START : 0);
  const [boundsTime, setBoundsTime] = useState(prefersReducedMotion ? BOUNDS_START : 0);
  // Each figure shows what its slider does by running it once, start to end,
  // the first time it is seen; the reader has the slider from then on. The
  // wave goes once round the circle, back to where it began, after it has
  // drawn itself.
  const influenceDemo = useDemoRun<HTMLDivElement>(setInfluenceTime, INFLUENCE_DEMO);
  const boundsDemo = useDemoRun<HTMLDivElement>(setBoundsTime, BOUNDS_DEMO);
  const shiftDemo = useDemoRun<HTMLDivElement>((value) => setWaveShift(Math.round(value) % CYCLE), {
    from: 0,
    to: CYCLE,
    durationMs: 3000,
    delayMs: 1000,
  });
  const { language } = useSettings();
  const t = translations[language];
  const story = t.academic.story;
  const kernels = story.kernels;
  const transformers = t.academic.interests.transformers;
  const [hook, clue, limits, outlook] = transformers.paragraphs;
  usePageMeta(t.meta.research);
  const publicationsQuery = usePublications();
  const publications = publicationsQuery.data ?? [];

  const publicationLabels = {
    view: t.academic.view,
    stack: t.academic.stack,
    established: t.academic.established,
    author: t.academic.author,
    authors: t.academic.authors,
    status: t.academic.status,
  };
  // The stack opens on the published paper, preprints behind it; newest
  // first within each.
  const isPreprint = (paper: UiPublication) => /arxiv/i.test(paper.journal);
  const papersInOrder = [...publications].sort(
    (a, b) => Number(isPreprint(a)) - Number(isPreprint(b)) || b.year - a.year,
  );

  const status = queryStatus([publicationsQuery], {
    loading: t.common.loading,
    error: t.academic.error,
    retry: t.academic.tryAgain,
  });

  return (
    <PageLayout>
      {/* Every subpage opens the same way: the header alone on the page
          background, then its first section on white, the sections after
          it alternating, and the closing on the colour field. */}
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="research" />
        <SectionHeading
          level={1}
          eyebrow={t.academic.eyebrow}
          title={t.academic.title}
          leadLine={story.lead}
          // mb-0 at every width: the heading's own md:mb-12 would add a gap
          // under the lead that the band's padding already gives.
          className="mb-0 md:mb-0"
        />
      </Section>

      {/* Heat kernels, in four short stages a reader without the
          mathematics can follow: what a heat kernel is, drawn as a map of
          influence; why geometry complicates it; what a sharp estimate is,
          drawn as two bounds of one shape; and what the bounds are for, which
          leads on to the quantum section. The papers themselves are listed
          with the others at the end of the page. */}
      <Section id="kernels" tone="surface">
        <SectionHeading eyebrow={eyebrow(1)} title={kernels.title} leadLine={kernels.leadLine} />
        <div className="space-y-12 md:space-y-16">
          <div>
            <StageHeading title={kernels.stages.map} />
            {/* Prose and controls in columns 1–6, centred on the figure's
                height by the flexible rows around them; the figure in 7–12.
                The figure comes second in the markup, so on a phone it sits
                between the prose and the controls it answers to. */}
            <Grid gapY={24} className="lg:grid-rows-[1fr_auto_auto_1fr]">
              <Col spanLg={6} className="lg:col-start-1 lg:row-start-2">
                <p className={STORY_PROSE}>{kernels.map}</p>
              </Col>
              <Col as={Reveal} spanLg={6} className="lg:col-start-7 lg:row-span-4 lg:row-start-1">
                <div ref={influenceDemo.ref}>
                  <InfluenceMapFigure labels={kernels.influence} position={influenceTime} />
                </div>
              </Col>
              <Col spanLg={6} className="lg:col-start-1 lg:row-start-3 lg:pt-4">
                <InfluenceMapControls
                  labels={kernels.influence}
                  position={influenceTime}
                  onPositionChange={(value) => {
                    influenceDemo.stop();
                    setInfluenceTime(value);
                  }}
                />
              </Col>
            </Grid>
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
            <Grid gapY={24} className="lg:grid-rows-[1fr_auto_auto_1fr]">
              <Col spanLg={6} className="lg:col-start-7 lg:row-start-2">
                <p className={STORY_PROSE}>
                  <MathText text={kernels.sharp} />
                </p>
              </Col>
              <Col as={Reveal} spanLg={6} className="lg:col-start-1 lg:row-span-4 lg:row-start-1">
                <div ref={boundsDemo.ref}>
                  <SharpBoundsFigure labels={kernels.bounds} position={boundsTime} />
                </div>
              </Col>
              <Col spanLg={6} className="lg:col-start-7 lg:row-start-3 lg:pt-4">
                <SharpBoundsControls
                  labels={kernels.bounds}
                  position={boundsTime}
                  onPositionChange={(value) => {
                    boundsDemo.stop();
                    setBoundsTime(value);
                  }}
                />
              </Col>
            </Grid>
          </div>

          <div>
            <StageHeading title={kernels.stages.why} />
            <p className="text-base text-foreground/80 md:text-body-lg">
              {kernels.whyBefore}
              <a
                href="#jacobi-quantum"
                className="text-iris underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
              >
                {kernels.whyLink}
              </a>
              {kernels.whyAfter}
            </p>
          </div>
        </div>
      </Section>

      {/* The current investigation, told down the page in three stages a
          reader without the mathematics can follow: the task, the measured
          result, the mathematical clue, whose right column closes on what is
          not yet established. From lg the task's prose takes columns 1–6
          and its clock 7–12. The chart runs the full width, and so does
          the introduction over it: the delay between the two rises is the
          finding, and width is what shows a delay. On a phone the parts
          stack in reading order. The measurement sits on white, the
          illustrations on lavender, so the two are never mistaken. */}
      <Section id="transformers" className="py-12 md:py-16">
        <SectionHeading
          eyebrow={eyebrow(2)}
          title={transformers.title}
          leadLine={story.transformers.question}
        />
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

          {/* Each text has one job. Above the chart, a fixed introduction
              that tells the story without tying a value to a step; in the
              panel, the selected step in words, which follows the chart,
              and under the plot how the runs were made; below the panel,
              what the result shows and the question the next stage takes up.
              Nothing repeats. */}
          <div>
            <StageHeading title={transformers.stages.result} />
            {/* The one stage that asks before it answers: the question over
                the chart, which shows the new examples once the reader has
                guessed, and the finding under it. Nothing here changes size. */}
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
                className="text-iris underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
              >
                {transformers.resultCredit.setup}
              </a>
              {transformers.resultCredit.between}
              <a
                href="https://arxiv.org/abs/2201.02177"
                target="_blank"
                rel="noopener noreferrer"
                className="text-iris underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
              >
                {transformers.resultCredit.term}
              </a>
              {transformers.resultCredit.after}
            </p>
            {/* What the result shows and the question the next stage takes up, set
                as a quotation so it reads as the stage's conclusion: a rule
                in iris, the text in italic at full strength, at the prose's
                own size. A paragraph rather than a blockquote: the words are
                the page's own, not quoted from anyone. */}
            <p className="mt-8 max-w-[52ch] border-l-2 border-iris py-1 pl-6 text-base italic text-foreground md:text-body-lg lg:max-w-none">
              {transformers.resultQuestion}
            </p>
          </div>

          {/* The clue opens the stage across the full width. Under it the
            illustration takes columns 1–7, its panel holding the drawing
            and its caption, as the other figures do; columns 8–12 hold what
            to look for, the two sliders and the short explanation, centred
            on the panel's height by two flexible rows around them. The prompt
            comes first in the markup, so on a phone it precedes the
            drawing.
            What is not yet established closes the section on its own row. */}
          <div>
            <StageHeading title={transformers.stages.clue} />
            <p className="mb-8 text-base text-foreground/80">
              <MathText text={clue} />
            </p>
            <Grid gapY={24} className="lg:grid-rows-[1fr_auto_auto_1fr]">
              <Col spanLg={5} className="lg:col-start-8 lg:row-start-2 lg:pl-6">
                <p
                  id="shift-prompt"
                  className="text-base font-medium text-foreground md:text-body-lg"
                >
                  {transformers.figure.prompt}
                </p>
              </Col>
              <Col as={Reveal} spanLg={7} className="lg:col-start-1 lg:row-span-4 lg:row-start-1">
                <div ref={shiftDemo.ref}>
                  <CyclicShiftFigure
                    labels={transformers.figure}
                    k={waveK}
                    add={waveShift}
                    describedBy="shift-prompt"
                  />
                </div>
              </Col>
              <Col spanLg={5} className="lg:col-start-8 lg:row-start-3 lg:pl-6">
                <CyclicShiftControls
                  labels={transformers.figure}
                  k={waveK}
                  add={waveShift}
                  onKChange={setWaveK}
                  onAddChange={(value) => {
                    shiftDemo.stop();
                    setWaveShift(value);
                  }}
                />
                <div className="mt-8 border-t border-border pt-6">
                  <p className="mb-2 font-mono text-meta uppercase tracking-widest text-iris">
                    {transformers.figure.curious}
                  </p>
                  <p className="text-base text-foreground/80">
                    <MathText text={transformers.figure.detail} />
                  </p>
                </div>
              </Col>
            </Grid>
          </div>

          {/* The limits of the conclusion close the section across its full
            width under the same dotted stage heading, in one paragraph
            set as the clue's is: what is not yet established, and what the
            experiment is for. */}
          <div>
            <StageHeading title={transformers.stages.open} />
            <p className="text-base text-foreground/80">
              <MathText text={`${limits} ${outlook}`} />
            </p>
          </div>
        </div>
      </Section>

      {/* A proposed research programme, after the established kernel result
          and current AI investigation. The illustration is the text's rod
          and nothing more: one process, never a Jacobi kernel or a proved
          truncation. Text separates the observable, the analytic obstacle
          and the still-open end-to-end complexity comparison. */}
      <Section id="jacobi-quantum" tone="surface">
        <SectionHeading
          eyebrow={eyebrow(3)}
          title={story.jacobiQuantum.title}
          leadLine={story.jacobiQuantum.leadLine}
        />
        <StageHeading title={story.jacobiQuantum.introTitle} />
        <p className="mb-10 text-base text-foreground/80 md:text-body-lg">
          {story.jacobiQuantum.intro}
        </p>
        <StageHeading title={story.jacobiQuantum.clueTitle} />
        <p className="mb-10 text-base text-foreground/80 md:text-body-lg">
          {story.jacobiQuantum.clueBeforePaper}
          <a
            className="text-iris underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="https://arxiv.org/abs/1905.10581"
            target="_blank"
            rel="noopener noreferrer"
          >
            {story.jacobiQuantum.paper}
          </a>
          {story.jacobiQuantum.clueAfterPaper}
        </p>
        <Grid gapY={32} className="lg:items-center">
          {/* The figure leads on phones, sits right of the text from lg. */}
          <Col as={Reveal} spanLg={7} className="lg:order-last">
            <HeatRodFigure labels={story.jacobiQuantum.figure} />
          </Col>
          <Col spanLg={5} className="lg:pr-6">
            <StageHeading title={story.jacobiQuantum.proofTitle} />
            <p className="text-base text-muted-foreground md:text-body-lg">
              {story.jacobiQuantum.proof}
            </p>
          </Col>
        </Grid>
      </Section>

      {/* All the papers, with their links and details, at the end of the page:
          the sections above tell the story, this is the record. */}
      <Section id="publications" className="py-12 md:py-16">
        <SectionHeading eyebrow={eyebrow(4)} title={t.academic.publications} />
        {status ??
          (publications.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noPublications} />
          ) : (
            // Filed on its own entrance, so not wrapped in the kit's fade.
            <PublicationStack
              publications={papersInOrder}
              labels={publicationLabels}
              summaries={t.academic.publicationSummaries}
            />
          ))}
      </Section>

      {/* How the page ends, as every subpage does: a question in its own
          terms and two ways to answer it. */}
      {/* Pushed to the foot of a short page, so it closes the page right
          above the footer rather than leaving a gap under it. */}
      <HeatField className="mt-auto">
        <Section className="py-12 md:py-20">
          <PageClosing
            title={story.researchClosing.title}
            body={story.researchClosing.body}
            labels={{ email: story.researchClosing.email, askVex: t.hero.askAI }}
            next={{ ...story.researchClosing.next, to: "/education" }}
          />
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Academic;
