import ora from "ora";
import chalk from "chalk";
import { encode } from "gpt-3-encoder";
import boxen from "boxen";
import { cases, pricingInfo } from "../consts";
import Progress from "../utils/progress";
import LogUtils from "../utils/log";
import { GPTClient, GPTResponse, getContentsTokens, isGPTError } from "../gpt";
import {
  printEnvironmentConfig as printEnvironmentConfig,
  printGPTClientInfo,
} from "../output";
import { Script } from "../utils/commands";
import PromisePool from "@supercharge/promise-pool";
import prompts from "prompts";
import shortUUID from "short-uuid";
import { analyzeSummary } from "../summaries";

const { prisma } = await Script.describe(
  "Summarizer",
  "This script will run the study by summarizing all documents in a sample.",
);

const samples = await prisma.sample.findMany({
  include: { documents: true },
});
if (samples.length === 0) {
  LogUtils.error("No samples. Create a sample by running `bun sample`.");
  process.exit(1);
}
const { sample } = (await prompts({
  name: "sample",
  type: "select",
  message:
    "Run the study for which sample? Create a sample by running `bun sample`.",
  choices: samples.map((sample) => ({
    value: sample.id,
    title: `${sample.documents.length} documents`,
    description: `Created at ${sample.createdAt.toLocaleString()}`,
  })),
})) as { sample: string };
if (!sample) process.exit(1);

const documents = samples.find((s) => s.id === sample)?.documents ?? [];

const gptClient = new GPTClient(
  "gpt-4-0125-preview",
  (document) => [
    {
      role: "user",
      content: `"""
${document}
"""

Read the above Terms of Service (or Privacy Policy) document. If some clauses of the document match a case listed below, include the case's ID in your response. Respond with a JSON array of IDs for all cases that appear in the above document, not wrapped in a code block.

List of different cases (IDs and descriptions):
${Object.entries(cases)
  .map(([id, title]) => `${id}: ${title}`)
  .join(`\n`)}`,
    },
  ],
  {
    temperature: 0,
    seed: 0,
    response_format: { type: "json_object" },
    logit_bias: {
      198: -100, // Ban line breaks
    },
  },
);

const concurrentLimit = Number.parseInt(process.env.CONCURRENT_LIMIT ?? "10");
const maxAttempts = Number.parseInt(process.env.MAX_ATTEMPTS ?? "3");
const failsBeforeQuit = process.env.FAILS_BEFORE_QUIT
  ? Number.parseInt(process.env.FAILS_BEFORE_QUIT)
  : null;

printEnvironmentConfig({ concurrentLimit, maxAttempts, failsBeforeQuit });

printGPTClientInfo(gptClient);

