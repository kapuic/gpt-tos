import chalk from "chalk";
import ErrorUtils from "./error.js";
import LogUtils from "./log.js";
import SignalUtils from "./signal.js";

namespace ListenerUtils {
  /**
   * Registers an `uncaughtException` listener to the `process`, which logs the
   * error (using {@linkcode LogUtils.error()}) and exits the process (using
   * `process.exit()`) with a "failure" code (`1`), when an error occurs.
   *
   * @returns The `ListenerUtils` object for method chaining.
   */
  export function registerExceptionListener(): typeof ListenerUtils {
    process.on("uncaughtException", (error, origin) => {
      if (ErrorUtils.getFailOnErrorSpinner()) {
        ErrorUtils.getFailOnErrorSpinner().fail(
          ErrorUtils.getFailOnErrorText(),
        );
      }

      LogUtils.error(`${chalk.red.bold(error.name)} ${error.message}`);
      if (error.stack) {
        LogUtils.error(chalk.dim(error.stack.replace(/\w+: .*\n/, "")));
      }

      for (const function_ of ErrorUtils.getErrorFunctions()) {
        function_(error, origin);
      }

      process.exit(1);
    });
    return ListenerUtils;
  }

  /** @returns The `ListenerUtils` object for method chaining. */
  export function registerAbortListener(): typeof ListenerUtils {
    const listener: SignalsListener = (signal) => {
      for (const function_ of SignalUtils.beforeAbortFunctions) {
        function_(signal);
      }

      if (ErrorUtils.getFailOnErrorSpinner()) {
        ErrorUtils.getFailOnErrorSpinner().warn(
          `${
            ErrorUtils.getFailOnErrorText() ??
            ErrorUtils.getFailOnErrorSpinner().text
          } (canceled by user)`,
        );
      }

      LogUtils.error("Received abort signal. Exiting");
      for (const function_ of SignalUtils.afterAbortFunctions) {
        function_(signal);
      }

      process.exit(1);
    };

    process.on("SIGTERM", listener);
    process.on("SIGINT", listener);
    return ListenerUtils;
  }
}

export default ListenerUtils;
