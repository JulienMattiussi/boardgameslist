import { PrintJob } from "@/lib/print";
import { PrintList } from "./PrintList";

type Props = {
  job: PrintJob;
};

export function PrintDocument({ job }: Props) {
  return (
    <>
      {job.sections.map((section, index) => (
        <PrintList
          key={index}
          games={section.games}
          summary={job.summary}
          label={section.label}
          richness={job.config.richness}
          optimize={job.config.optimizeTitles}
        />
      ))}
    </>
  );
}
