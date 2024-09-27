import type { Document } from "@prisma/client";

import { bleu } from "bleu-score";

import type { FullService } from "./schemas";

import { getFullService, getServicePointsForDocument } from "./services";

export async function analyzeSummary(
  document: Partial<Document> & { serviceId: number; url: string },
  clauses: string[],
  fullService?: FullService,
) {
  const service = fullService ?? (await getFullService(document.serviceId));
  if (!service) throw new Error(`Service "${document.serviceId}" not found`);

  const points = getServicePointsForDocument(service, document.url);
  if (points.length === 0)
    throw new Error(`Service "${service.id}" has no points`);

  const reference = points.map(({ case: c }) => c.title.trim());

  const bleuScore = bleu(reference.join(" "), clauses.join(" "), 4);
  const truePositiveCount = clauses.filter((clause) =>
    reference.includes(clause),
  ).length;
  const falsePositiveCount = clauses.filter(
    (clause) => !reference.includes(clause),
  ).length;
  const falseNegativeCount = reference.filter(
    (reference) => !clauses.includes(reference),
  ).length;
  const precision =
    truePositiveCount / (truePositiveCount + falsePositiveCount);
  const recall = truePositiveCount / (truePositiveCount + falseNegativeCount);
  const f1Score = 2 * ((precision * recall) / (precision + recall));

  return {
    bleuScore,
    f1Score,
    truePositiveCount,
    falsePositiveCount,
    falseNegativeCount,
    precision,
    recall,
  };
}
