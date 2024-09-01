import { cases } from "../consts.js";
import { GPTClient } from "../gpt.js";
import { Script } from "../utils/commands.js";

const { prisma } = await Script.describe("Migrator", "");

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
    .join("\n")}`,
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

const promptData = gptClient.toPrisma();
await prisma.prompt.update({
  data: promptData,
  where: { id: "3952014665375759457" },
});
