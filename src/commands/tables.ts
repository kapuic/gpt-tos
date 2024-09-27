import prompts from "prompts";

import { Script } from "../utils/commands";
import LogUtils from "../utils/log";

const { prisma } = await Script.describe(
  "Tables",
  "This script will generate tables for the Appendix.",
);

const runs = await prisma.run.findMany({
  include: { summaries: { select: { documentUrl: true } } },
});
if (runs.length === 0) {
  LogUtils.error(
    "No runs. Create a run of summarizations by running `bun summarize`.",
  );
  process.exit(1);
}
const { runId } = (await prompts({
  name: "runId",
  type: "select",
  message:
    "Use which run? Create a run of summarizations by running `bun summarize`.",
  choices: [
    { value: "all", title: "All" },
    ...runs.map((run) => ({
      value: run.id,
      title: run.name
        ? `${run.name} (${run.summaries.length})`
        : `${run.summaries.length} summaries`,
      description: `${run.startedAt.toLocaleString()} - ${run.finishedAt?.toLocaleString() ?? "Unfinished"}`,
    })),
  ],
})) as { runId: string };
if (!runId) process.exit(1);

const documents = await prisma.document.findMany({
  where: { summaries: { some: { runId } } },
});

const documentsTableContent = documents
  .map(
    ({
      url,
      serviceId,
      characterCount,
      wordCount,
      syllableCount,
      polysyllabicWordCount,
      smog,
      fleschKincaid,
      fleschReadingEase,
      gunningFog,
      colemanLiau,
      daleChall,
    }) =>
      [
        url,
        serviceId,
        characterCount,
        wordCount,
        syllableCount,
        polysyllabicWordCount,
        smog,
        fleschKincaid,
        fleschReadingEase,
        gunningFog,
        colemanLiau,
        daleChall,
      ]
        .map(
          (value) => `${typeof value === "number" ? value.toFixed(2) : value}`,
        )
        .join(","),
  )
  .join("\n");

const documentsTable = `${["url", "serviceId", "characterCount", "wordCount", "syllableCount", "polysyllabicWordCount", "smog", "fleschKincaid", "fleschReadingEase", "gunningFog", "colemanLiau", "daleChall"].join(",")}
${documentsTableContent}`;

// const documentsTableContent = documents
//   .flatMap(
//     ({
//       url,
//       serviceId,
//       characterCount,
//       wordCount,
//       syllableCount,
//       polysyllabicWordCount,
//       smog,
//       fleschKincaid,
//       fleschReadingEase,
//       gunningFog,
//       colemanLiau,
//       daleChall,
//     }) => [
//       url,
//       serviceId,
//       characterCount,
//       wordCount,
//       syllableCount,
//       polysyllabicWordCount,
//       smog,
//       fleschKincaid,
//       fleschReadingEase,
//       gunningFog,
//       colemanLiau,
//       daleChall,
//     ],
//   )
//   .map((value) => `[${typeof value === "number" ? value.toFixed(2) : value}]`)
//   .join(", ");

// const documentsTable = `
// #figure(
//   table(
//     ${documentsTableContent},
//   columns: 12),
//   caption: [])
// ])
// `;

await Bun.write(Bun.file("./documentsTable.txt"), documentsTable);

const summaries = await prisma.summary.findMany({
  where: runId === "all" ? {} : { runId },
  include: { document: { select: { serviceId: true, url: true } } },
});

const summariesTableContent = summaries
  .map(
    ({
      documentUrl,
      bleuScore,
      f1Score,
      truePositiveCount,
      falsePositiveCount,
      falseNegativeCount,
      precision,
      recall,
    }) =>
      [
        documentUrl,
        bleuScore,
        f1Score,
        truePositiveCount,
        falsePositiveCount,
        falseNegativeCount,
        precision,
        recall,
      ]
        .map(
          (value) => `${typeof value === "number" ? value.toFixed(2) : value}`,
        )
        .join(","),
  )
  .join("\n");

const summariesTable = `${["documentUrl", "bleuScore", "f1Score", "truePositiveCount", "falsePositiveCount", "falseNegativeCount", "precision", "recall"].join(",")}
${summariesTableContent}`;

// const summariesTableContent = summaries
//   .flatMap(
//     ({
//       documentUrl,
//       bleuScore,
//       f1Score,
//       truePositiveCount,
//       falsePositiveCount,
//       falseNegativeCount,
//       precision,
//       recall,
//     }) => [
//       documentUrl,
//       bleuScore,
//       f1Score,
//       truePositiveCount,
//       falsePositiveCount,
//       falseNegativeCount,
//       precision,
//       recall,
//     ],
//   )
//   .map((value) => `[${typeof value === "number" ? value.toFixed(2) : value}]`)
//   .join(", ");

// const summariesTable = `
// #figure(
//   table(
//     ${summariesTableContent},
//   columns: 8),
//   caption: [])
// ])
// `;

await Bun.write(Bun.file("./summariesTable.txt"), summariesTable);
