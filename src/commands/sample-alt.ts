import { extract } from "@extractus/article-extractor";
import ora from "ora";
import pRetry from "p-retry";
import prompts from "prompts";
import shortUUID from "short-uuid";

import { analyzeDocumentComplexity } from "../complexities";
import {
  getFullService,
  getServiceList,
  getServicePointsForDocument,
} from "../services";
import { Script } from "../utils/commands";
import LogUtils from "../utils/log";

const { prisma } = await Script.describe(
  "Sampler",
  "This script will create a sample of services.",
);

const serviceList = await getServiceList();
const reviewedServices = serviceList.filter(
  ({ is_comprehensively_reviewed }) => is_comprehensively_reviewed,
);

const samples = await prisma.sample.findMany({
  include: { documents: { select: { url: true } } },
});
let { location } = (await prompts({
  name: "location",
  type: "select",
  message: "Add these documents to...",
  choices: [
    { value: "new", title: "New Sample..." },
    ...samples.map((sample) => ({
      value: sample.id,
      title: sample.name
        ? `${sample.name} (${sample.documents.length})`
        : `${sample.documents.length} documents`,
      description: `Created at ${sample.createdAt.toLocaleString()}`,
    })),
  ],
})) as { location: string };
if (!location) process.exit(1);

if (location === "new") {
  let { name: inputName } = (await prompts({
    name: "name",
    type: "text",
    message: "Name the new sample (optional):",
  })) as { name: string };
  inputName = inputName.trim();
  const name = inputName.length > 0 ? inputName : null;

  location = shortUUID.generate();
  await prisma.sample.create({
    data: { id: location, name },
  });
  LogUtils.done(
    `Created new sample ${name ? `${name} (${location})` : location}.`,
  );
}

const existingDocumentUrls =
  samples
    .find((sample) => sample.id === location)
    ?.documents.map((document) => document.url) ?? [];

const { sampleSize } = (await prompts({
  type: "number",
  name: "sampleSize",
  message: "Minimum amount of documents to sample:",
  initial: 278,
  validate: (size) => (size < 1 ? "Sample size must be greater than 0." : true),
})) as { sampleSize: number };
if (!sampleSize) process.exit(1);

const spinnerSample = ora("Sampling documents...").start();

function removeHTMLTags(string_: string) {
  return string_.replaceAll(/<[^>]*>?/gm, "");
}
function removeExtraWhiteLines(string_: string) {
  return string_.replaceAll(/\n{3,}/g, "\n\n");
}

const sample: string[] = [];

while (sample.length < sampleSize) {
  const index = Math.floor(Math.random() * reviewedServices.length);

  const partialService = reviewedServices[index];
  reviewedServices.splice(index, 1);

  try {
    const service = await getFullService(partialService);
    await prisma.service.createMany({
      data: { id: service.id },
      skipDuplicates: true,
    });

    for (const document of service.documents) {
      if (getServicePointsForDocument(service, document.url).length === 0)
        continue;
      if (sample.includes(document.url)) continue;
      if (existingDocumentUrls.includes(document.url)) continue;

      try {
        await pRetry(
          async () => {
            const documentUrl = `https://web.archive.org/web/${document.updated_at
              .slice(0, 10)
              .replaceAll(
                "-",
                "",
              )}${document.updated_at.slice(11, 19).replaceAll(":", "")}/${document.url}`;

            const article = await extract(documentUrl);
            if (!article?.content) {
              throw new Error("Failed to extract content from the document.");
            }

            const content = removeExtraWhiteLines(
              removeHTMLTags(article.content),
            );

            const complexity = analyzeDocumentComplexity(content);

            await prisma.document.createMany({
              data: {
                url: document.url,
                content,
                rawContent: article.content,
                serviceId: service.id,
                ...complexity,
                sentences: JSON.stringify(complexity.sentences),
              },
              skipDuplicates: true,
            });
            sample.push(document.url);
          },
          { retries: 3 },
        );
      } catch {
        // TODO
      }

      spinnerSample.text = `Sampling documents... (collected ${sample.length} of ${sampleSize})`;
    }
  } catch {
    // TODO
  }
}

spinnerSample.succeed(`Sampled ${sample.length} documents.`);

await prisma.sample.update({
  where: { id: location },
  data: {
    documents: { connect: sample.map((url) => ({ url })) },
  },
});
LogUtils.done(`Added ${sample.length} documents to sample ${location}.`);
