import { z } from "zod";

export const topDomainsSchema = z
  .array(z.tuple([z.string(), z.string(), z.string(), z.string()]))
  .transform((rows) =>
    rows.map((row) => ({
      rank: Number.parseInt(row[0].replace(",", "")),
      domain: row[1],
      rating: Number.parseInt(row[2].split("<small>")[0]),
    })),
  );

export type TopDomains = z.infer<typeof topDomainsSchema>;

export const partialServiceSchema = z.object({
  id: z.number(),
  is_comprehensively_reviewed: z.boolean(),
  name: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
  slug: z.string(),
  rating: z.string().nullable(),
  urls: z.array(z.string()),
  image: z.string(),
});

export type PartialService = z.infer<typeof partialServiceSchema>;

export const fullServiceSchema = partialServiceSchema.extend({
  documents: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      url: z.string(),
      updated_at: z.string(),
      created_at: z.string(),
    }),
  ),
  points: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      source: z.string().nullable(),
      status: z.union([
        z.literal("approved"),
        z.literal("declined"),
        z.literal("disputed"),
        z.literal("pending"),
      ]),
      analysis: z.string(),
      case: z.object({
        id: z.number(),
        weight: z.number(),
        title: z.string(),
        description: z.string(),
        updated_at: z.string(),
        created_at: z.string(),
        topic_id: z.number(),
        classification: z.string(),
      }),
      document_id: z.number().nullable(),
      updated_at: z.string(),
      created_at: z.string(),
    }),
  ),
});

export type FullService = z.infer<typeof fullServiceSchema>;

export namespace APISchemas {
  export const getTopDomains = z.object({
    sEcho: z.number(),
    iTotalRecords: z.string(),
    iTotalDisplayRecords: z.string(),
    aaData: z.array(z.tuple([z.string(), z.string(), z.string(), z.string()])),
  });

  function tosdrApiSchema<T extends z.ZodType>(type: T) {
    return z.object({
      error: z.number(),
      message: z.string(),
      parameters: type,
    });
  }

  export const getService = tosdrApiSchema(fullServiceSchema);

  export const listServices = tosdrApiSchema(
    z.object({
      _page: z.object({
        total: z.number(),
        current: z.number(),
        start: z.number(),
        end: z.number(),
      }),
      services: z.array(partialServiceSchema),
    }),
  );
}
