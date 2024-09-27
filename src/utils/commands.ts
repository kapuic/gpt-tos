import { PrismaClient } from "@prisma/client";
import chalk from "chalk";
import prompts from "prompts";

import LogUtils from "./log";

export namespace Script {
  export async function describe(title: string, description: string) {
    LogUtils.log("", chalk.cyan.bold(title), description, "");
    return { prisma: await usePrisma() };
  }

  export async function usePrisma() {
    const prisma = new PrismaClient();
    try {
      await prisma.$connect();
    } catch (error) {
      LogUtils.error(
        "Cannot initialize Prisma. Please check your database connection.",
        error as Error,
      );
      process.exit(1);
    }
    return prisma;
  }

  export async function requestConfirmation() {
    const answer = await prompts({
      name: "continue",
      message: "Continue?",
      type: "confirm",
    });
    if (!answer.continue) {
      process.exit();
    }
  }
}
