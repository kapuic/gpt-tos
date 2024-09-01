import type { Ora } from "ora";

export type ExceptionListener = NodeJS.UncaughtExceptionListener;

namespace ErrorUtils {
  let failOnErrorSpinner: Ora;

  let failOnErrorText: string | undefined;

  const errorFunctions: ExceptionListener[] = [];

  export function getFailOnErrorSpinner(): Ora {
    return failOnErrorSpinner;
  }

  export function getFailOnErrorText(): string | undefined {
    return failOnErrorText;
  }

  /**
   * When an error occurs, fails the `spinner` with the given `text`.
   *
   * @example
   *   const spinner = ErrorUtils.failIfError(
   *     ora("Spinning"),
   *     "Error while spinning",
   *   );
   *
   * @param spinner The spinner to fail.
   * @param text The text to fail the spinner with.
   * @returns The `spinner` for method chaining.
   */
  export function failOnError(spinner: Ora, text?: string): Ora {
    failOnErrorSpinner = spinner;
    failOnErrorText = text;
    return spinner;
  }

  export function getErrorFunctions(): NodeJS.UncaughtExceptionListener[] {
    return errorFunctions;
  }

  /**
   * Adds functions to be executed when an error occurs.
   *
   * @param functions Functions to be added.
   * @returns The `ErrorUtils` object for method chaining.
   */
  export function addErrorFunction(
    ...functions: ExceptionListener[]
  ): typeof ErrorUtils {
    errorFunctions.push(...functions);
    return ErrorUtils;
  }

  /**
   * Removes functions to be executed when an error occurs.
   *
   * @param functions Functions to be removed.
   * @returns The `ErrorUtils` object for method chaining.
   */
  export function removeErrorFunction(
    ...functions: ExceptionListener[]
  ): typeof ErrorUtils {
    for (const function_ of functions)
      errorFunctions.splice(errorFunctions.indexOf(function_));
    return ErrorUtils;
  }
}

export default ErrorUtils;
