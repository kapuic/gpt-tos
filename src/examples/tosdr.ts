import chalk from "chalk";
import { table } from "table";
import { z } from "zod";
import LogUtils from "../utils/log.js";

const casesSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    updated_at: z.object({
      timezone: z.string(),
      pgsql: z.string(),
      unix: z.number(),
    }),
    created_at: z.object({
      timezone: z.string(),
      pgsql: z.string(),
      unix: z.number(),
    }),
    classification: z.object({ hex: z.number(), human: z.string() }),
    links: z.object({
      phoenix: z.object({
        case: z.string(),
        new_comment: z.string(),
        edit: z.string(),
      }),
      crisp: z.object({ api: z.string() }),
    }),
  }),
);

// Type Cases = z.infer<typeof casesSchema>;

export const schema = z.object({
  error: z.number(),
  message: z.string(),
  parameters: z.object({
    _page: z.object({
      total: z.number(),
      current: z.number(),
      start: z.number(),
      end: z.number(),
    }),
    cases: casesSchema,
  }),
});

const enum Rating {
  Good = "good",
  Bad = "bad",
  Neutral = "neutral",
  Blocker = "blocker",
}

type Cases = {
  id: number;
  title: string;
  description: string;
  rating: Rating;
  weight: number;
}[];
let cases: Cases = [];

let currentPage = 0;
let pageCount = 1;

do {
  currentPage++;
  const response = await fetch(
    `https://api.tosdr.org/case/v1/?page=${currentPage}`,
  );
  const result = await response.json();
  const parsed = schema.parse(result);
  pageCount = parsed.parameters._page.end;

  cases.push(
    ...parsed.parameters.cases
      .filter(({ title }) => title !== "none")
      .map(({ id, title, description, classification }) => ({
        id: Number.parseInt(id),
        title,
        description,
        rating: classification.human as Rating,
        weight: classification.hex,
      })),
  );
} while (currentPage < pageCount);

LogUtils.done(`Found ${cases.length} cases`);

cases = cases.sort(({ id: a }, { id: b }) => a - b);

function mapCasesToRows(cases: Cases) {
  return cases.map(({ id, title, rating }) => [
    id,
    rating === Rating.Good
      ? chalk.green(title)
      : rating === Rating.Bad
        ? chalk.yellow(title)
        : rating === Rating.Blocker
          ? chalk.red(title)
          : chalk.gray(title),
  ]);
}

console.log(
  table([
    ["ID", "Title"],
    ...mapCasesToRows(cases.filter(({ rating }) => rating === Rating.Good)),
    ...mapCasesToRows(cases.filter(({ rating }) => rating === Rating.Neutral)),
    ...mapCasesToRows(cases.filter(({ rating }) => rating === Rating.Bad)),
    ...mapCasesToRows(cases.filter(({ rating }) => rating === Rating.Blocker)),
  ]),
);

console.log(
  cases
    .filter(({ rating }) => rating === Rating.Good)
    .map(({ id, title }) => `[${id}], [${title}]`),
);

// Convert cases to JSON object with key id and value title.
// console.log(
//   JSON.stringify(
//     cases.reduce(
//       (acc, { id, title }) => {
//         acc[id] = title;
//         return acc;
//       },
//       {} as Record<number, string>,
//     ),
//     null,
//     2,
//   ),
// );
