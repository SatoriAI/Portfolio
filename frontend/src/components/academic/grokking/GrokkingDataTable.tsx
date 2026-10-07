import { GROKKING_RUNS, GROKKING_STEPS } from "@/lib/grokking";

/** The full data, for screen readers: every run at every measured step. */
const GrokkingDataTable = ({
  labels,
  formatStep,
  formatPercent,
}: {
  labels: { title: string; step: string; run: string; seen: string; unseen: string };
  formatStep: (step: number) => string;
  formatPercent: (value: number) => string;
}) => (
  <table className="sr-only">
    <caption>{labels.title}</caption>
    <thead>
      <tr>
        <th scope="col">{labels.step}</th>
        <th scope="col">{labels.run}</th>
        <th scope="col">{labels.seen}</th>
        <th scope="col">{labels.unseen}</th>
      </tr>
    </thead>
    <tbody>
      {GROKKING_STEPS.flatMap((tick) =>
        GROKKING_RUNS.map((run, index) => {
          const point = run.points.find((p) => p.step === tick);
          return (
            <tr key={`${tick}-${run.seed}`}>
              <td>{formatStep(tick)}</td>
              <td>{index + 1}</td>
              <td>{point ? formatPercent(point.train) : ""}</td>
              <td>{point ? formatPercent(point.test) : ""}</td>
            </tr>
          );
        }),
      )}
    </tbody>
  </table>
);

export default GrokkingDataTable;
