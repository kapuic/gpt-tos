import ora from "ora";
import { Script } from "../utils/commands";
import { getFullServices } from "../services";
import LogUtils from "../utils/log";
import prompts from "prompts";
import { analyzeSummary } from "../summaries";

const { prisma } = await Script.describe(
  "Analyzer",
  "This script will analyze documents and GPT summarizations, and find correlations between variables.",
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
const { run } = (await prompts({
  name: "run",
  type: "select",
  message:
    "Analyze which run? Create a run of summarizations by running `bun summarize`.",
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
})) as { run: string };
if (!run) process.exit(1);

const summaries = await prisma.summary.findMany({
  where: run === "all" ? {} : { runId: run },
  include: { document: { select: { serviceId: true, url: true } } },
});
const fullServices = await getFullServices(
  summaries.map(({ document }) => document.serviceId),
);

const spinnerSummaries = ora("Analyzing GPT summaries...").start();
let countSummaries = 0;

for (const { document, runId, clauses } of summaries) {
  countSummaries += 1;
  spinnerSummaries.text = `Analyzing GPT summaries (summary #${countSummaries} of ${summaries.length})...`;

  const service = fullServices.find(({ id }) => id === document.serviceId);
  if (!service) throw new Error(`Service "${document.serviceId}" not found`);

  await prisma.summary.update({
    where: { documentUrl_runId: { documentUrl: document.url, runId } },
    data: await analyzeSummary(document, clauses, service),
  });
}

spinnerSummaries.succeed();