if (gptClient.model in pricingInfo) {
  const spinnerPricing = ora("Calculating pricing...").start();

  const pricing = pricingInfo[gptClient.model as keyof typeof pricingInfo];

  let inputTokens = 0;
  for (let index = 0; index < documents.length; index++) {
    const { content } = documents[index];
    spinnerPricing.suffixText = `(Counting tokens, ${index + 1} of ${documents.length} documents)`;
    spinnerPricing.render();
    inputTokens += getContentsTokens(gptClient.prompt(content));
  }
  spinnerPricing.suffixText = "";
  const inputPrice = inputTokens * (pricing.input / 1000);

  const singleOutputTokens = encode(
    `["The terms may be changed at any time, but you will receive notification of the changes","When the service wants to change its terms, you are notified a week or more in advance.","When the service wants to make a material change to its terms, you are notified at least 30 days in advance","A license is kept on user-generated content even after you close your account","Content is published under a free license instead of a bilateral one","You are free to choose the type of copyright license that you want to use over your content","You can retrieve an archive of your data","You agree to indemnify and hold the service harmless in case of a claim related to your use of the service","You agree to defend, indemnify, and hold the service harmless in case of a claim related to your use of the service","Defend, indemnify, hold harmless; survives termination","You are responsible for maintaining the security of your account and for the activities on your account","Any liability on behalf of the service is only limited to the fees you paid as a user","This service is only available to users over a certain age","You maintain ownership of your content","This service provides a way for you to export your data","Your private content may be accessed by people working for the service","Your personal data is aggregated into statistics","Archives of their agreements are provided so that changes can be viewed over time","30 days of notice are given before closing your account","The service deletes tracking data after a period of time and allows you to opt out","You can choose the copyright license","Information is provided about security practices","Information is provided about how your personal data is used","Information is provided about what kind of information they collect","The court of law governing the terms is in a jurisdiction that is friendlier to user privacy protection.","Conditions may change, but your continued acceptance is not inferred from an earlier acceptance","You shall not interfere with another person's enjoyment of the service","The service provider makes no warranty regarding uninterrupted, timely, secure or error-free service","The service does not guarantee that software errors will be corrected","This service does not guarantee that it or the products obtained through it meet your expectations or requirements","You are responsible for any risks, damages, or losses that may incur by downloading materials","This service does not condone any ideas contained in its user-generated contents","This service assumes no liability for any losses or damages resulting from any matter relating to the service","Failure to enforce any provision of the Terms of Service does not constitute a waiver of such provision","The service reviews its privacy policy on a regular basis","The service will resist legal requests for your information where reasonably possible","Users who have been permanently banned from this service are not allowed to re-register under a new account","Promises will be kept after a merger or acquisition","Your identity is used in ads that are shown to other users","You should revisit the terms periodically, although in case of material changes, the service will notify","There is a date of the last update of the agreements","This service offers a symbolic but nonbinding statement about a matter of opinion, ethics, society, or politics","You aren’t forced into binding arbitration in case of disputes","Your personal data may be used for marketing purposes","You are forced into binding arbitration in case of disputes","This service may collect, use, and share location data","Your IP address is collected, which can be used to view your approximate location","The service has non-exclusive use of your content","Instead of asking directly, this Service will assume your consent to changes of terms merely from your usage.","You must provide your identifiable information","You must report to the service any unauthorized use of your account or any breach of security","Staff at this organisation recieve training about handling data","a changelog or past policy versions are available for review","users are notified of any material changes"]`,
  ).length;
  const singleOutputPrice = singleOutputTokens * (pricing.output / 1000);
  const outputTokens = singleOutputTokens * documents.length;
  const outputPrice = singleOutputPrice * documents.length;

  const sumTokens = inputTokens + outputTokens;
  const sumPrice = inputPrice + outputPrice;

  spinnerPricing.stop();

  LogUtils.log(
    boxen(
      `${chalk.bold(`${gptClient.model}`)}
Input:    $${pricing.input.toFixed(4)} per 1000 tokens
Output:   $${pricing.output.toFixed(4)} per 1000 tokens

${chalk.bold`Estimated Costs`}
Input:    $${inputPrice.toFixed(4)} (${inputTokens} tokens among ${
        documents.length
      } documents)
Output: + $${outputPrice.toFixed(4)} (${outputTokens} tokens)
          ↳ $${singleOutputPrice.toFixed(
            4,
          )} (${singleOutputTokens} tokens) per document x ${documents.length} documents
        --------------
Sum:    = $${sumPrice.toFixed(4)} (${sumTokens} tokens)`,
      {
        title: "Pricing",
        borderStyle: "round",
        padding: { left: 1, right: 1 },
      },
    ),
  );
} else {
  LogUtils.log(
    boxen(`Unknown model ${gptClient.model} for pricing.`, {
      title: "Pricing",
      borderStyle: "round",
      padding: { left: 1, right: 1 },
    }),
  );
}

await new Promise((resolve) => setTimeout(resolve, 2000));
await Script.requestConfirmation();

const promptData = gptClient.toPrisma();
await prisma.prompt.createMany({
  data: promptData,
  skipDuplicates: true,
});
LogUtils.done(`Created prompt ${promptData.id.toString()} in database.`);

const runId = shortUUID.generate();
await prisma.run.create({
  data: {
    id: runId,
    promptId: promptData.id.toString(),
  },
});
LogUtils.done(`Created run ${runId} in database.`);

let fails = 0;

const progressSummarize = new Progress(
  "Summarizing ToS policies...",
  documents.length,
  50,
);

await PromisePool.for(documents)
  .withConcurrency(concurrentLimit)
  .process(async ({ content, url, serviceId }) => {
    if (failsBeforeQuit && fails >= failsBeforeQuit) {
      return LogUtils.warn(`Reached ${fails} fails. Skipping ${url}...`);
    }

    let response: GPTResponse | null = null;
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const responseOrError = await gptClient.analyzeWithGPT(content);
      if (!isGPTError(responseOrError)) {
        response = responseOrError;
        break;
      }

      LogUtils.error(
        `Error analyzing ${url} (attempt #${attempts}): ${responseOrError}`,
      );
    }

    if (!response) {
      fails++;
      LogUtils.alert(
        `Failed to analyze ${url} after ${maxAttempts} attempts (fail #${fails}). Skipping...`,
      );
      progressSummarize.increase();
      return;
    }

    // LogUtils.log("Summary")
    //   .applyIndent()
    //   .log(response.map((title) => `- ${title}`).join("\n"))
    //   .applyIndent(-1)
    //   .log("Reference")
    //   .applyIndent()
    //   .log(
    //     getServicePointsForDocument(await getFullService(serviceId), url)
    //       .map(({ case: c }) => c.title)
    //       .map((title) => `- ${title}`)
    //       .join("\n"),
    //   )
    //   .applyIndent(-1);

    const analysis = await analyzeSummary({ serviceId, url }, response);

    await prisma.summary.create({
      data: {
        documentUrl: url,
        runId,
        clauses: response,
        ...analysis,
      },
    });

    progressSummarize.increase();
  });

await prisma.run.update({
  where: { id: runId },
  data: { finishedAt: new Date() },
});
LogUtils.done(`Summarized ${documents.length} documents.`);

process.exit();
