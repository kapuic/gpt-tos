namespace SignalUtils {
  export const beforeAbortFunctions: SignalsListener[] = [];

  export const afterAbortFunctions: SignalsListener[] = [];

  /**
   * Adds functions to be executed when an abort signal is received.
   *
   * @param functions Functions to be added.
   * @returns The `SignalUtils` object for method chaining.
   */
  export function addBeforeAbortFunction(
    ...functions: SignalsListener[]
  ): typeof SignalUtils {
    beforeAbortFunctions.push(...functions);
    return SignalUtils;
  }

  /**
   * Removes functions to be executed when an abort signal is received.
   *
   * @param functions Functions to be removed.
   * @returns The `SignalUtils` object for method chaining.
   */
  export function removeBeforeAbortFunction(
    ...functions: SignalsListener[]
  ): typeof SignalUtils {
    for (const function_ of functions)
      beforeAbortFunctions.splice(beforeAbortFunctions.indexOf(function_));
    return SignalUtils;
  }

  /**
   * Adds functions to be executed when an abort signal is received.
   *
   * @param functions Functions to be added.
   * @returns The `SignalUtils` object for method chaining.
   */
  export function addAfterAbortFunction(
    ...functions: SignalsListener[]
  ): typeof SignalUtils {
    afterAbortFunctions.push(...functions);
    return SignalUtils;
  }

  /**
   * Removes functions to be executed when an abort signal is received.
   *
   * @param functions Functions to be removed.
   * @returns The `SignalUtils` object for method chaining.
   */
  export function removeAfterAbortFunction(
    ...functions: SignalsListener[]
  ): typeof SignalUtils {
    for (const function_ of functions)
      afterAbortFunctions.splice(afterAbortFunctions.indexOf(function_));
    return SignalUtils;
  }
}

export default SignalUtils;
