import HeatRodFigure from "@/components/academic/HeatRodFigure";
import StageHeading from "@/components/academic/StageHeading";
import { Col, Grid } from "@/components/layout/Grid";
import { LINK } from "@/components/research/prose";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import { translations } from "@/utils/translations";

/**
 * A proposed research programme, built on the kernel results. The
 * illustration is the text's rod and nothing more: one process, never a
 * Jacobi kernel or a proved truncation. Text separates the observable, the
 * analytic obstacle and the still-open end-to-end complexity comparison.
 */
const QuantumAlgorithmThread = () => {
  const { language } = useSettings();
  const quantum = translations[language].academic.story.jacobiQuantum;
  return (
    <>
      <StageHeading title={quantum.introTitle} />
      <p className="mb-10 text-base text-foreground/80 md:text-body-lg">{quantum.intro}</p>
      <StageHeading title={quantum.clueTitle} />
      <p className="mb-10 text-base text-foreground/80 md:text-body-lg">
        {quantum.clueBeforePaper}
        <a
          className={LINK}
          href="https://arxiv.org/abs/1905.10581"
          target="_blank"
          rel="noopener noreferrer"
        >
          {quantum.paper}
        </a>
        {quantum.clueAfterPaper}
      </p>
      <Grid gapY={32} className="lg:items-center">
        {/* The figure leads on phones, sits right of the text from lg. */}
        <Col as={Reveal} spanLg={7} className="lg:order-last">
          <HeatRodFigure labels={quantum.figure} />
        </Col>
        <Col spanLg={5} className="lg:pr-6">
          <StageHeading title={quantum.proofTitle} />
          <p className="text-base text-muted-foreground md:text-body-lg">{quantum.proof}</p>
        </Col>
      </Grid>
    </>
  );
};

export default QuantumAlgorithmThread;
