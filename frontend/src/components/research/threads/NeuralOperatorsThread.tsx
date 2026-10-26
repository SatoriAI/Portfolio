import { Fragment } from "react";

import FigureFrame from "@/components/academic/FigureFrame";
import HiddenGradientFigure from "@/components/academic/HiddenGradientFigure";
import StageHeading from "@/components/academic/StageHeading";
import { withPaper } from "@/components/research/prose";
import Reveal from "@/components/Reveal";
import AliasingFigure from "@/components/workshop/AliasingFigure";
import { useSettings } from "@/contexts/SettingsContext";
import { translations } from "@/utils/translations";

/** The first neural-operator paper, linked from the words that name it in the prose. */
const OPERATOR_PAPER = "https://arxiv.org/abs/2610.20106";
/** The paragraph of "When the rules change" that the grid figure follows: the obstruction. */
const GRID_PARAGRAPH = 3;

/**
 * The neural-operator papers, in stages a reader without the mathematics can
 * follow, with the first paper linked from the words that name it. Its two
 * figures draw the hidden gradient and the grid's obstruction.
 */
const NeuralOperatorsThread = () => {
  const { language } = useSettings();
  const t = translations[language];
  const operators = t.academic.story.neuralOperators;
  const linked = (paragraph: string, paper?: string) => withPaper(paragraph, paper, OPERATOR_PAPER);
  return (
    <>
      {operators.stages.map((stage, index, stages) => {
        // The stage after the figure's is drawn beside the figure, below.
        if (stages[index - 1]?.id === "gradient") return null;
        const paragraphs = stage.paragraphs.map((paragraph) => linked(paragraph, stage.paper));
        const next = stages[index + 1];
        return (
          <div key={stage.id} className="mb-10 last:mb-0">
            <StageHeading title={stage.title} />
            {stage.id === "gradient" ? (
              // The mechanism, drawn: from lg the figure, with its own slider,
              // floats in columns 6–12, and the prose runs beside it and on
              // into the next stage, so the column beside the tall figure
              // holds text rather than a gap; past the figure the text takes
              // the full width. A phone reads the stage's prose, the figure,
              // then the next stage.
              <div className="flex flex-col gap-4 text-base text-foreground/80 md:text-body-lg lg:block lg:flow-root">
                <Reveal className="order-2 my-4 lg:float-right lg:my-0 lg:mb-6 lg:ml-6 lg:w-[calc((100%_-_264px)_*_7_/_12_+_144px)]">
                  <HiddenGradientFigure
                    labels={operators.gradient}
                    controls={operators.gradientControls}
                    locale={language}
                  />
                </Reveal>
                {paragraphs.map((paragraph, at) => (
                  <p key={at} className="order-1 lg:mb-4">
                    {paragraph}
                  </p>
                ))}
                {next && (
                  <div className="order-3 mt-6 lg:mt-10">
                    <StageHeading title={next.title} />
                    {next.paragraphs.map((paragraph, at) => (
                      <p key={at} className="mt-4 first-of-type:mt-0">
                        {linked(paragraph, next.paper)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-base text-foreground/80 md:text-body-lg">
                {paragraphs.map((paragraph, at) => (
                  <Fragment key={at}>
                    <p>{paragraph}</p>
                    {/* The grid's obstruction, drawn with the workshop's own
                        figure, after the paragraph that names it. */}
                    {stage.id === "second" && at === GRID_PARAGRAPH && (
                      <Reveal className="!my-8">
                        <FigureFrame kind="illustration" label={t.workshop.figure.illustration}>
                          <figure>
                            <span className="sr-only">{operators.grid.alt}</span>
                            <AliasingFigure labels={t.workshop.figure.aliasing} />
                            <figcaption className="mt-6 text-sm text-foreground/80">
                              {operators.grid.caption}
                            </figcaption>
                          </figure>
                        </FigureFrame>
                      </Reveal>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default NeuralOperatorsThread;
