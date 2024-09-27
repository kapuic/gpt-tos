import { Prisma } from "@prisma/client";
import { encode } from "gpt-3-encoder";
import { isObject, sum, uniq } from "lodash";
import { ChatParams, ChatResponse, ChatMessage } from "openai-fetch";
import { z } from "zod";

import { cases } from "./consts";
import LogUtils from "./utils/log";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nullToPrismaNull<T>(object: T): any {
  if (!isObject(object)) return object ?? Prisma.JsonNull;
  if (Array.isArray(object))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return object.map((element) => nullToPrismaNull(element));
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      value === null ? Prisma.JsonNull : nullToPrismaNull(value),
    ]),
  );
}

export const enum GPTError {
  APIError = "Error in API call to GPT",
  JsonError = "Response from GPT is not in JSON format",
  SchemaError = "Response from GPT does not match schema",
}

export function isGPTError(error: unknown): error is GPTError {
  return typeof error === "string";
}

export const gptResponseSchema = z
  .array(
    z.number().transform((id, context) => {
      if (id in cases) return cases[id];
      context.addIssue({
        fatal: true,
        code: z.ZodIssueCode.invalid_enum_value,
        message: `Case ID ${id} not found in cases`,
        received: id,
        options: Object.keys(cases),
      });
      return "";
    }),
  )
  .transform(uniq);

// export const gptResponseSchema = z.array(
//   z
//     // @ts-expect-error
//     .union(Object.keys(cases).map((id) => z.literal(id)))
//     .transform((id) => cases[id]),
// );

export type GPTResponse = z.infer<typeof gptResponseSchema>;

export type GPTParameters = Omit<Omit<ChatParams, "model">, "messages">;

export class GPTClient {
  model: string;
  prompt: (content?: string) => ChatMessage[];
  params: GPTParameters;

  constructor(
    model: string,
    prompt: (content: string) => ChatMessage[],
    parameters: GPTParameters = {},
  ) {
    this.model = model;
    this.prompt = (content?: string) => prompt(content ?? "{CONTENT}");
    // Sort params alphabetically to ensure consistent serialization.
    this.params = Object.fromEntries(
      Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  static fromChatParams(chatParameters: ChatParams) {
    const { model, messages, ...parameters } = chatParameters;
    return new GPTClient(
      model,
      (code) => {
        if (code !== "")
          LogUtils.warn(
            "GPTClient.prompt([non-empty string]) called on a GPTClient created from GPTClient.fromSerialized()",
          );
        return messages;
      },
      parameters,
    );
  }

  toChatParams(): ChatParams {
    return {
      model: this.model,
      messages: this.prompt(),
      ...this.params,
    };
  }

  get id() {
    return Bun.hash(JSON.stringify(this.toChatParams()));
  }

  get messagesHash() {
    return Bun.hash(JSON.stringify(this.prompt()));
  }

  toPrisma(): {
    id: Prisma.Decimal;
    model: string;
    messagesHash: Prisma.Decimal;
    messages: Prisma.InputJsonArray;
    params: Prisma.InputJsonValue;
  } {
    return {
      id: new Prisma.Decimal(this.id.toString()),
      model: this.model,
      messagesHash: new Prisma.Decimal(this.messagesHash.toString()),
      messages: this.prompt(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      params: nullToPrismaNull(this.params),
    };
  }

  async analyzeWithGPT(code: string): Promise<GPTResponse | GPTError> {
    const body: ChatParams = {
      model: this.model,
      messages: this.prompt(code),
      ...this.params,
    };

    let content: ChatMessage["content"] = null;
    try {
      const response = await fetch(
        `${process.env.OPENAI_BASE_URL}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as ChatResponse;
      content = result.choices[0].message.content!;
    } catch {
      return GPTError.APIError;
    }

    let parsedResponse: GPTResponse;
    try {
      parsedResponse = gptResponseSchema.parse(JSON.parse(content));
    } catch {
      return GPTError.SchemaError;
    }

    return parsedResponse;
  }
}

export function getContentsLength(messages: ChatMessage[]) {
  return messages.map(({ content }) => content).join("").length;
}

export function getContentsTokens(messages: ChatMessage[]) {
  return sum(
    messages.map(({ content }) => (content ? encode(content).length : 0)),
  );
}
