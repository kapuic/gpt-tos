import chalk from "chalk";
import boxen from "boxen";
import LogUtils from "./utils/log";
import { type GPTClient, getContentsLength, getContentsTokens } from "./gpt";
import { isArray } from "lodash";

export interface EnvironmentConfig {
  concurrentLimit: number;
  maxAttempts: number;
  failsBeforeQuit: number | null;
}

export function printEnvironmentConfig(environment: EnvironmentConfig) {
  LogUtils.log(
    boxen(
      `Concurrent Limit: ${environment.concurrentLimit}
${chalk.dim(
  environment.concurrentLimit > 1
    ? `(At most) ${environment.concurrentLimit} code files will be analyzed simultaneously.`
    : "One code file will be analyzed at a time.",
)}
Max Attempts: ${environment.maxAttempts}
${chalk.dim(
  environment.maxAttempts > 1
    ? `For each code file, there will be ${
        environment.maxAttempts - 1
      } retries if something goes wrong. This will incur additional costs.`
    : "No automatic retry if something goes wrong.",
)}
${
  environment.failsBeforeQuit
    ? `Fails Before Quit: ${environment.failsBeforeQuit}`
    : "Fails Before Quit: Off"
}
${chalk.dim(
  environment.failsBeforeQuit
    ? `If analyses of ${environment.failsBeforeQuit} code files fail, any remaining code files will be skipped.`
    : "Analyze all code files even if some (or a lot of) analyses fail.",
)}`,
      {
        title: "Configuration",
        borderStyle: "round",
        padding: { left: 1, right: 1 },
      },
    ),
  );
}

export function printGPTClientInfo(gptClient: GPTClient) {
  LogUtils.log(
    boxen(
      `
Model: ${gptClient.model}
Prompt ID: ${gptClient.id} (Messages Hash: ${gptClient.messagesHash})
Length: ${gptClient.prompt("").length} messages
        ${getContentsLength(gptClient.prompt(""))} characters
        ${getContentsTokens(gptClient.prompt(""))} tokens

Temperature: ${gptClient.params.temperature ?? "Default"}
Top P: ${gptClient.params.top_p ?? "Default"}
Stop: ${isArray(gptClient.params.stop) ? gptClient.params.stop.join(", ") : gptClient.params.stop ?? "Default"}
Max Tokens: ${gptClient.params.max_tokens ?? "Default"}
Presence Penalty: ${gptClient.params.presence_penalty ?? "Default"}
Frequency Penalty: ${gptClient.params.frequency_penalty ?? "Default"}
Logit Bias: ${gptClient.params.logit_bias ? JSON.stringify(gptClient.params.logit_bias) : "None"}
`,
      {
        title: "Prompt",
        borderStyle: "round",
        padding: { left: 1, right: 1 },
      },
    ),
  );
}
