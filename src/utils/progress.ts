import ora, { type Ora } from "ora";
import { SingleBar } from "cli-progress";
import { toSeconds } from "./common.js";
import ErrorUtils from "./error.js";

export default class Progress {
  spinner?: Ora;
  progressBar?: SingleBar;

  /** Message to display. */
  message: string;
  /** Number of items processed so far. */
  current = 0;
  /** Total number of items to be processed. */
  total: number;

  /** Time at which the progress started. */
  startTime: number;
  /**
   * Time at which the progress ended. If the progress is still ongoing, this
   * will be `-1`.
   */
  endTime = -1;

  increase(progress = 1, rerender = true): void {
    this.current += progress;
    if (this.current === this.total) {
      this.endTime = performance.now();
    }

    if (this.progressBar) {
      this.progressBar.increment(progress);
      if (this.current === this.total) {
        this.progressBar.stop();
      }
    }

    if (this.spinner) {
      this.spinner.text = `${this.message} (${this.current}/${this.total})`;
      if (rerender) {
        this.spinner.render();
      }

      if (this.current === this.total) {
        this.spinner.succeed(
          `${this.message} (${this.current}/${this.total}, ${toSeconds(
            this.endTime - this.startTime,
          )}s)`,
        );
      }
    }
  }

  constructor(
    /** Message to display. */
    message: string,
    /** Total number of items to be processed. */
    total: number,
    /**
     * If the total is greater than this threshold, a progress bar will be used
     * instead of a spinner.
     */
    threshold: number,
    /** Time at which the progress started. */
    startTime: number = performance.now(),
  ) {
    this.message = message;
    this.total = total;
    this.startTime = startTime;
    if (total > threshold) {
      this.progressBar = new SingleBar({
        format: `${message} || {bar} ({value}/{total}) || {percentage}% | Estimated remaining {eta_formatted} | {duration_formatted}`,
      });
      this.progressBar.start(total, 0);
    } else {
      this.spinner = ErrorUtils.failOnError(
        ora(`${message} (${this.current}/${total})`),
      ).start();
    }
  }
}
